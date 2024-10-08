import { shouldExcludeFile } from '../debugging/utils';

describe('shouldExcludeFile', () => {
  it('should return true if the filename matches any of the exclude patterns', () => {
    const filename = 'src/components/Header.tsx';
    const excludePatterns = ['*.tsx', 'src/components/*'];

    expect(shouldExcludeFile(filename, excludePatterns)).toBe(true);
  });

  it('should return false if the filename does not match any of the exclude patterns', () => {
    const filename = 'src/utils/helpers.ts';
    const excludePatterns = ['*.tsx', 'src/components/*'];

    expect(shouldExcludeFile(filename, excludePatterns)).toBe(false);
  });

  it('should handle wildcard patterns correctly', () => {
    const filename = 'src/utils/helpers.ts';
    const excludePatterns = ['*.ts', 'src/utils/*'];

    expect(shouldExcludeFile(filename, excludePatterns)).toBe(true);
  });

  it('should handle empty exclude patterns', () => {
    const filename = 'src/utils/helpers.ts';
    const excludePatterns: string[] = [];

    expect(shouldExcludeFile(filename, excludePatterns)).toBe(false);
  });

  test.each`
    filename                  | excludePatterns                | expected
    ${'src/components/Header.tsx'} | ${['*.tsx', 'src/components/*']} | ${true}
    ${'src/utils/helpers.ts'}      | ${['*.tsx', 'src/components/*']} | ${false}
    ${'src/utils/helpers.ts'}      | ${['*.ts', 'src/utils/*']}       | ${true}
    ${'src/utils/helpers.ts'}      | ${[]}                            | ${false}
  `('should return $expected for filename $filename and excludePatterns $excludePatterns', ({ filename, excludePatterns, expected }) => {
    expect(shouldExcludeFile(filename, excludePatterns)).toBe(expected);
  });
});