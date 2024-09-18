import { splitContentIntoChunks_deprecated } from '../src/utils';

describe('splitContentIntoChunks_deprecated', () => {
  it('should split content into chunks correctly', () => {
    const content = 'This is a\
long string\
with multiple\
lines';
    const maxChunkSize = 10;
    const expectedChunks = ['This is a', '\
long str', 'ing\
with ', 'multiple\
', 'lines'];

    const result = splitContentIntoChunks_deprecated(content, maxChunkSize);

    expect(result).toEqual(expectedChunks);
  });

  it('should handle empty input string', () => {
    const content = '';
    const maxChunkSize = 10;
    const expectedChunks: string[] = [];

    const result = splitContentIntoChunks_deprecated(content, maxChunkSize);

    expect(result).toEqual(expectedChunks);
  });

  it('should handle input string shorter than maxChunkSize', () => {
    const content = 'Short string';
    const maxChunkSize = 20;
    const expectedChunks = ['Short string'];

    const result = splitContentIntoChunks_deprecated(content, maxChunkSize);

    expect(result).toEqual(expectedChunks);
  });
});


import { shouldExcludeFile } from '../src/utils';

describe('shouldExcludeFile', () => {
  it('should exclude files matching the pattern', () => {
    const filename = 'src/utils.ts';
    const excludePatterns = ['src/*'];

    const result = shouldExcludeFile(filename, excludePatterns);

    expect(result).toBe(true);
  });

  it('should not exclude files not matching the pattern', () => {
    const filename = 'src/main.ts';
    const excludePatterns = ['test/*'];

    const result = shouldExcludeFile(filename, excludePatterns);

    expect(result).toBe(false);
  });

  it('should handle multiple exclude patterns', () => {
    const filename = 'src/utils.ts';
    const excludePatterns = ['src/*', 'test/*'];

    const result = shouldExcludeFile(filename, excludePatterns);

    expect(result).toBe(true);
  });

  it('should handle wildcard patterns', () => {
    const filename = 'src/utils/helper.ts';
    const excludePatterns = ['src/utils/*'];

    const result = shouldExcludeFile(filename, excludePatterns);

    expect(result).toBe(true);
  });
});


import { calculateFilePatchNumLines } from '../src/utils';

describe('calculateFilePatchNumLines', () => {
  it('should calculate added and removed lines correctly', () => {
    const fileChange = `@@ -1,3 +1,2 @@
-This is the original line 1.
-This is the original line 2.
+This is the new line 1.`;

    const result = calculateFilePatchNumLines(fileChange);

    expect(result).toEqual({ added: 1, removed: 2 });
  });

  it('should handle no changes', () => {
    const fileChange = `@@ -1,2 +1,2 @@
 This is an unchanged line.
 This is another unchanged line.`;

    const result = calculateFilePatchNumLines(fileChange);

    expect(result).toEqual({ added: 0, removed: 0 });
  });

  it('should handle only additions', () => {
    const fileChange = `@@ -1,1 +1,2 @@
 This is an unchanged line.
+This is a new line.`;

    const result = calculateFilePatchNumLines(fileChange);

    expect(result).toEqual({ added: 1, removed: 0 });
  });

  it('should handle only removals', () => {
    const fileChange = `@@ -1,2 +1,1 @@
-This is a removed line.
 This is an unchanged line.`;

    const result = calculateFilePatchNumLines(fileChange);

    expect(result).toEqual({ added: 0, removed: 1 });
  });
});


import { generatePRDescription } from '../src/utils';
import { context } from '@actions/github';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { getOctokit } from '@actions/github';

jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    sendCommandCommand: jest.fn(),
  })),
}));
jest.mock('./utils', () => ({
  invokeModel: jest.fn().mockResolvedValue('Generated PR description'),
}));

describe('generatePRDescription', () => {
  let mockClient: jest.Mocked<BedrockRuntimeClient>;
  let mockOctokit: jest.Mocked<ReturnType<typeof getOctokit>>;

  beforeEach(() => {
    mockClient = new BedrockRuntimeClient() as jest.Mocked<BedrockRuntimeClient>;
    mockOctokit = getOctokit('fake-token') as jest.Mocked<ReturnType<typeof getOctokit>>;

    context.payload.pull_request = {
      number: 123,
      body: 'Pull request description',
      head: {
        sha: 'abc123',
        ref: 'test-branch',
      },
    };

    context.repo = {
      owner: 'test-owner',
      repo: 'test-repo',
    };

    mockOctokit.rest.pulls.listFiles.mockResolvedValue({
      data: [
        { filename: 'file1.ts', status: 'modified', patch: 'some patch' },
        { filename: 'file2.ts', status: 'added', patch: 'some patch' },
      ],
    });

    mockOctokit.rest.pulls.update.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should generate PR description', async () => {
    await generatePRDescription(mockClient, 'model-id', mockOctokit);

    expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledTimes(1);
    expect(mockOctokit.rest.pulls.update).toHaveBeenCalledTimes(1);
    expect(mockOctokit.rest.pulls.update).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      pull_number: 123,
      body: expect.stringContaining('Generated PR description'),
    });
  });

  it('should handle errors when fetching files', async () => {
    const errorMessage = 'Failed to fetch files';
    mockOctokit.rest.pulls.listFiles.mockRejectedValue(new Error(errorMessage));

    await generatePRDescription(mockClient, 'model-id', mockOctokit);

    expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledTimes(1);
    expect(mockOctokit.rest.pulls.update).not.toHaveBeenCalled();
  });
});


import { generateUnitTestsSuite } from '../src/utils';
import { context } from '@actions/github';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { getOctokit } from '@actions/github';

jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    sendCommandCommand: jest.fn(),
  })),
}));
jest.mock('./utils', () => ({
  generateUnitTests: jest.fn().mockResolvedValue([
    { code: 'test case 1' },
    { code: 'test case 2' },
  ]),
  runUnitTests: jest.fn(),
  generateTestReport: jest.fn(),
}));

describe('generateUnitTestsSuite', () => {
  let mockClient: jest.Mocked<BedrockRuntimeClient>;
  let mockOctokit: jest.Mocked<ReturnType<typeof getOctokit>>;

  beforeEach(() => {
    mockClient = new BedrockRuntimeClient() as jest.Mocked<BedrockRuntimeClient>;
    mockOctokit = getOctokit('fake-token') as jest.Mocked<ReturnType<typeof getOctokit>>;

    context.payload.pull_request = {
      number: 123,
      body: 'Pull request description',
      head: {
        sha: 'abc123',
        ref: 'test-branch',
      },
    };

    context.repo = {
      owner: 'test-owner',
      repo: 'test-repo',
    };

    mockOctokit.rest.repos.listTags.mockResolvedValue({ data: [{ name: 'auto-unit-test-baseline' }] });
    mockOctokit.rest.pulls.listFiles.mockResolvedValue({
      data: [{ filename: 'src/file.ts', status: 'modified', patch: 'some patch' }],
    });
    mockOctokit.rest.repos.getContent.mockResolvedValue({
      data: { content: Buffer.from('some file content').toString('base64') },
    });
    mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should generate unit tests suite when baseline tag does not exist', async () => {
    mockOctokit.rest.repos.listTags.mockResolvedValue({ data: [] });

    await generateUnitTestsSuite(mockClient, 'model-id', mockOctokit, context.repo, 'src');

    expect(mockOctokit.rest.repos.listTags).toHaveBeenCalledTimes(1);
    expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledTimes(1);
    expect(mockOctokit.rest.git.createRef).toHaveBeenCalledTimes(1);
    expect(mockOctokit.rest.repos.createOrUpdateFileContents).toHaveBeenCalledTimes(1);
  });

  it('should generate unit tests suite for changed files when baseline tag exists', async () => {
    await generateUnitTestsSuite(mockClient, 'model-id', mockOctokit, context.repo, 'src');

    expect(mockOctokit.rest.repos.listTags).toHaveBeenCalledTimes(1);
    expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledTimes(1);
    expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledTimes(1);
    expect(mockOctokit.rest.repos.createOrUpdateFileContents).toHaveBeenCalledTimes(1);
  });

  it('should handle errors when fetching files', async () => {
    const errorMessage = 'Failed to fetch files';
    mockOctokit.rest.repos.getContent.mockRejectedValue(new Error(errorMessage));

    await generateUnitTestsSuite(mockClient, 'model-id', mockOctokit, context.repo, 'src');

    expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledTimes(1);
    expect(mockOctokit.rest.repos.createOrUpdateFileContents).not.toHaveBeenCalled();
  });
});
