import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { context } from "@actions/github";
import { getOctokit } from "@actions/github";
import { PullRequest } from "../utils";
import { ICompletionModel, LanguageModel } from "./languageModel";
import { TestValidator } from "./testValidator";
import { ITestResultCollector, BaseTestResultCollector } from "./resultCollector";
import { PromptRefiner } from "./promptRefiner";
import { Inputs, Prompts } from "../prompts";
import { SnippetMap } from "./snippetMap";
import { createSourceMapSource } from "typescript";

export class TestGenerator {
    private worklist: Prompts[] = [];

    constructor(
        private temperatures: number[],
        private snippetMap: SnippetMap,
        private model: ICompletionModel,
        private validator: TestValidator,
        private collector: ITestResultCollector
    ) {}

    async generateAndValidateTests(fileContent: string, snippets: string[]): Promise<void> {
        console.log('Generating and validating tests with fileContent:\n', fileContent, '\nand snippets:\n', snippets);
        const inputs: Inputs = new Inputs()
        inputs.fileContent = fileContent

        const functions = this.extractFunctions(fileContent);
        for (const func of functions) {
            const initialPrompt: Prompts = new Prompts()
            inputs.functionBody = func

            for (const temperature of this.temperatures) {
                let generatedPassingTests = false;
                this.worklist = [initialPrompt];
                let attempts = 0;
                const maxAttempts = 5; // Limit the number of attempts per temperature

                while (this.worklist.length > 0 && attempts < maxAttempts) {
                    const prompt = this.worklist.pop()!;
                    
                    if (this.collector.hasPrompt(prompt)) {
                        continue;
                    }
                    const completions = await this.model.getCompletions(prompt.renderUnitTestGenerationPrompt(inputs), temperature)
                    this.collector.recordPromptInfo(prompt, completions.length);
                    
                    // TODO: There is only one completion for now, try to refactor the getCompletions execute multiple times
                    for (const completion of completions) {
                        const testInfo = this.validateCompletion(prompt, completion);
                        if (testInfo.outcome.status === "PASSED") {
                            generatedPassingTests = true;
                            this.collector.recordTestResult(testInfo);
                            break;
                        } else if (testInfo.outcome.status === "FAILED") {
                            // Re-render the prompt with the error, simple promptRefiner implementation
                            inputs.error = testInfo.outcome.error
                            const refinedPrompt = new Prompts(prompt.renderUnitTestGenerationPrompt(inputs));
                            console.log('Refined prompt: ', refinedPrompt, '\nIn attempt: ', attempts)
                            if (!this.collector.hasPrompt(refinedPrompt)) {
                                this.worklist.push(refinedPrompt);
                            }
                        }
                        this.collector.recordTestResult(testInfo);
                    }

                    if (generatedPassingTests) {
                        break;
                    }

                    attempts++;
                }

                if (generatedPassingTests) {
                    break;
                }
            }
        }

        const coverageSummary = this.validator.getCoverageSummary();
        this.collector.recordCoverageInfo(coverageSummary);
    }

    private validateCompletion(prompt: Prompts, completion: string): any {
        const testSource = completion
        const testInfo = {
            testName: `test_${Date.now()}`,
            testSource,
            prompt,
            completion
        };

        this.collector.recordTestInfo(testInfo);

        if (completion.trim() === "") {
            return { ...testInfo, outcome: { status: "FAILED", error: "Empty completion" } };
        }
        // console.log('Validating test: ', testInfo.testSource, '\nName: ', testInfo.testName)
        const outcome = this.validator.validateTest(testInfo.testName, testInfo.testSource);
        console.log('Outcome for the test: ', testInfo.testName, '\n', outcome)
        return { ...testInfo, outcome };
    }
    // TODO: Use a proper TypeScript parser like typescript-estree.
    private extractFunctions(fileContent: string): string[] {
        const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*(?::\s*\w+)?\s*{[^}]*}/g;
        return fileContent.match(functionRegex) || [];
    }
}

export async function generateUnitTestsSuite(
    client: BedrockRuntimeClient,
    modelId: string,
    octokit: ReturnType<typeof getOctokit>,
    repo: { owner: string, repo: string },
    unitTestSourceFolder: string
): Promise<void> {
    const pullRequest = context.payload.pull_request as PullRequest;
    const branchName = pullRequest.head.ref;
    let allTestCases: any[] = [];

    // Check if the "auto-unit-test-baseline" tag exists
    const { data: tags } = await octokit.rest.repos.listTags({
        ...repo,
        per_page: 100,
    });
    const baselineTagExists = tags.some(tag => tag.name === 'auto-unit-test-baseline');

    if (!baselineTagExists) {
        // Generate tests for all .ts files in the specified folder
        try {
            const { data: files } = await octokit.rest.repos.getContent({
                ...repo,
                path: unitTestSourceFolder,
            });
            if (Array.isArray(files)) {
                for (const file of files) {
                    console.log('Debugging file:', file);
                    if (file.type === 'file' && file.name.endsWith('.ts')) {
                        const { data: content } = await octokit.rest.repos.getContent({
                            ...repo,
                            path: file.path,
                        });
                        console.log('Debugging file content:', content);
                        if ('content' in content && typeof content.content === 'string') {
                            const decodedContent = Buffer.from(content.content, 'base64').toString('utf8');
                            console.log('Debugging decoded content:', decodedContent);
                            const testCases = await generateTestCasesForFile(client, modelId, decodedContent);
                            allTestCases = allTestCases.concat(testCases);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to list files in the specified folder:', error);
            return;
        }

        // Create the baseline tag
        try {
            await octokit.rest.git.createRef({
                ...repo,
                ref: 'refs/tags/auto-unit-test-baseline',
                sha: pullRequest.head.sha,
            });
            console.log('Tag auto-unit-test-baseline created successfully');
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
        } catch (error) {
            console.error('Failed to create tag:', error);
        }
    } else {
        // Generate tests only for files changed in the PR
        const { data: changedFiles } = await octokit.rest.pulls.listFiles({
            ...repo,
            pull_number: pullRequest.number,
        });

        for (const file of changedFiles) {
            if (file.filename.startsWith(unitTestSourceFolder) && file.filename.endsWith('.ts')) {
                const { data: content } = await octokit.rest.repos.getContent({
                    ...repo,
                    path: file.filename,
                    ref: pullRequest.head.sha,
                });
                if ('content' in content && typeof content.content === 'string') {
                    const decodedContent = Buffer.from(content.content, 'base64').toString('utf8');
                    const testCases = await generateTestCasesForFile(client, modelId, decodedContent);
                    allTestCases = allTestCases.concat(testCases);
                }
            }
        }
    }

    if (allTestCases.length === 0) {
        console.warn('No test cases generated. Skipping unit tests execution and report generation.');
        return;
    }

    // Add the generated unit tests to existing PR
    if (pullRequest) {
        try {
            if (!branchName) {
                throw new Error('Unable to determine the branch name');
            }

            // Create a new file with the generated unit tests in test folder
            const unitTestsContent = allTestCases.map(tc => tc.code).join('\n\n');
            const unitTestsFileName = 'test/unit_tests.ts';

            // Check if the file already exists
            let fileSha: string | undefined;
            try {
                const { data: existingFile } = await octokit.rest.repos.getContent({
                    ...repo,
                    path: unitTestsFileName,
                    ref: branchName,
                });
                if ('sha' in existingFile) {
                    fileSha = existingFile.sha;
                }
            } catch (error) {
                console.log(`File ${unitTestsFileName} does not exist in the repository. Creating it.`);
            }

            await octokit.rest.repos.createOrUpdateFileContents({
                ...repo,
                path: unitTestsFileName,
                message: 'Add or update generated unit tests',
                content: Buffer.from(unitTestsContent).toString('base64'),
                branch: branchName,
                sha: fileSha,
            });

            console.log(`Unit tests file ${unitTestsFileName} created or updated successfully.`);

        } catch (error) {
            console.error('Error occurred while pushing the changes to the PR branch', error);
            throw error;
        }
    }
}

async function generateTestCasesForFile(
    client: BedrockRuntimeClient,
    modelId: string,
    fileContent: string
): Promise<any[]> {
    const temperatures = [0.2, 0.5, 0.8, 1.0];
    const snippetMap = new SnippetMap();
    const model = new LanguageModel(client, modelId);
    const validator = new TestValidator();
    const collector = new BaseTestResultCollector();

    const testGenerator = new TestGenerator(
        temperatures,
        snippetMap,
        model,
        validator,
        collector
    );

    await testGenerator.generateAndValidateTests(fileContent, []); // Assuming no snippets for now

    return collector.getTestResults();
}