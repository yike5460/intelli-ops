import { splitContentIntoChunks_deprecated } from '../src/action';

describe('splitContentIntoChunks_deprecated', () => {
  it('should split content into chunks correctly', () => {
    const content = 'Line 1\
Line 2\
Line 3\
Line 4';
    const maxChunkSize = 10;
    const expectedChunks = ['Line 1\
', 'Line 2\
', 'Line 3\
', 'Line 4'];
    expect(splitContentIntoChunks_deprecated(content, maxChunkSize)).toEqual(expectedChunks);
  });

  it('should handle empty content', () => {
    const content = '';
    const maxChunkSize = 10;
    const expectedChunks: string[] = [];
    expect(splitContentIntoChunks_deprecated(content, maxChunkSize)).toEqual(expectedChunks);
  });

  it('should handle large chunk size', () => {
    const content = 'Line 1\
Line 2\
Line 3\
Line 4';
    const maxChunkSize = 1000;
    const expectedChunks = [content];
    expect(splitContentIntoChunks_deprecated(content, maxChunkSize)).toEqual(expectedChunks);
  });
});

import { shouldExcludeFile } from '../src/action';

describe('shouldExcludeFile', () => {
  it('should return true if filename matches exclude pattern', () => {
    const filename = 'path/to/file.js';
    const excludePatterns = ['*.js'];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(true);
  });

  it('should return false if filename does not match exclude pattern', () => {
    const filename = 'path/to/file.ts';
    const excludePatterns = ['*.js'];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(false);
  });

  it('should handle multiple exclude patterns', () => {
    const filename = 'path/to/file.js';
    const excludePatterns = ['*.js', '*.ts'];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(true);
  });

  it('should handle wildcards in exclude patterns', () => {
    const filename = 'path/to/file.js';
    const excludePatterns = ['path/*.js'];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(true);
  });
});

import { calculateFilePatchNumLines } from '../src/action';

describe('calculateFilePatchNumLines', () => {
  it('should calculate the number of added and removed lines correctly', () => {
    const fileChange = `@@ -1,3 +1,4 @@
+This is a new line
 This is an unchanged line
-This is a removed line
`;
    const { added, removed } = calculateFilePatchNumLines(fileChange);
    expect(added).toBe(1);
    expect(removed).toBe(1);
  });

  it('should handle empty file change', () => {
    const fileChange = '';
    const { added, removed } = calculateFilePatchNumLines(fileChange);
    expect(added).toBe(0);
    expect(removed).toBe(0);
  });

  it('should handle multiple added and removed lines', () => {
    const fileChange = `@@ -1,3 +1,5 @@
+This is a new line 1
+This is a new line 2
 This is an unchanged line
-This is a removed line 1
-This is a removed line 2
`;
    const { added, removed } = calculateFilePatchNumLines(fileChange);
    expect(added).toBe(2);
    expect(removed).toBe(2);
  });
});

import { generatePRDescription } from '../src/action';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { getOctokit } from '@actions/github';
import * as core from '@actions/core';

jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@actions/github');
jest.mock('@actions/core');

describe('generatePRDescription', () => {
  let mockBedrockClient: BedrockRuntimeClient;
  let mockOctokit: ReturnType<typeof getOctokit>;
  let mockContext: { payload: { pull_request: any }, repo: { owner: string, repo: string } };

  beforeEach(() => {
    mockBedrockClient = new BedrockRuntimeClient({});
    mockOctokit = getOctokit('mockToken');
    mockContext = {
      payload: {
        pull_request: {
          number: 123,
          body: 'PR description',
          head: {
            sha: 'mockSha',
            ref: 'mockRef'
          }
        }
      },
      repo: {
        owner: 'mockOwner',
        repo: 'mockRepo'
      }
    };

    jest.spyOn(core, 'setFailed').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should generate PR description and update the PR', async () => {
    const mockListFiles = jest.fn().mockResolvedValue({ data: [{ filename: 'file1.ts', status: 'modified' }] });
    const mockGetContent = jest.fn().mockResolvedValue({ data: { content: Buffer.from('file content').toString('base64') } });
    const mockInvokeModel = jest.fn().mockResolvedValue('Generated PR description');
    const mockUpdate = jest.fn().mockResolvedValue({});

    mockOctokit.rest.pulls.listFiles = mockListFiles;
    mockOctokit.rest.repos.getContent = mockGetContent;
    mockOctokit.rest.pulls.update = mockUpdate;

    await generatePRDescription(mockBedrockClient, 'mockModelId', mockOctokit);

    expect(mockListFiles).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      pull_number: 123
    });
    expect(mockGetContent).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      path: 'file1.ts',
      ref: 'mockSha'
    });
    expect(mockInvokeModel).toHaveBeenCalledWith(mockBedrockClient, 'mockModelId', expect.any(String));
    expect(mockUpdate).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      pull_number: 123,
      body: expect.stringContaining('Generated PR description')
    });
  });

  it('should handle errors and set failed status', async () => {
    const mockListFiles = jest.fn().mockRejectedValue(new Error('Mock error'));

    mockOctokit.rest.pulls.listFiles = mockListFiles;

    await generatePRDescription(mockBedrockClient, 'mockModelId', mockOctokit);

    expect(core.setFailed).toHaveBeenCalledWith('Error: Mock error');
  });
});

import { splitIntoSoloFile } from '../src/action';

describe('splitIntoSoloFile', () => {
  it('should split combined code into individual files', () => {
    const combinedCode = `// File: ./index.ts
console.log('Hello, World!');

// File: ./index_test.ts
describe('index', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});

// File: ./index.js
const fs = require('fs');
`;
    const expectedFiles = {
      'index.ts': 'console.log(\'Hello, World!\');',
      'index_test.ts': 'describe(\'index\', () => {
  it(\'should work\', () => {
    expect(true).toBe(true);
  });
});',
      'index.js': 'const fs = require(\'fs\');'
    };
    expect(splitIntoSoloFile(combinedCode)).toEqual(expectedFiles);
  });

  it('should handle empty input', () => {
    const combinedCode = '';
    expect(splitIntoSoloFile(combinedCode)).toEqual({});
  });

  it('should handle input without file markers', () => {
    const combinedCode = 'console.log(\'Hello, World!\');';
    expect(splitIntoSoloFile(combinedCode)).toEqual({});
  });

  it('should trim leading and trailing whitespace', () => {
    const combinedCode = `// File: ./index.ts
console.log('Hello, World!');  
`;
    const expectedFiles = {
      'index.ts': 'console.log(\'Hello, World!\');'
    };
    expect(splitIntoSoloFile(combinedCode)).toEqual(expectedFiles);
  });
});

import { generateUnitTestsSuite } from '../src/action';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { getOctokit } from '@actions/github';
import * as core from '@actions/core';

jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@actions/github');
jest.mock('@actions/core');
jest.mock('../src/ut_ts', () => ({
  generateUnitTests: jest.fn().mockResolvedValue([{ code: 'Test case 1' }, { code: 'Test case 2' }]),
  runUnitTests: jest.fn(),
  generateTestReport: jest.fn()
}));

describe('generateUnitTestsSuite', () => {
  let mockBedrockClient: BedrockRuntimeClient;
  let mockOctokit: ReturnType<typeof getOctokit>;
  let mockContext: { payload: { pull_request: any }, repo: { owner: string, repo: string } };

  beforeEach(() => {
    mockBedrockClient = new BedrockRuntimeClient({});
    mockOctokit = getOctokit('mockToken');
    mockContext = {
      payload: {
        pull_request: {
          number: 123,
          head: {
            sha: 'mockSha',
            ref: 'mockRef'
          }
        }
      },
      repo: {
        owner: 'mockOwner',
        repo: 'mockRepo'
      }
    };

    jest.spyOn(core, 'setFailed').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should generate unit tests suite and update the PR', async () => {
    const mockListFiles = jest.fn().mockResolvedValue({ data: [{ filename: 'src/file1.ts', status: 'modified' }] });
    const mockGetContent = jest.fn().mockResolvedValue({ data: { content: Buffer.from('file content').toString('base64') } });
    const mockListTags = jest.fn().mockResolvedValue({ data: [] });
    const mockCreateRef = jest.fn().mockResolvedValue({});
    const mockCreateOrUpdateFileContents = jest.fn().mockResolvedValue({});

    mockOctokit.rest.pulls.listFiles = mockListFiles;
    mockOctokit.rest.repos.getContent = mockGetContent;
    mockOctokit.rest.repos.listTags = mockListTags;
    mockOctokit.rest.git.createRef = mockCreateRef;
    mockOctokit.rest.repos.createOrUpdateFileContents = mockCreateOrUpdateFileContents;

    await generateUnitTestsSuite(mockBedrockClient, 'mockModelId', mockOctokit, { owner: 'mockOwner', repo: 'mockRepo' }, 'src');

    expect(mockListFiles).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      pull_number: 123
    });
    expect(mockGetContent).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      path: 'src/file1.ts'
    });
    expect(mockCreateRef).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      ref: 'refs/tags/auto-unit-test-baseline',
      sha: 'mockSha'
    });
    expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      path: 'test/unit_tests.ts',
      message: 'Add or update generated unit tests',
      content: expect.any(String),
      branch: 'mockRef',
      sha: undefined
    });
  });

  it('should handle errors and set failed status', async () => {
    const mockListFiles = jest.fn().mockRejectedValue(new Error('Mock error'));

    mockOctokit.rest.pulls.listFiles = mockListFiles;

    await generateUnitTestsSuite(mockBedrockClient, 'mockModelId', mockOctokit, { owner: 'mockOwner', repo: 'mockRepo' }, 'src');

    expect(core.setFailed).toHaveBeenCalledWith('Error: Mock error');
  });
});