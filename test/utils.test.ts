import { shouldExcludeFile } from '../debugging/utils';

describe('shouldExcludeFile', () => {
  test('should return true when the filename matches an exclude pattern', () => {
    const filename = 'src/utils/helper.ts';
    const excludePatterns = ['**/utils/*'];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(true);
  });

  test('should return false when the filename does not match any exclude pattern', () => {
    const filename = 'src/components/Button.tsx';
    const excludePatterns = ['**/utils/*'];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(false);
  });

  test('should handle multiple exclude patterns', () => {
    const filename = 'src/utils/helper.ts';
    const excludePatterns = ['**/utils/*', '**/components/*'];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(true);
  });

  test('should handle wildcard patterns correctly', () => {
    const filename = 'src/utils/helper.ts';
    const excludePatterns = ['src/*'];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(true);
  });

  test('should handle empty exclude patterns', () => {
    const filename = 'src/utils/helper.ts';
    const excludePatterns: string[] = [];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(false);
  });

  test('should handle empty filename', () => {
    const filename = '';
    const excludePatterns = ['**/utils/*'];
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(false);
  });
});