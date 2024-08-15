import { generateUnitTests } from '../src/yourFile';
import { InvokeModelCommand, BedrockRuntimeClient } from '@bedrock-ai/bedrock-runtime';

jest.mock('@bedrock-ai/bedrock-runtime');

describe('generateUnitTests', () => {
  let mockClient: BedrockRuntimeClient;

  beforeEach(() => {
    mockClient = new BedrockRuntimeClient({});
    jest.clearAllMocks();
  });

  it('should invoke the API and parse the response', async () => {
    const mockResponse = {
      body: new TextEncoder().encode(JSON.stringify({ completion: '[{"type":"direct","code":"test code"}]' })),
    };
    (InvokeModelCommand.prototype.send as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await generateUnitTests(mockClient, 'modelId', 'sourceCode');

    expect(result).toEqual([{ type: 'direct', code: 'test code' }]);
    expect(InvokeModelCommand).toHaveBeenCalledWith({
      modelId: 'modelId',
      contentType: 'application/json',
      body: JSON.stringify({
        prompt: expect.any(String),
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });
  });

  it('should handle API errors', async () => {
    const error = new Error('API error');
    (InvokeModelCommand.prototype.send as jest.Mock).mockRejectedValueOnce(error);

    await expect(generateUnitTests(mockClient, 'modelId', 'sourceCode')).rejects.toThrow(error);
  });
});


import { runUnitTests } from '../src/yourFile';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

jest.mock('fs');
jest.mock('path');
jest.mock('child_process');

describe('runUnitTests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  it('should create test directory if it doesn\'t exist', async () => {
    await runUnitTests([{ type: 'direct', code: 'test code' }]);
    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it('should write test cases to file', async () => {
    const testCases = [
      { type: 'direct', code: 'test code 1' },
      { type: 'not-testable', code: 'should be ignored' },
      { type: 'direct', code: 'test code 2' },
    ];
    await runUnitTests(testCases);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      'test code 1\n\ntest code 2'
    );
  });

  it('should execute pytest and log success message', async () => {
    (execSync as jest.Mock).mockImplementation(() => {});
    console.log = jest.fn();

    await runUnitTests([{ type: 'direct', code: 'test code' }]);

    expect(execSync).toHaveBeenCalledWith('pytest tests/test_generated.py', { stdio: 'inherit' });
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should handle errors during pytest execution', async () => {
    const error = new Error('pytest execution failed');
    (execSync as jest.Mock).mockImplementation(() => { throw error; });
    console.error = jest.fn();

    await runUnitTests([{ type: 'direct', code: 'test code' }]);

    expect(console.error).toHaveBeenCalledWith('Error running tests:', error);
  });
});


import { generateTestReport } from '../src/yourFile';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('path');

describe('generateTestReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  it('should create reports directory if it doesn\'t exist', async () => {
    const testCases = [
      { type: 'direct', code: 'test code' },
      { type: 'indirect', code: 'test code' },
      { type: 'not-testable', code: 'test code' },
    ];
    await generateTestReport(testCases);
    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it('should generate a report with correct statistics', async () => {
    const testCases = [
      { type: 'direct', code: 'test code' },
      { type: 'indirect', code: 'test code' },
      { type: 'not-testable', code: 'test code' },
    ];
    await generateTestReport(testCases);
    const expectedReport = {
      totalTests: 3,
      directTests: 1,
      indirectTests: 1,
      notTestable: 1,
    };
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify(expectedReport, null, 2)
    );
  });
});


import { setupPythonEnvironment } from '../src/yourFile';
import { execSync } from 'child_process';

jest.mock('child_process');

describe('setupPythonEnvironment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a virtual environment and install pytest', async () => {
    (execSync as jest.Mock).mockImplementation(() => {});

    await setupPythonEnvironment();

    expect(execSync).toHaveBeenCalledWith('python -m venv venv');
    expect(execSync).toHaveBeenCalledWith('source venv/bin/activate && pip install pytest');
  });

  it('should handle errors during setup', async () => {
    const error = new Error('Setup failed');
    (execSync as jest.Mock).mockImplementation(() => { throw error; });
    console.error = jest.fn();

    await setupPythonEnvironment();

    expect(console.error).toHaveBeenCalledWith('Error setting up Python environment:', error);
  });
});
