import { shouldExcludeFile } from '../debugging/utils';

describe('shouldExcludeFile', () => {
  test('should return true if the filename matches an exclude pattern', () => {
    const filename = 'src/utils/helper.ts';
    const excludePatterns = ['src/utils/*'];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(true);
  });

  test('should return false if the filename does not match any exclude pattern', () => {
    const filename = 'src/components/Button.tsx';
    const excludePatterns = ['src/utils/*'];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(false);
  });

  test('should handle wildcard patterns correctly', () => {
    const filename = 'src/utils/helper.ts';
    const excludePatterns = ['src/*/*.ts'];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(true);
  });

  test('should handle multiple exclude patterns', () => {
    const filename = 'src/components/Button.tsx';
    const excludePatterns = ['src/utils/*', 'src/components/*'];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(true);
  });

  test('should handle empty exclude patterns', () => {
    const filename = 'src/components/Button.tsx';
    const excludePatterns: string[] = [];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(false);
  });
});