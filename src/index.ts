import * as core from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// current we support typescript and python, while the python library is not available yet, we will use typescript as the default language
// using abosolute path to import the functions from ut_ts.ts
import { generateUnitTests, runUnitTests, generateTestReport } from '@/src/ut_ts';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface PullRequest {
  number: number;
  body: string;
  head: {
    sha: string;
    ref: string;
  };
}

interface ReviewComment {
  path: string;
  body: string;
  position?: number;
}

interface PullFile {
  filename: string;
  status: string;
  patch?: string;
}

// This function splits the content into chunks of maxChunkSize
function splitContentIntoChunks(content: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  content.split('\n').forEach(line => {
    if (currentChunk.length + line.length > maxChunkSize) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += line + '\n';
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function shouldExcludeFile(filename: string, excludePatterns: string[]): boolean {
  return excludePatterns.some(pattern => {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    return regex.test(filename);
  });
}

const pr_generation_prompt =
`
<task context>
You are a developer tasked with creating a pull request (PR) for a software project. Your primary goal is to provide a clear and informative description of the changes you are proposing.
</task context>

<tone context>
Maintain a professional and informative tone. Be clear and concise in your descriptions.
</tone context>

<code_change>
This pull request includes the following changes:
[Insert the code change to be referenced in the PR description, including file names and line numbers if applicable]
</code_change>

<detailed_task_description>
Please include a summary of the changes in one of the following categories:
- Bug fix (non-breaking change which fixes an issue)
- New feature (non-breaking change which adds functionality)
- Breaking change (fix or feature that would cause existing functionality to not work as expected)
- This change requires a documentation update

Please also include relevant motivation and context. List any dependencies that are required for this change.
</detailed_task_description>

<output_format>
Provide your PR description in the following format:
# Description
[Insert the PR description here]

## Type of change
[Select one of the following options in the checkbox]
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update
</output_format>
`;

const fixed_pr_generation_template = `
# How Has This Been Tested?

Please describe the tests that you ran to verify your changes. Provide instructions so we can reproduce. Please also list any relevant details for your test configuration

- [ ] Test A
- [ ] Test B

**Test Configuration**:
* Firmware version:
* Hardware:
* Toolchain:
* SDK:

# Checklist:

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules
`;

async function generatePRDescription(files: PullFile[], octokit: ReturnType<typeof getOctokit>, repo: { owner: string, repo: string }, pullNumber: number): Promise<string> {
  const pullRequest = context.payload.pull_request as PullRequest;
  const fileChanges = await Promise.all(files.map(async (file) => {
    const { data: content } = await octokit.rest.repos.getContent({
      ...repo,
      path: file.filename,
      ref: pullRequest.head.sha,
    });
    return `${file.filename}: ${file.status}`;
  }));

  const description = pr_generation_prompt.replace('[Insert the code change to be referenced in the PR description, including file names and line numbers if applicable]', fileChanges.join('\n'));

  return description;
}

async function generateUnitTestsSuite(client: BedrockRuntimeClient, modelId: string, octokit: ReturnType<typeof getOctokit>, repo: { owner: string, repo: string }): Promise<void> {
  const pullRequest = context.payload.pull_request as PullRequest;
  console.log('Generating unit tests suite for PR #', pullRequest.number);

  // Execute the code_layout.sh script
  const outputFile = 'combined_code_dump.txt';
  const scriptPath = path.join(__dirname, 'code_layout.sh');
  execSync(`chmod +x "${scriptPath}" && "${scriptPath}" . ${outputFile} py js java cpp ts`, { stdio: 'inherit' });

  // Read the combined code
  const combinedCode = fs.readFileSync(outputFile, 'utf8');
  // TODO, split the content into chunks of maxChunkSize, truncate the content if it exceeds the maxChunkSize
  const maxChunkSize = 1024;
  const chunks = splitContentIntoChunks(combinedCode, maxChunkSize);
  if (chunks[0] !== undefined) {
    // log the processing phase
    console.log(`Processing chunk 1 of ${chunks.length}`);
    const testCases = await generateUnitTests(client, modelId, chunks[0]);
    await runUnitTests(testCases);
    await generateTestReport(testCases);
  }
  console.log('Unit tests and report generated successfully.');
  // Add the generated unit tests to existing PR
  if (pullRequest) {
    try {
      const branchName = pullRequest.head.ref;
      const testCases: any[] = []; // Declare the testCases variable

      if (!branchName) {
        throw new Error('Unable to determine the branch name');
      }

      console.log(`Adding unit tests to PR #${pullRequest.number} on branch: ${branchName}`);

      // Generate a summary of the unit tests with the number of test case according to the testCases array
      const unitTestsSummary = `Generated ${testCases.length} unit tests`;

      // Update the PR description with the unit tests summary
      // const currentDescription = pullRequest.body || '';
      // const updatedDescription = `${currentDescription}\n\n## Generated Unit Tests\n\n${unitTestsSummary}`;
      // await octokit.rest.pulls.update({
      //   ...repo,
      //   pull_number: pullRequest.number,
      //   body: updatedDescription,
      // });
      // console.log('PR description updated with unit tests summary.');

      // Create a new file with the generated unit tests
      const unitTestsContent = testCases.map(tc => tc.code).join('\n\n');
      const unitTestsFileName = 'generated_unit_tests.py';  // or .ts, depending on your project

      await octokit.rest.repos.createOrUpdateFileContents({
        ...repo,
        path: unitTestsFileName,
        message: 'Add generated unit tests',
        content: Buffer.from(unitTestsContent).toString('base64'),
        branch: branchName,
      });
      console.log(`Unit tests added to PR as ${unitTestsFileName}`);

    } catch (error) {
      console.error('Error occurred while pushing the changes to the PR branch', error);
      throw error;
    }
  }
}

// Refer to https://google.github.io/eng-practices/review/reviewer/looking-for.html and https://google.github.io/eng-practices/review/reviewer/standard.html
const detailed_review_prompt = 
`<task_context>
You are an expert code reviewer tasked with reviewing a code change (CL) for a software project. Your primary goal is to ensure that the overall code health of the system is improving while allowing developers to make progress. Your feedback should be constructive, educational, and focused on the most important issues.
</task_context>

<tone_context>
Maintain a constructive and educational tone. Be thorough but not overly pedantic. Remember that the goal is continuous improvement, not perfection.
</tone_context>

<background_data>
<project_info>
[Insert brief description of the project, its goals, and any relevant context]
</project_info>

<code_change>
[Insert the code change to be reviewed, including file names and line numbers if applicable]
</code_change>
</background_data>

Provide your review in ONLY one of the following formats, if changed code is too simple or not fitting in categories below, please answer "No review needed":

<detailed_task_description>
Review the provided code change, considering the following aspects:
1. Design: Evaluate the overall design and how it integrates with the existing system.
2. Functionality: Assess if the code does what it's intended to do and if it's good for the users.
3. Complexity: Check if the code is more complex than necessary.
4. Tests: Verify the presence and quality of unit, integration, or end-to-end tests.
5. Naming: Ensure clear and appropriate naming for variables, functions, and classes.
6. Comments: Check for clear and useful comments that explain why, not what.
7. Style: Verify adherence to the project's style guide.
8. Documentation: Check if necessary documentation is updated or added.
9. Potential issues: Look for possible concurrency problems, edge cases, or error handling issues.
10. Code health: Assess if the change improves the overall code health of the system.

Provide feedback on these aspects, categorizing your comments as follows:
- Critical: Issues that must be addressed before approval.
- Improvement: Suggestions that would significantly improve the code but aren't blocking.
- Nitpick: Minor stylistic or preferential changes, prefixed with "Nit:".
</detailed_task_description>

<rules>
1. Focus on the most important issues that affect code health and functionality.
2. Balance the need for improvement with the need to make progress.
3. Be specific in your feedback, referencing line numbers when applicable.
4. Explain the reasoning behind your suggestions, especially for design-related feedback.
5. If suggesting an alternative approach, briefly explain its benefits.
6. Acknowledge good practices and improvements in the code.
7. If relevant, mention any educational points that could help the developer learn, prefixed with "Learning opportunity:".
</rules>

<output_format>
Provide your review in the following format. Limit your response to 200 words. Note if changed code is too simple or not fitting in categories below, please answer only "No Review Needed, LGTM!" directly, don't include any further details in categories below.

Summary:
[Conclude the review with one of the following statements: "Approve", "Approve with minor modifications", or "Request changes", in ONLY one of the categories below]

Critical Issues:
[List any critical issues that need to be addressed]

Improvements:
[List suggested improvements]

Nitpicks:
[List any nitpicks or minor suggestions]
</output_format>

<immediate_task>
Please review the provided code change and provide your feedback following the guidelines and format specified above.
</immediate_task>
`;

const concise_review_prompt = `
<task_context>
You are an expert code reviewer tasked with reviewing a code change (CL) for a software project. Your primary goal is to ensure that the overall code health of the system is improving while allowing developers to make progress. Your feedback should be constructive, educational, and focused on the most important issues.
</task_context>

<tone_context>
Maintain a constructive and educational tone. Be thorough but not overly pedantic. Remember that the goal is continuous improvement, not perfection.
</tone_context>

<code_change>
[Insert the code change to be reviewed, including file names and line numbers if applicable]
</code_change>

<detailed_task_description>
Review the provided code change, considering the following aspects:
1. Design: Evaluate the overall design and how it integrates with the existing system.
2. Functionality: Assess if the code does what it's intended to do and if it's good for the users.
3. Complexity: Check if the code is more complex than necessary.
4. Tests: Verify the presence and quality of unit, integration, or end-to-end tests.
5. Naming: Ensure clear and appropriate naming for variables, functions, and classes.
6. Comments: Check for clear and useful comments that explain why, not what.
7. Style: Verify adherence to the project's style guide.
8. Documentation: Check if necessary documentation is updated or added.
9. Potential issues: Look for possible concurrency problems, edge cases, or error handling issues.
10. Code health: Assess if the change improves the overall code health of the system.

Provide feedback on these aspects, categorizing your comments as follows:
- Critical: Issues that must be addressed before approval.
- Improvement: Suggestions that would significantly improve the code but aren't blocking.
</detailed_task_description>

<rules>
1. Focus on the most important issues that affect code health and functionality.
2. Balance the need for improvement with the need to make progress.
3. Be specific in your feedback, referencing line numbers when applicable.
4. Explain the reasoning behind your suggestions, especially for design-related feedback.
5. If suggesting an alternative approach, briefly explain its benefits.
6. Acknowledge good practices and improvements in the code.
7. If relevant, mention any educational points that could help the developer learn, prefixed with "Learning opportunity:".
</rules>

<output_format>
Provide your review in the following format. Limit your response to 200 words. Note if changed code is too simple or not fitting in categories below, please answer only "No Review Needed, LGTM!" directly, don't include any further details in categories below.

Summary:
[Conclude the review with one of the following statements: "Approve", "Approve with minor modifications", or "Request changes", in ONLY one of the categories below, Note if changed code is too simple or not fitting in categories below, please answer "No Review Needed, LGTM!" directly. Limit your response to 200 words.]

Critical Issues:
[List any critical issues that need to be addressed]

Improvements:
[List suggested improvements]

</output_format>

<immediate_task>
Please review the provided code change and provide your feedback following the guidelines and format specified above.
</immediate_task>
`;

export async function invokeModel(client: BedrockRuntimeClient, modelId: string, payloadInput: string): Promise<string> {

  // seperate branch to invoke RESTFul endpoint exposed by API Gateway, if the modelId is prefixed with string like "sagemaker.<api id>.execute-api.<region>.amazonaws.com/prod"
  if (modelId.startsWith("sagemaker.")) {
    // invoke RESTFul endpoint e.g. curl -X POST -H "Content-Type: application/json" -d '{"prompt": "import argparse\ndef main(string: str):\n    print(string)\n    print(string[::-1])\n    if __name__ == \"__main__\":", "parameters": {"max_new_tokens": 256, "temperature": 0.1}}' https://<api id>.execute-api.<region>.amazonaws.com/prod
    const endpoint = modelId.split("sagemaker.")[1];

    // invoke the RESTFul endpoint with the payload
    const payload = {
      prompt: payloadInput,
      parameters: {
        max_new_tokens: 256,
        temperature: 0.1,
      },
    };

    const response = await fetch(`https://${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json();
    // extract the generated text from the response, the output payload should be in the format { "generated_text": "..." } using codellama model for now 
    const finalResult = (responseBody as { generated_text: string }).generated_text;

    return finalResult;
  }

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [{
          type: "text",
          text: payloadInput,
        }],
      },
    ],
  };

  const command = new InvokeModelCommand({
    // modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
    modelId: modelId,
    contentType: "application/json",
    body: JSON.stringify(payload),
  });

  const apiResponse = await client.send(command);
  const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
  const responseBody = JSON.parse(decodedResponseBody);
  const finalResult = responseBody.content[0].text;

  return finalResult;
}

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('github-token');
    const awsRegion = core.getInput('aws-region');
    const modelId = core.getInput('model-id');
    const excludeFiles = core.getInput('exclude-files');
    const reviewLevel = core.getInput('review-level');
    const generatePRDesc = core.getInput('generate-pr-description');
    const generateUnitTestSuite = core.getInput('generate-unit-test-suite');

    const excludePatterns = excludeFiles ? excludeFiles.split(',').map(p => p.trim()) : [];

    console.log(`GitHub Token: ${githubToken ? 'Token is set' : 'Token is not set'}`);
    console.log(`AWS Region: ${awsRegion}`);
    console.log(`Model ID: ${modelId}`);
    console.log(`Excluded files: ${excludeFiles}`);
    console.log(`Review level: ${reviewLevel}`);
    console.log(`Generate PR description: ${generatePRDesc ? 'Yes' : 'No'}`);

    if (!githubToken) {
      throw new Error('GitHub token is not set');
    }

    const bedrockClient = new BedrockRuntimeClient({ region: awsRegion || 'us-east-1' });
    const octokit = getOctokit(githubToken);

    if (!context.payload.pull_request) {
      console.log('No pull request found in the context. This action should be run only on pull request events.');
      return;
    }

    const pullRequest = context.payload.pull_request as PullRequest;
    const repo = context.repo;

    console.log(`Reviewing PR #${pullRequest.number} in ${repo.owner}/${repo.repo}`);

    const { data: files } = await octokit.rest.pulls.listFiles({
      ...repo,
      pull_number: pullRequest.number,
    });

    // branch to generate PR description
    if (generatePRDesc) {
      const prDescriptionTemplate = await generatePRDescription(files as PullFile[], octokit, repo, pullRequest.number);
      // invoke model to generate complete PR description
      const payloadInput = prDescriptionTemplate;
      const prDescription = await invokeModel(bedrockClient, modelId, payloadInput);

      // append fixed template content to the generated PR description
      const prDescriptionWithTemplate = prDescription + fixed_pr_generation_template;

      await octokit.rest.pulls.update({
        ...repo,
        pull_number: pullRequest.number,
        body: prDescriptionWithTemplate,
      });
      console.log('PR description updated successfully.');
    }

    // branch to generate unit tests suite
    if (generateUnitTestSuite) {
      await generateUnitTestsSuite(bedrockClient, modelId, octokit, repo);
    }

    let reviewComments: ReviewComment[] = [];

    for (const file of files as PullFile[]) {
      if (file.status !== 'removed' && file.patch && !shouldExcludeFile(file.filename, excludePatterns)) {
        console.log(`Reviewing file: ${file.filename}`);

        const changedLines = file.patch
          .split('\n')
          .filter(line => line.startsWith('+') && !line.startsWith('+++'))
          .map(line => line.substring(1));

        if (changedLines.length === 0) continue;

        const fileContent = changedLines.join('\n');
        const promptTemplate = reviewLevel === 'concise' ? concise_review_prompt : detailed_review_prompt;
        let formattedContent = promptTemplate.replace('[Insert the code change to be reviewed, including file names and line numbers if applicable]', fileContent);

        // invoke model to generate review comments
        const payloadInput = formattedContent;
        var review = await invokeModel(bedrockClient, modelId, payloadInput);  

        // log the generated review comments and check if it is empty
        console.log(`Review comments ${review} generated for file: ${file.filename}`);
        if (!review || review.trim() == '') {
          console.log("No review comments generated for file: {}", file.filename);
          // add default review comment
          review = "No review needed, LGTM!";
          continue;
        }
        const position = file.patch.split('\n').findIndex(line => line.startsWith('+') && !line.startsWith('+++')) + 1;
        if (position > 0) {
          reviewComments.push({
            path: file.filename,
            body: review,
            position: position,
          });
        }
      } else {
        console.log(`Skipping file: ${file.filename}`);
      }
    }

    if (reviewComments.length > 0) {
      await octokit.rest.pulls.createReview({
        ...repo,
        pull_number: pullRequest.number,
        event: 'COMMENT',
        comments: reviewComments,
      });
      console.log('Code review comments posted successfully.');
    } else {
      console.log('No review comments to post.');
    }

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Error: ${error.message}`);
      console.error('Stack trace:', error.stack);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();
