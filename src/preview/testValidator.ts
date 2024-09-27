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
        // this.testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-validator-'));
        this.testDir = path.join(this.packagePath, 'debug-tests');
        if (!fs.existsSync(this.testDir)) {
            fs.mkdirSync(this.testDir, { recursive: true });
        }
    }

    validateTest(testName: string, testSource: string, rootDir: string): { status: string; error?: string } {
        console.log('Validating test: ', testName, '\nTest source: ', testSource, '\nRoot dir: ', rootDir)
        const testFile = path.join(this.testDir, `${testName}.test.ts`);
        fs.writeFileSync(testFile, testSource);
        // const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jest-validator"));
        const tmpDir = path.join(this.testDir, "jest-validator");
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        const coverageDir = path.join(tmpDir, "coverage");
        const reportFile = path.join(tmpDir, "report.json");

        // Create a temporary tsconfig.json file
        const tsConfigFile = path.join(this.testDir, 'tsconfig.json');
        const tsConfig = {
            compilerOptions: {
                target: "es2018",
                module: "commonjs",
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                baseUrl: this.packagePath,
                paths: {
                    "*": ["*", rootDir + "/*"]
                }
            },
            include: [
                path.join(this.testDir, "*.ts"),
                path.join(this.packagePath, rootDir + "/**/*.ts")
            ],
            exclude: ["node_modules"]
        };
        fs.writeFileSync(tsConfigFile, JSON.stringify(tsConfig, null, 2));

        // Create a temporary Jest config file
        const jestConfigFile = path.join(this.testDir, 'jest.config.js');
        const jestConfig = `
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '${tsConfigFile}'
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', '${this.packagePath}'],
  rootDir: '${this.packagePath}',
};`;
        fs.writeFileSync(jestConfigFile, jestConfig);

        // Ensure ts-jest is installed
        this.ensureTsJestInstalled();

        const res = spawnSync(
            'npx',
            [
                'jest',
                '--coverage',
                '--coverageDirectory', coverageDir,
                '--json',
                '--outputFile', reportFile,
                '--rootDir', this.packagePath,
                '--config', jestConfigFile,
                testFile
            ],
            { timeout: 30000, encoding: 'utf-8', cwd: this.packagePath }
        );

        if (res.status !== 0) {
            return { status: 'FAILED', error: res.stderr || res.stdout };
        }

        const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'));
        
        if (report.numFailedTests > 0) {
            const failedTestResult = report.testResults[0].assertionResults.find((result: any) => result.status === 'failed');
            return { status: 'FAILED', error: failedTestResult ? failedTestResult.failureMessages.join('\n') : 'Unknown error' };
        }

        this.coverageDirs.push(coverageDir);
        return { status: 'PASSED' };
    }

    private ensureTsJestInstalled() {
        try {
            require.resolve('ts-jest');
        } catch (e) {
            console.log('ts-jest not found. Installing...');
            spawnSync('npm', ['install', '--save-dev', 'ts-jest'], { stdio: 'inherit', cwd: this.packagePath });
        }
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