import * as fs from 'fs';
import * as path from 'path';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { execSync } from 'child_process';

interface TestCase {
    name: string;
    type: 'direct' | 'indirect' | 'not-testable';
    code: string;
}

export async function generateUnitTests(client: BedrockRuntimeClient, modelId: string, sourceCode: string): Promise<TestCase[]> {
    const prompt = `
    Analyze the following TypeScript code and generate unit tests:

    ${sourceCode}

    Categorize the methods into:
    1. Methods that can be tested directly
    2. Methods that can be tested indirectly
    3. Methods that are not unit-testable

    For each testable method, create a unit test. Use Jest as the testing framework.
    Return the results as a JSON array of test cases, where each test case has the following structure:
    {
        "name": "Test name",
        "type": "direct" | "indirect" | "not-testable",
        "code": "The actual test code"
    }
    `;

    console.log('Generating unit tests with prompt length:', prompt.length + sourceCode.length);

    // exact the same implementation as function invokeModel in index.ts
    const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [{
              type: "text",
              text: prompt,
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

export async function runUnitTests(testCases: TestCase[]): Promise<void> {
    const testDir = path.join(__dirname, '..', 'test');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    const testFilePath = path.join(testDir, 'generated.test.ts');
    const testFileContent = testCases
        .filter(tc => tc.type !== 'not-testable')
        .map(tc => tc.code)
        .join('\n\n');

    fs.writeFileSync(testFilePath, testFileContent);

    try {
        execSync('npx jest', { stdio: 'inherit' });
    } catch (error) {
        console.error('Error running tests:', error);
    }
}

export async function generateTestReport(testCases: TestCase[]): Promise<void> {
    const report = {
        totalTests: testCases.length,
        directTests: testCases.filter(tc => tc.type === 'direct').length,
        indirectTests: testCases.filter(tc => tc.type === 'indirect').length,
        notTestable: testCases.filter(tc => tc.type === 'not-testable').length,
    };

    const reportDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}
