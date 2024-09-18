import { splitContentIntoChunks_deprecated } from '../src/index';

describe('splitContentIntoChunks_deprecated', () => {
  it('should split the content into chunks of the specified maximum size', () => {
    const content = 'This is a long\
content\
string\
with\
multiple\
lines';
    const maxChunkSize = 10;
    const expectedChunks = [
      'This is a ',
      'long\
conte',
      'nt\
string\
',
      'with\
mult',
      'iple\
line',
      's'
    ];

    const chunks = splitContentIntoChunks_deprecated(content, maxChunkSize);

    expect(chunks).toHaveLength(expectedChunks.length);
    expect(chunks).toEqual(expectedChunks);
  });

  it('should handle an empty string', () => {
    const content = '';
    const maxChunkSize = 10;
    const expectedChunks: string[] = [];

    const chunks = splitContentIntoChunks_deprecated(content, maxChunkSize);

    expect(chunks).toHaveLength(expectedChunks.length);
    expect(chunks).toEqual(expectedChunks);
  });

  it('should handle a string shorter than the maximum chunk size', () => {
    const content = 'Short string';
    const maxChunkSize = 20;
    const expectedChunks = ['Short string'];

    const chunks = splitContentIntoChunks_deprecated(content, maxChunkSize);

    expect(chunks).toHaveLength(expectedChunks.length);
    expect(chunks).toEqual(expectedChunks);
  });
});


import { shouldExcludeFile } from '../src/index';

describe('shouldExcludeFile', () => {
  it('should return true if the file matches any of the exclude patterns', () => {
    const filename = 'src/utils/helper.js';
    const excludePatterns = ['**/utils/*', '*.txt'];

    const shouldExclude = shouldExcludeFile(filename, excludePatterns);

    expect(shouldExclude).toBe(true);
  });

  it('should return false if the file does not match any of the exclude patterns', () => {
    const filename = 'src/components/App.tsx';
    const excludePatterns = ['**/utils/*', '*.txt'];

    const shouldExclude = shouldExcludeFile(filename, excludePatterns);

    expect(shouldExclude).toBe(false);
  });

  it('should handle empty exclude patterns', () => {
    const filename = 'src/components/App.tsx';
    const excludePatterns: string[] = [];

    const shouldExclude = shouldExcludeFile(filename, excludePatterns);

    expect(shouldExclude).toBe(false);
  });
});


import { calculateFilePatchNumLines } from '../src/index';

describe('calculateFilePatchNumLines', () => {
  it('should correctly count added and removed lines', () => {
    const fileChange = `diff --git a/file.txt b/file.txt
+++ b/file.txt
@@ -1,3 +1,4 @@
 line1
-line2
 line3
+line4`;

    const { added, removed } = calculateFilePatchNumLines(fileChange);

    expect(added).toBe(1);
    expect(removed).toBe(1);
  });

  it('should handle a file with no changes', () => {
    const fileChange = '';

    const { added, removed } = calculateFilePatchNumLines(fileChange);

    expect(added).toBe(0);
    expect(removed).toBe(0);
  });

  it('should handle a file with only additions', () => {
    const fileChange = `diff --git a/file.txt b/file.txt
+++ b/file.txt
@@ -1,1 +1,3 @@
 line1
+line2
+line3`;

    const { added, removed } = calculateFilePatchNumLines(fileChange);

    expect(added).toBe(2);
    expect(removed).toBe(0);
  });

  it('should handle a file with only removals', () => {
    const fileChange = `diff --git a/file.txt b/file.txt
+++ b/file.txt
@@ -1,3 +1,1 @@
-line1
 line2
-line3`;

    const { added, removed } = calculateFilePatchNumLines(fileChange);

    expect(added).toBe(0);
    expect(removed).toBe(2);
  });
});


import { extractFunctions } from '../src/index';

describe('extractFunctions', () => {
  it('should extract functions from the provided code', async () => {
    const sourceCode = `
      // File: ./index.ts
      export function foo() {
        console.log('Hello, world!');
      }

      // File: ./utils.ts
      export async function bar() {
        await Promise.resolve();
      }
    `;

    const expectedFunctions = [
      'export function foo() { ... }',
      'export async function bar() { ... }',
    ];

    const functions = await extractFunctions(sourceCode);

    expect(functions).toHaveLength(expectedFunctions.length);
    expect(functions).toEqual(expect.arrayContaining(expectedFunctions));
  });

  it('should return an empty array if no functions are found', async () => {
    const sourceCode = `
      // File: ./index.ts
      const foo = 'bar';
    `;

    const functions = await extractFunctions(sourceCode);

    expect(functions).toHaveLength(0);
  });

  // Add more test cases to cover different scenarios
});


import { splitIntoSoloFile } from '../src/index';

describe('splitIntoSoloFile', () => {
  it('should split the combined code into individual files', () => {
    const combinedCode = `// File: ./index.ts
const foo = 'bar';

// File: ./utils.ts
export function formatDate(date: Date): string {
  return date.toISOString();
}

// File: ./tests/utils.test.ts
import { formatDate } from '../utils';

describe('formatDate', () => {
  it('should format the date correctly', () => {
    const date = new Date('2023-05-01T12:00:00Z');
    const formattedDate = formatDate(date);
    expect(formattedDate).toBe('2023-05-01T12:00:00.000Z');
  });
});
`;

    const expectedFiles = {
      './index.ts': 'const foo = \\'bar\\';
',
      './utils.ts': 'export function formatDate(date: Date): string {\
  return date.toISOString();\
}
',
      './tests/utils.test.ts': 'import { formatDate } from \\'../utils\\';

describe(\\'formatDate\\', () => {\
  it(\\'should format the date correctly\\', () => {\
    const date = new Date(\\'2023-05-01T12:00:00Z\\');\
    const formattedDate = formatDate(date);\
    expect(formattedDate).toBe(\\'2023-05-01T12:00:00.000Z\\');\
  });\
});
',
    };

    const files = splitIntoSoloFile(combinedCode);

    expect(files).toEqual(expectedFiles);
  });

  it('should handle an empty input string', () => {
    const combinedCode = '';
    const expectedFiles: Record<string, string> = {};

    const files = splitIntoSoloFile(combinedCode);

    expect(files).toEqual(expectedFiles);
  });

  it('should handle a case with no file separators', () => {
    const combinedCode = 'const foo = \\'bar\\';';
    const expectedFiles = {
      '': 'const foo = \\'bar\\';',
    };

    const files = splitIntoSoloFile(combinedCode);

    expect(files).toEqual(expectedFiles);
  });
});


import { generatePRDescription } from '../src/index';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { getOctokit } from '@actions/github';
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@actions/github');

describe('generatePRDescription', () => {
  let mockClient: BedrockRuntimeClient;
  let mockOctokit: ReturnType<typeof getOctokit>;

  beforeEach(() => {
    mockClient = new BedrockRuntimeClient({});
    mockOctokit = getOctokit('test-token');

    // Mock the necessary functions and properties
    jest.spyOn(mockOctokit.rest.pulls, 'listFiles').mockResolvedValue({ data: [] } as any);
    jest.spyOn(mockOctokit.rest.repos, 'getContent').mockResolvedValue({ data: { content: Buffer.from('').toString('base64') } } as any);
    jest.spyOn(mockOctokit.rest.pulls, 'update').mockResolvedValue({});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should generate and update the PR description', async () => {
    // Mock the necessary dependencies and setup
    const mockInvokeModel = jest.fn().mockResolvedValue('Generated PR description');
    jest.mock('../src/utils', () => ({ invokeModel: mockInvokeModel }));

    await generatePRDescription(mockClient, 'test-model', mockOctokit);

    // Add assertions to check if the functions were called with the expected arguments
    expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalled();
    expect(mockOctokit.rest.pulls.update).toHaveBeenCalled();
    expect(mockInvokeModel).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('PR description updated successfully.');
  });

  it('should handle errors and log appropriate messages', async () => {
    // Mock the necessary dependencies and setup
    const mockInvokeModel = jest.fn().mockResolvedValue('Generated PR description');
    jest.mock('../src/utils', () => ({ invokeModel: mockInvokeModel }));

    // Mock an error scenario
    jest.spyOn(mockOctokit.rest.pulls, 'listFiles').mockRejectedValue(new Error('Failed to list files'));

    await generatePRDescription(mockClient, 'test-model', mockOctokit);

    // Add assertions to check if the error was logged correctly
    expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalled();
    expect(mockOctokit.rest.pulls.update).not.toHaveBeenCalled();
    expect(mockInvokeModel).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalledWith('PR description updated successfully.');
  });

  // Add more test cases to cover different scenarios
});
