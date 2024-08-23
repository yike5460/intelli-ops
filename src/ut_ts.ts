import * as fs from 'fs';
import * as path from 'path';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';

export interface TestCase {
    name: string;
    type: 'direct' | 'indirect' | 'not-testable';
    code: string;
}

async function generateFakeResponse(): Promise<TestCase[]> {
  // Return a predefined fake response structure
  return [
      {
          name: 'Default Unit Test',
          type: 'direct',
          code: "test('default test', () => { expect(true).toBe(true); });",
      },
  ];
}

export async function generateUnitTests(client: BedrockRuntimeClient, modelId: string, sourceCode: string): Promise<TestCase[]> {
    // Define the prompt to send to Claude
    const prompt = `
    You are an expert TypeScript developer specializing in unit testing. Your task is to analyze the following TypeScript code and generate comprehensive unit tests using Jest.

    <source_code>
    ${sourceCode}
    </source_code>

    Please follow these steps:
    1. Carefully read and understand the provided TypeScript code.
    2. Categorize each method into one of these types:
       a) Methods that can be tested directly
       b) Methods that can be tested indirectly
       c) Methods that are not unit-testable
    3. For each testable method, create a unit test using Jest.
    4. Structure your response as a JSON array of test cases, where each test case has the following format:
       {
           "name": "Test name",
           "type": "direct" | "indirect" | "not-testable",
           "code": "The actual test code"
       }

    Important guidelines:
    - Ensure your tests are comprehensive and cover various scenarios, including edge cases.
    - Use clear and descriptive test names.
    - Include comments in your test code to explain the purpose of each test.
    - Follow TypeScript and Jest best practices.
    - For methods that are not unit-testable, explain why in a comment.

    Here's an example of the expected output format:
    <example>
    [
      {
        "name": "Test input validation with empty array",
        "type": "direct",
        "code": "import { runUnitTests } from '../src/yourFile';\nimport * as fs from 'fs';\nimport * as path from 'path';\n\njest.mock('fs');\njest.mock('path');\njest.mock('child_process');\n\ndescribe('runUnitTests', () => {\n  beforeEach(() => {\n    jest.clearAllMocks();\n    console.log = jest.fn();\n  });\n\n  it('should handle empty input array', async () => {\n    // Test that the function handles an empty input array correctly\n    await runUnitTests([]);\n    expect(console.log).toHaveBeenCalledWith('Input test cases', []);\n    expect(console.log).toHaveBeenCalledWith('No test cases to run');\n  });\n});"
      }
    ]
    </example>

    After generating the test cases, please review your output and ensure:
    1. The tests are fully executable and correctly written.
    2. The code is thoroughly commented for a beginner to understand.
    3. The tests follow TypeScript and Jest best practices.

    Provide your response as a valid JSON array containing objects with the specified structure. Do not include any explanatory text outside of the JSON array.
    `;

    console.log('Generating unit tests with total prompt length:', prompt.length + sourceCode.length);

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

    const timeoutMs = 45 * 1000; // 45 seconds considering the prompt length
    try {
      const apiResponse = await Promise.race([
        client.send(command),
        setTimeout(timeoutMs),
      ]);
      if (apiResponse === undefined) {
        console.log('Request timed out, returning fake response');
        // Return default or fake response
        return await generateFakeResponse();
      }
      const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
      const responseBody = JSON.parse(decodedResponseBody);
      const finalResult = responseBody.content[0].text;
      // Parse the finalResult string into an array of TestCase objects
      try {
        const parsedTestCases = JSON.parse(finalResult) as TestCase[];
        if (!Array.isArray(parsedTestCases)) {
            throw new Error('Parsed result is not an array');
        }
        console.log('generated test cases:', parsedTestCases);
        return parsedTestCases;
      } catch (error) {
          console.error('Failed to parse AI response into TestCase array:', error);
          console.log('Raw AI response:', finalResult);
          return [];
      }
    } catch (error) {
      console.error('Error occurred while generating unit tests:', error);
      return [];
  }
}

export async function runUnitTests(testCases: TestCase[]): Promise<void> {
    if (!Array.isArray(testCases) || testCases.length === 0) {
        console.log('Input test cases', testCases);
        console.log('No test cases to run');
        return;
    }
    // note this is the temporary directory for storing the generated test cases while the actual test cases pushed to the repo are 'test/unit_tests.ts' handled the main function
    const testDir = path.join(__dirname, '..', 'generated_tests');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    console.log('Writing test cases to:', testDir, testCases);
    const testFilePath = path.join(testDir, 'generated.test.ts');
    const testFileContent = testCases
        .filter(tc => tc.type !== 'not-testable')
        .map(tc => tc.code)
        .join('\n\n');

    fs.writeFileSync(testFilePath, testFileContent);

    try {
        // log out the execution result of the test
        execSync(`npx jest ${testFilePath}`, { stdio: 'inherit' });
        console.log('Tests passed successfully');
    } catch (error) {
        console.error('Error running tests:', error);
    }
}

export async function generateTestReport(testCases: TestCase[]): Promise<void> {
    if (!Array.isArray(testCases)) {
        console.log('Invalid test cases input. Skipping report generation.');
        return;
    }
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

    // TODO: upload the artifact from the report directory as an artifact named "logs", using actions/upload-artifact@v4
    console.log('Test report generated:', report);
}