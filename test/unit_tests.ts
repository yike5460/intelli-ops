import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';

jest.mock('fs');
jest.mock('path');
jest.mock('child_process');

describe('combine_files', () => {
  let originalCwd;
  let outputFilePath;

  beforeEach(() => {
    originalCwd = process.cwd();
    process.chdir('/path/to/repo');
    outputFilePath = path.join(process.cwd(), 'combined_output.txt');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    jest.clearAllMocks();
  });

  it('should combine files with functions extracted', () => {
    const extractMode = 'functions';
    const fileExtensions = ['py', 'js'];
    const mockFiles = [
      '/path/to/repo/file1.py',
      '/path/to/repo/file2.js',
      '/path/to/repo/node_modules/file3.js', // Should be ignored
    ];
    const mockFileContents = {
      '/path/to/repo/file1.py': 'def func1(): pass\
def func2(): pass',
      '/path/to/repo/file2.js': 'function func3() {}\
function func4() {}',
    };

    childProcess.spawn = jest.fn(() => ({
      stdout: {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from(mockFiles.join('\\0')));
          }
        }),
      },
    }));

    fs.readFileSync = jest.fn((filePath) => mockFileContents[filePath]);

    const combineFiles = require('../code_layout').combine_files;
    combineFiles('/path/to/repo', extractMode, fileExtensions);

    const expectedOutput = fs.readFileSync.mock.calls.flatMap(([ filePath ]) => [
      `// File: ${filePath}`,
      ...(mockFileContents[filePath].match(/function\\s+\\w+\\s*\\([^)]*\\)/g) || []),
      '',
    ]).join('\
');

    expect(fs.writeFileSync).toHaveBeenCalledWith(outputFilePath, expectedOutput);
  });

  // Add more test cases for different scenarios
});


import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';

jest.mock('fs');
jest.mock('path');
jest.mock('child_process');

describe('combine_files', () => {
  let originalCwd;
  let outputFilePath;

  beforeEach(() => {
    originalCwd = process.cwd();
    process.chdir('/path/to/repo');
    outputFilePath = path.join(process.cwd(), 'combined_output.txt');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    jest.clearAllMocks();
  });

  it('should combine files with whole file content', () => {
    const extractMode = 'whole';
    const fileExtensions = ['py', 'js'];
    const mockFiles = [
      '/path/to/repo/file1.py',
      '/path/to/repo/file2.js',
      '/path/to/repo/node_modules/file3.js', // Should be ignored
    ];
    const mockFileContents = {
      '/path/to/repo/file1.py': 'content of file1.py',
      '/path/to/repo/file2.js': 'content of file2.js',
    };

    childProcess.spawn = jest.fn(() => ({
      stdout: {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from(mockFiles.join('\\0')));
          }
        }),
      },
    }));

    fs.readFileSync = jest.fn((filePath) => mockFileContents[filePath]);

    const combineFiles = require('../code_layout').combine_files;
    combineFiles('/path/to/repo', extractMode, fileExtensions);

    const expectedOutput = fs.readFileSync.mock.calls.flatMap(([ filePath ]) => [
      `// File: ${filePath}`,
      mockFileContents[filePath],
      '',
    ]).join('\
');

    expect(fs.writeFileSync).toHaveBeenCalledWith(outputFilePath, expectedOutput);
  });

  // Add more test cases for different scenarios
});


import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';

jest.mock('fs');
jest.mock('path');
jest.mock('child_process');

describe('combine_files', () => {
  let originalCwd;
  let outputFilePath;

  beforeEach(() => {
    originalCwd = process.cwd();
    process.chdir('/path/to/repo');
    outputFilePath = path.join(process.cwd(), 'combined_output.txt');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    jest.clearAllMocks();
  });

  it('should create output file if it does not exist', () => {
    const extractMode = 'functions';
    const fileExtensions = ['py', 'js'];
    const mockFiles = [
      '/path/to/repo/file1.py',
      '/path/to/repo/file2.js',
    ];

    childProcess.spawn = jest.fn(() => ({
      stdout: {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from(mockFiles.join('\\0')));
          }
        }),
      },
    }));

    const combineFiles = require('../code_layout').combine_files;
    combineFiles('/path/to/repo', extractMode, fileExtensions);

    expect(fs.writeFileSync).toHaveBeenCalledWith(outputFilePath, expect.any(String));
  });

  it('should empty existing output file before writing', () => {
    const extractMode = 'functions';
    const fileExtensions = ['py', 'js'];
    const mockFiles = [
      '/path/to/repo/file1.py',
      '/path/to/repo/file2.js',
    ];

    childProcess.spawn = jest.fn(() => ({
      stdout: {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from(mockFiles.join('\\0')));
          }
        }),
      },
    }));

    fs.writeFileSync.mockClear();
    fs.writeFileSync = jest.fn();

    const combineFiles = require('../code_layout').combine_files;
    combineFiles('/path/to/repo', extractMode, fileExtensions);

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  // Add more test cases for different scenarios
});


import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';

jest.mock('fs');
jest.mock('path');
jest.mock('child_process');

describe('combine_files', () => {
  let originalCwd;
  let outputFilePath;

  beforeEach(() => {
    originalCwd = process.cwd();
    process.chdir('/path/to/repo');
    outputFilePath = path.join(process.cwd(), 'combined_output.txt');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    jest.clearAllMocks();
  });

  it('should extract functions correctly using regex', () => {
    const extractMode = 'functions';
    const fileExtensions = ['py', 'js'];
    const mockFiles = [
      '/path/to/repo/file1.py',
      '/path/to/repo/file2.js',
    ];
    const mockFileContents = {
      '/path/to/repo/file1.py': 'def func1(): pass\
async def func2(): pass\
# Not a function',
      '/path/to/repo/file2.js': 'export function func3() {}\
async function func4() {}\
const notAFunction = 42;',
    };

    childProcess.spawn = jest.fn(() => ({
      stdout: {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from(mockFiles.join('\\0')));
          }
        }),
      },
    }));

    fs.readFileSync = jest.fn((filePath) => mockFileContents[filePath]);

    const combineFiles = require('../code_layout').combine_files;
    combineFiles('/path/to/repo', extractMode, fileExtensions);

    const expectedOutput = fs.readFileSync.mock.calls.flatMap(([ filePath ]) => [
      `// File: ${filePath}`,
      ...(mockFileContents[filePath].match(/(?:export\\s+)?(?:async\\s+)?function\\s+\\w+\\s*\\([^)]*\\)/g) || []),
      '',
    ]).join('\
');

    expect(fs.writeFileSync).toHaveBeenCalledWith(outputFilePath, expectedOutput);
  });

  // Add more test cases for different scenarios
});


import { splitContentIntoChunks_deprecated } from '../src/utils';

describe('splitContentIntoChunks_deprecated', () => {
  it('should split content into chunks based on maxChunkSize', () => {
    const content = 'Line 1\
Line 2\
Line 3\
Line 4\
Line 5';
    const maxChunkSize = 10;
    const expectedChunks = ['Line 1\
', 'Line 2\
', 'Line 3\
', 'Line 4\
', 'Line 5'];

    const chunks = splitContentIntoChunks_deprecated(content, maxChunkSize);

    expect(chunks).toEqual(expectedChunks);
  });

  it('should handle empty content', () => {
    const content = '';
    const maxChunkSize = 10;
    const expectedChunks = [];

    const chunks = splitContentIntoChunks_deprecated(content, maxChunkSize);

    expect(chunks).toEqual(expectedChunks);
  });

  it('should handle content with only one line', () => {
    const content = 'Single line';
    const maxChunkSize = 10;
    const expectedChunks = ['Single line'];

    const chunks = splitContentIntoChunks_deprecated(content, maxChunkSize);

    expect(chunks).toEqual(expectedChunks);
  });

  it('should handle content with very long lines', () => {
    const content = 'This is a very long line that exceeds the maximum chunk size';
    const maxChunkSize = 10;
    const expectedChunks = ['This is a', ' very lon', 'g line th', 'at exceed', 's the max', 'imum chun', 'k size'];

    const chunks = splitContentIntoChunks_deprecated(content, maxChunkSize);

    expect(chunks).toEqual(expectedChunks);
  });
});


import { shouldExcludeFile } from '../src/utils';

describe('shouldExcludeFile', () => {
  it('should return true when the filename matches an exclude pattern', () => {
    const filename = 'path/to/file.js';
    const excludePatterns = ['*.js', 'path/to/*'];

    const shouldExclude = shouldExcludeFile(filename, excludePatterns);

    expect(shouldExclude).toBe(true);
  });

  it('should return false when the filename does not match any exclude pattern', () => {
    const filename = 'path/to/file.ts';
    const excludePatterns = ['*.js', 'path/to/*'];

    const shouldExclude = shouldExcludeFile(filename, excludePatterns);

    expect(shouldExclude).toBe(false);
  });

  it('should handle wild card patterns correctly', () => {
    const filename = 'path/to/some/file.js';
    const excludePatterns = ['*.js', 'path/to/*'];

    const shouldExclude = shouldExcludeFile(filename, excludePatterns);

    expect(shouldExclude).toBe(true);
  });

  it('should handle empty exclude patterns', () => {
    const filename = 'path/to/file.js';
    const excludePatterns: string[] = [];

    const shouldExclude = shouldExcludeFile(filename, excludePatterns);

    expect(shouldExclude).toBe(false);
  });
});


import { calculateFilePatchNumLines } from '../src/utils';

describe('calculateFilePatchNumLines', () => {
  it('should correctly calculate added and removed lines', () => {
    const fileChange = `@@ -1,3 +1,4 @@
-This is the original line 1.
-This is the original line 2.
+This is the new line 1.
+This is the new line 2.
 This is an unchanged line.`;

    const { added, removed } = calculateFilePatchNumLines(fileChange);

    expect(added).toBe(2);
    expect(removed).toBe(2);
  });

  it('should handle empty file change', () => {
    const fileChange = '';

    const { added, removed } = calculateFilePatchNumLines(fileChange);

    expect(added).toBe(0);
    expect(removed).toBe(0);
  });

  it('should handle file change with only additions', () => {
    const fileChange = `@@ -1,1 +1,3 @@
+This is a new line 1.
+This is a new line 2.
+This is a new line 3.`;

    const { added, removed } = calculateFilePatchNumLines(fileChange);

    expect(added).toBe(3);
    expect(removed).toBe(0);
  });

  it('should handle file change with only deletions', () => {
    const fileChange = `@@ -1,3 +1,1 @@
-This is the original line 1.
-This is the original line 2.
-This is the original line 3.`;

    const { added, removed } = calculateFilePatchNumLines(fileChange);

    expect(added).toBe(0);
    expect(removed).toBe(3);
  });
});


import { splitIntoSoloFile } from '../src/utils';

describe('splitIntoSoloFile', () => {
  it('should split combined code into individual files', () => {
    const combinedCode = `// File: ./index.ts\
const greeting = 'Hello, World!';\
\
// File: ./index_test.ts\
import { greeting } from './index';\
\
describe('greeting', () => {\
  it('should be \\'Hello, World!\\'', () => {\
    expect(greeting).toBe('Hello, World!');\
  });\
});\
\
// File: ./index.js\
console.log(greeting);`;

    const expectedFiles = {
      'index.ts': 'const greeting = \\'Hello, World!\\';
',
      'index_test.ts': 'import { greeting } from \\'./index\\';\\
\
describe(\\'greeting\\', () => {\
  it(\\'should be \\'Hello, World!\\'\\', () => {\
    expect(greeting).toBe(\\'Hello, World!\\');\
  });\
});',
      'index.js': 'console.log(greeting);'
    };

    const files = splitIntoSoloFile(combinedCode);

    expect(files).toEqual(expectedFiles);
  });

  it('should handle empty combined code', () => {
    const combinedCode = '';
    const expectedFiles = {};

    const files = splitIntoSoloFile(combinedCode);

    expect(files).toEqual(expectedFiles);
  });

  it('should handle combined code with only one file', () => {
    const combinedCode = '// File: ./index.ts\
const greeting = \\'Hello, World!\\';\\';

    const expectedFiles = {
      'index.ts': 'const greeting = \\'Hello, World!\\';\\'\
'
    };

    const files = splitIntoSoloFile(combinedCode);

    expect(files).toEqual(expectedFiles);
  });

  it('should handle combined code with missing file extension', () => {
    const combinedCode = '// File: ./index\
const greeting = \\'Hello, World!\\';\\';

    const expectedFiles = {
      'index': 'const greeting = \\'Hello, World!\\';\\'\
'
    };

    const files = splitIntoSoloFile(combinedCode);

    expect(files).toEqual(expectedFiles);
  });
});


import { generatePRDescription } from '../src/utils';
import { getOctokit } from '@actions/github';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import * as core from '@actions/core';

jest.mock('@actions/github');
jest.mock('@aws-sdk/client-bedrock-runtime');

describe('generatePRDescription', () => {
  let mockOctokit;
  let mockBedrockClient;
  let mockInvokeModel;

  beforeEach(() => {
    mockOctokit = {
      rest: {
        pulls: {
          listFiles: jest.fn(),
          update: jest.fn(),
        },
        repos: {
          getContent: jest.fn(),
        },
      },
    };
    getOctokit.mockReturnValue(mockOctokit);

    mockBedrockClient = {
      send: jest.fn(),
    };
    BedrockRuntimeClient.mockImplementation(() => mockBedrockClient);

    mockInvokeModel = jest.fn();
    jest.mock('../src/utils', () => ({
      invokeModel: mockInvokeModel,
    }));

    // Mock context object
    Object.defineProperty(process, 'env', {
      value: {
        ...process.env,
        GITHUB_REPOSITORY: 'owner/repo',
        GITHUB_EVENT_PATH: __dirname + '/fixtures/pull_request.json',
      },
    });

    core.getInput = jest.fn()
      .mockReturnValueOnce('token') // github-token
      .mockReturnValueOnce('us-east-1') // aws-region
      .mockReturnValueOnce('model-id') // model-id
      .mockReturnValueOnce('*.txt') // generate-code-review-exclude-files
      .mockReturnValueOnce('detailed') // generate-code-review-level
      .mockReturnValueOnce('true') // generate-code-review
      .mockReturnValueOnce('true') // generate-pr-description
      .mockReturnValueOnce('false') // generate-unit-test
      .mockReturnValueOnce('en'); // output-language
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should generate PR description and update the PR', async () => {
    // Mock necessary dependencies
    const mockFiles = [{
      filename: 'file1.js',
      status: 'modified',
      patch: `@@ -1,3 +1,3 @@
-This is the original line 1.
-This is the original line 2.
+This is the new line 1.
+This is the new line 2.`
    }];
    mockOctokit.rest.pulls.listFiles.mockResolvedValue({ data: mockFiles });
    mockOctokit.rest.repos.getContent.mockResolvedValue({ data: { content: Buffer.from('file content').toString('base64') } });

    mockInvokeModel.mockResolvedValue('Generated PR description');

    await generatePRDescription(mockBedrockClient, 'model-id', mockOctokit);

    expect(mockInvokeModel).toHaveBeenCalled();
    expect(mockOctokit.rest.pulls.update).toHaveBeenCalled();
  });

  it('should handle error when fetching files', async () => {
    // Mock necessary dependencies
    mockOctokit.rest.pulls.listFiles.mockRejectedValue(new Error('Failed to fetch files'));

    await expect(generatePRDescription(mockBedrockClient, 'model-id', mockOctokit)).rejects.toThrow('Failed to fetch files');
  });

  it('should handle error when fetching file content', async () => {
    // Mock necessary dependencies
    const mockFiles = [{ filename: 'file1.js', status: 'modified' }];
    mockOctokit.rest.pulls.listFiles.mockResolvedValue({ data: mockFiles });
    mockOctokit.rest.repos.getContent.mockRejectedValue(new Error('Failed to fetch file content'));

    await expect(generatePRDescription(mockBedrockClient, 'model-id', mockOctokit)).rejects.toThrow('Failed to fetch file content');
  });
});


import { extractSymbols } from '../src/validateTestCases';
import * as ts from 'typescript';

describe('extractSymbols', () => {
  it('should extract function and class symbols from source file', () => {
    const sourceCode = `
      function myFunction() {
        return 'Hello, World!';
      }

      class MyClass {
        constructor() {}

        myMethod() {}
      }
    `;

    const sourceFile = ts.createSourceFile('source.ts', sourceCode, ts.ScriptTarget.Latest, true);
    const symbols = extractSymbols(sourceFile);

    expect(symbols).toContain('myFunction');
    expect(symbols).toContain('MyClass');
  });

  it('should return an empty array for source file without functions or classes', () => {
    const sourceCode = `
      const myVariable = 'Hello, World!';
    `;

    const sourceFile = ts.createSourceFile('source.ts', sourceCode, ts.ScriptTarget.Latest, true);
    const symbols = extractSymbols(sourceFile);

    expect(symbols).toHaveLength(0);
  });
});

// The validateTestCases function includes logging and side effects,
// making it difficult to unit test directly.
// However, its dependent functions (isValidTestCase and extractSymbols) can be unit tested.
// To fully test validateTestCases, integration or end-to-end tests would be more appropriate.

import { generateTestReport } from '../src/yourFile';
import * as fs from 'fs';
import * as path from 'path';

const mockTestCases = [
  { name: 'Test 1', type: 'direct', code: '// Test code 1' },
  { name: 'Test 2', type: 'indirect', code: '// Test code 2' },
  { name: 'Test 3', type: 'not-testable', code: '// Test code 3' },
];
const mockReportDir = '/path/to/reports';
const mockReportPath = '/path/to/reports/report.json';
const expectedReport = {
  totalTests: 3,
  directTests: 1,
  indirectTests: 1,
  notTestable: 1,
};

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));
jest.mock('path', () => ({
  join: jest.fn().mockReturnValueOnce(mockReportDir).mockReturnValueOnce(mockReportPath),
}));

describe('generateTestReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  it('should generate test report', async () => {
    await generateTestReport(mockTestCases);
    expect(fs.existsSync).toHaveBeenCalledWith(mockReportDir);
    expect(fs.mkdirSync).not.toHaveBeenCalled(); // Directory already exists
    expect(fs.writeFileSync).toHaveBeenCalledWith(mockReportPath, JSON.stringify(expectedReport, null, 2));
    expect(console.log).toHaveBeenCalledWith('Test report generated:', expectedReport);
  });

  it('should create report directory if it does not exist', async () => {
    fs.existsSync.mockReturnValue(false);
    await generateTestReport(mockTestCases);
    expect(fs.mkdirSync).toHaveBeenCalledWith(mockReportDir, { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(mockReportPath, JSON.stringify(expectedReport, null, 2));
  });

  it('should handle invalid test cases input', async () => {
    await generateTestReport(null);
    expect(console.log).toHaveBeenCalledWith('Invalid test cases input. Skipping report generation.');
  });
});


import { createPrompt } from '../src/testUtils';

describe('createPrompt', () => {
  it('should create a prompt from the provided source code', () => {
    const sourceCode = 'function add(a, b) { return a + b; }';
    const expectedPrompt = 'Write unit tests for the following code:\
\
function add(a, b) { return a + b; }';
    const result = createPrompt(sourceCode);
    expect(result).toBe(expectedPrompt);
  });

  it('should handle empty source code', () => {
    const sourceCode = '';
    const expectedPrompt = 'Write unit tests for the following code:\
\
';
    const result = createPrompt(sourceCode);
    expect(result).toBe(expectedPrompt);
  });
});


import { generateFakeResponse } from '../src/testUtils';

describe('generateFakeResponse', () => {
  it('should generate a fake response with test cases', async () => {
    const result = await generateFakeResponse();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('type');
    expect(result[0]).toHaveProperty('code');
  });
});


import { exponentialBackoff } from './your-file';

describe('exponentialBackoff', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should execute the function successfully on the first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await exponentialBackoff(mockFn, 3, 1000);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith('Attempt 1 of 4');
    expect(console.log).toHaveBeenCalledWith('Function executed successfully on attempt 1');
  });

  it('should retry and execute the function successfully after a few attempts', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockRejectedValueOnce(new Error('Second attempt failed'))
      .mockResolvedValue('success');

    const result = await exponentialBackoff(mockFn, 3, 1000);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(console.log).toHaveBeenCalledWith('Attempt 1 of 4');
    expect(console.log).toHaveBeenCalledWith('Attempt 1 failed. Retrying in 1000ms...');
    expect(console.log).toHaveBeenCalledWith('Attempt 2 of 4');
    expect(console.log).toHaveBeenCalledWith('Attempt 2 failed. Retrying in 2000ms...');
    expect(console.log).toHaveBeenCalledWith('Attempt 3 of 4');
    expect(console.log).toHaveBeenCalledWith('Function executed successfully on attempt 3');
  });

  it('should throw an error after reaching the maximum number of retries', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Error'));
    await expect(exponentialBackoff(mockFn, 3, 1000)).rejects.toThrow('Error');
    expect(mockFn).toHaveBeenCalledTimes(4);
    expect(console.log).toHaveBeenCalledWith('Attempt 1 of 4');
    expect(console.log).toHaveBeenCalledWith('Attempt 1 failed. Retrying in 1000ms...');
    expect(console.log).toHaveBeenCalledWith('Attempt 2 of 4');
    expect(console.log).toHaveBeenCalledWith('Attempt 2 failed. Retrying in 2000ms...');
    expect(console.log).toHaveBeenCalledWith('Attempt 3 of 4');
    expect(console.log).toHaveBeenCalledWith('Attempt 3 failed. Retrying in 4000ms...');
    expect(console.error).toHaveBeenCalledWith('Max retries (3) reached. Throwing error.');
  });
});

/*
These tests cover the different scenarios for the exponentialBackoff function:

1. The function executes successfully on the first attempt.
2. The function retries a few times and eventually succeeds.
3. The function reaches the maximum number of retries and throws an error.

The tests mock the console.log and console.error methods to verify the correct log messages.
They also use Jest's mocking capabilities to simulate different outcomes for the provided function.
*/


/* The main function or the entry point of the application is typically not unit-testable because it involves external dependencies, environment variables, and other global state that is difficult to mock or control in a unit test environment. */
