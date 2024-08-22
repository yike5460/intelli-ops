import { generateUnitTests } from '../src/yourFile';
import { BedrockRuntimeClient, InvokeModelCommand } from 'aws-bedrock-runtime';

jest.mock('aws-bedrock-runtime');

describe('generateUnitTests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate unit tests from source code', async () => {
    const mockClient = new BedrockRuntimeClient({});
    const mockResponse = {
      body: new TextEncoder().encode(JSON.stringify({ completion: '[{ "type": "direct", "code": "test code" }]' }))
    };
    (InvokeModelCommand as jest.Mock).mockReturnValue({ send: jest.fn().mockResolvedValue(mockResponse) });

    const result = await generateUnitTests(mockClient, 'modelId', 'sourceCode');
    expect(result).toEqual([{ type: 'direct', code: 'test code' }]);
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
    console.log = jest.fn();
  });

  it('should handle empty input array', async () => {
    await runUnitTests([]);
    expect(console.log).toHaveBeenCalledWith('Input test cases', []);
    expect(console.log).toHaveBeenCalledWith('No test cases to run');
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
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  it('should write test cases to file', async () => {
    const testCases = [
      { type: 'direct', code: 'test code 1' },
      { type: 'not-testable', code: 'should be ignored' },
      { type: 'direct', code: 'test code 2' }
    ];
    await runUnitTests(testCases);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      'test code 1\n\ntest code 2'
    );
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
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (execSync as jest.Mock).mockImplementation(() => {});
    console.log = jest.fn();
  });

  it('should execute Jest and log success message', async () => {
    await runUnitTests([{ type: 'direct', code: 'test code' }]);
    expect(execSync).toHaveBeenCalledWith('npx jest', { stdio: 'inherit' });
    expect(console.log).toHaveBeenCalledWith('Tests passed successfully');
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
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    console.error = jest.fn();
  });

  it('should handle errors during Jest execution', async () => {
    const error = new Error('Jest execution failed');
    (execSync as jest.Mock).mockImplementation(() => { throw error; });

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

  it('should generate test report and write to file', async () => {
    const testCases = [
      { type: 'direct', code: 'test code 1' },
      { type: 'indirect', code: 'test code 2' },
      { type: 'not-testable', code: 'should be ignored' }
    ];
    await generateTestReport(testCases);

    const expectedReport = {
      totalTests: 3,
      directTests: 1,
      indirectTests: 1,
      notTestable: 1
    };

    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(expect.any(String), JSON.stringify(expectedReport, null, 2));
  });
});

import { setupPythonEnvironment } from '../src/yourFile';
import { execSync } from 'child_process';

jest.mock('child_process');

describe('setupPythonEnvironment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  it('should set up Python environment and install pytest', async () => {
    (execSync as jest.Mock)
      .mockImplementationOnce(() => {})
      .mockImplementationOnce(() => {});

    await setupPythonEnvironment();

    expect(execSync).toHaveBeenCalledWith('python -m venv venv');
    expect(execSync).toHaveBeenCalledWith('source venv/bin/activate && pip install pytest');
  });

  it('should handle errors during Python environment setup', async () => {
    const error = new Error('Python environment setup failed');
    (execSync as jest.Mock).mockImplementation(() => { throw error; });

    await setupPythonEnvironment();
    expect(console.error).toHaveBeenCalledWith('Error setting up Python environment:', error);
  });
});

// Console output testing is not directly testable in this context.
// While we can mock console.log and verify it's called,
// the actual output to the console is a side effect that
// can't be directly tested without additional tooling or
// modifications to the original function.