import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import * as os from 'os';

export interface ICoverageSummary {
    lines: { total: number; covered: number; skipped: number; pct: number };
    statements: { total: number; covered: number; skipped: number; pct: number };
    functions: { total: number; covered: number; skipped: number; pct: number };
    branches: { total: number; covered: number; skipped: number; pct: number };
}

export class TestValidator {
    private testDir: string;
    private coverageDirs: string[] = [];

    constructor(private packagePath: string = process.cwd()) {
        this.testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-validator-'));
    }

    validateTest(testName: string, testSource: string): { status: string; error?: string } {
        const testFile = path.join(this.testDir, `${testName}.test.ts`);
        fs.writeFileSync(testFile, testSource);

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jest-validator"));
        const coverageDir = path.join(tmpDir, "coverage");
        const reportFile = path.join(tmpDir, "report.json");

        const res = spawnSync(
            'npx',
            [
                'jest',
                '--coverage',
                '--coverageDirectory', coverageDir,
                '--json',
                '--outputFile', reportFile,
                testFile
            ],
            { timeout: 10000, encoding: 'utf-8', cwd: this.packagePath }
        );

        if (res.status !== 0) {
            return { status: 'FAILED', error: res.stderr };
        }

        const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'));
        
        if (report.numFailedTests > 0) {
            const failedTestResult = report.testResults[0].assertionResults.find((result: any) => result.status === 'failed');
            return { status: 'FAILED', error: failedTestResult ? failedTestResult.failureMessages.join('\n') : 'Unknown error' };
        }

        this.coverageDirs.push(coverageDir);
        return { status: 'PASSED' };
    }

    getCoverageSummary(): ICoverageSummary {
        // Implement logic to aggregate coverage from all coverageDirs
        // This is a placeholder implementation
        return {
            lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
            statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
            functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
            branches: { total: 0, covered: 0, skipped: 0, pct: 0 }
        };
    }
}