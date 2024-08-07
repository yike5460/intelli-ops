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
    // Define the prompt to send to
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
    
    Here are a few examples of the expected output format:
    
    [
      {
        "name": "Test add function with positive numbers",
        "type": "direct",
        "code": "test('add function with positive numbers', () => { expect(add(2, 3)).toBe(5); });"
      },
      {
        "name": "Test subtract function with negative result",
        "type": "direct",
        "code": "test('subtract function with negative result', () => { expect(subtract(5, 10)).toBe(-5); });"
      },
      {
        "name": "Test multiply function with zero",
        "type": "direct",
        "code": "test('multiply function with zero', () => { expect(multiply(7, 0)).toBe(0); });"
      },
      {
        "name": "Test private helper method indirectly",
        "type": "indirect",
        "code": "test('private helper method indirectly', () => { const result = publicMethodUsingPrivateHelper(5); expect(result).toBe(10); });"
      },
      {
        "name": "Main function",
        "type": "not-testable",
        "code": ""
      }
    ]
    
    Ensure that your response is a valid JSON array containing objects with the specified structure. Do not include any explanatory text outside of the JSON array.
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
    console.log('Generated unit tests:', finalResult);
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
}

export async function runUnitTests(testCases: TestCase[]): Promise<void> {
    if (!Array.isArray(testCases) || testCases.length === 0) {
        console.log('Input test cases', testCases);
        console.log('No test cases to run');
        return;
    }
    const testDir = path.join(__dirname, '..', 'test');
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
        execSync('npx jest', { stdio: 'inherit' });
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
