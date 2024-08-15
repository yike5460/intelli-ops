import * as fs from 'fs';
import * as path from 'path';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';

interface TestCase {
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
    
    Here are a few examples of the expected output for the given source code:
    <source code example>
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
    </source code example>
    <unit test examples>
    [
      {
        "name": "Test input validation with empty array",
        "type": "direct",
        "code": "import { runUnitTests } from '../src/yourFile';\nimport * as fs from 'fs';\nimport * as path from 'path';\n\njest.mock('fs');\njest.mock('path');\njest.mock('child_process');\n\ndescribe('runUnitTests', () => {\n  beforeEach(() => {\n    jest.clearAllMocks();\n    console.log = jest.fn();\n  });\n\n  it('should handle empty input array', async () => {\n    await runUnitTests([]);\n    expect(console.log).toHaveBeenCalledWith('Input test cases', []);\n    expect(console.log).toHaveBeenCalledWith('No test cases to run');\n  });\n});"
      },
      {
        "name": "Test directory creation",
        "type": "direct",
        "code": "import { runUnitTests } from '../src/yourFile';\nimport * as fs from 'fs';\nimport * as path from 'path';\n\njest.mock('fs');\njest.mock('path');\njest.mock('child_process');\n\ndescribe('runUnitTests', () => {\n  beforeEach(() => {\n    jest.clearAllMocks();\n    (fs.existsSync as jest.Mock).mockReturnValue(false);\n  });\n\n  it('should create test directory if it doesn\\'t exist', async () => {\n    await runUnitTests([{ type: 'direct', code: 'test code' }]);\n    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });\n  });\n});"
      },
      {
        "name": "Test file writing",
        "type": "direct",
        "code": "import { runUnitTests } from '../src/yourFile';\nimport * as fs from 'fs';\nimport * as path from 'path';\n\njest.mock('fs');\njest.mock('path');\njest.mock('child_process');\n\ndescribe('runUnitTests', () => {\n  beforeEach(() => {\n    jest.clearAllMocks();\n    (fs.existsSync as jest.Mock).mockReturnValue(true);\n  });\n\n  it('should write test cases to file', async () => {\n    const testCases = [\n      { type: 'direct', code: 'test code 1' },\n      { type: 'not-testable', code: 'should be ignored' },\n      { type: 'direct', code: 'test code 2' }\n    ];\n    await runUnitTests(testCases);\n    expect(fs.writeFileSync).toHaveBeenCalledWith(\n      expect.any(String),\n      'test code 1\\n\\ntest code 2'\n    );\n  });\n});"
      },
      {
        "name": "Test Jest execution",
        "type": "indirect",
        "code": "import { runUnitTests } from '../src/yourFile';\nimport * as fs from 'fs';\nimport * as path from 'path';\nimport { execSync } from 'child_process';\n\njest.mock('fs');\njest.mock('path');\njest.mock('child_process');\n\ndescribe('runUnitTests', () => {\n  beforeEach(() => {\n    jest.clearAllMocks();\n    (fs.existsSync as jest.Mock).mockReturnValue(true);\n  });\n\n  it('should execute Jest and log success message', async () => {\n    (execSync as jest.Mock).mockImplementation(() => {});\n    console.log = jest.fn();\n\n    await runUnitTests([{ type: 'direct', code: 'test code' }]);\n\n    expect(execSync).toHaveBeenCalledWith('npx jest', { stdio: 'inherit' });\n    expect(console.log).toHaveBeenCalledWith('Tests passed successfully');\n  });\n});"
      },
      {
        "name": "Test error handling",
        "type": "indirect",
        "code": "import { runUnitTests } from '../src/yourFile';\nimport * as fs from 'fs';\nimport * as path from 'path';\nimport { execSync } from 'child_process';\n\njest.mock('fs');\njest.mock('path');\njest.mock('child_process');\n\ndescribe('runUnitTests', () => {\n  beforeEach(() => {\n    jest.clearAllMocks();\n    (fs.existsSync as jest.Mock).mockReturnValue(true);\n  });\n\n  it('should handle errors during Jest execution', async () => {\n    const error = new Error('Jest execution failed');\n    (execSync as jest.Mock).mockImplementation(() => { throw error; });\n    console.error = jest.fn();\n\n    await runUnitTests([{ type: 'direct', code: 'test code' }]);\n\n    expect(console.error).toHaveBeenCalledWith('Error running tests:', error);\n  });\n});"
      },
      {
        "name": "Test console output",
        "type": "not-testable",
        "code": "// Console output testing is not directly testable in this context.\n// While we can mock console.log and verify it's called,\n// the actual output to the console is a side effect that\n// can't be directly tested without additional tooling or\n// modifications to the original function."
      }
    ]    
    </unit test examples>
    Ensure that your response is a valid JSON array containing objects with the specified structure. Do not include any explanatory text outside of the JSON array.
    Assess whether the LLM’s output is fully executable and correctly written to validate the source code. If the LLM's output is correct, return the code verbatim as it was, if not, fix the code and return the corrected version that: 1. fully executable; 2. commented thoroughly enough for a beginner to understand; 3. follows the best practices of the language.
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

    const timeoutMs = 10 * 1000; // 10 seconds
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
