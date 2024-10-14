"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestGenerator = void 0;
exports.generateUnitTestsSuite = generateUnitTestsSuite;
var github_1 = require("@actions/github");
var languageModel_1 = require("./languageModel");
var testValidator_1 = require("./testValidator");
var resultCollector_1 = require("./resultCollector");
var prompts_1 = require("../prompts");
var snippetMap_1 = require("./snippetMap");
var TestGenerator = /** @class */ (function () {
    function TestGenerator(temperatures, snippetMap, model, validator, collector) {
        this.temperatures = temperatures;
        this.snippetMap = snippetMap;
        this.model = model;
        this.validator = validator;
        this.collector = collector;
        this.worklist = [];
    }
    TestGenerator.prototype.generateAndValidateTests = function (fileMeta, snippets) {
        return __awaiter(this, void 0, void 0, function () {
            var inputs, functions, generatedTests, _i, functions_1, func, initialPrompt, _a, _b, temperature, generatedPassingTests, attempts, maxAttempts, prompt_1, promptString, completions, completionArray, _c, completionArray_1, completion, testInfo, refinedPrompt, coverageSummary;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        inputs = new prompts_1.Inputs();
                        inputs.fileName = fileMeta.fileName;
                        inputs.fileContent = fileMeta.fileContent;
                        inputs.filePath = fileMeta.filePath;
                        functions = this.extractFunctions(fileMeta.fileContent);
                        generatedTests = [];
                        _i = 0, functions_1 = functions;
                        _d.label = 1;
                    case 1:
                        if (!(_i < functions_1.length)) return [3 /*break*/, 8];
                        func = functions_1[_i];
                        initialPrompt = new prompts_1.Prompts();
                        inputs.functionBody = func;
                        _a = 0, _b = this.temperatures;
                        _d.label = 2;
                    case 2:
                        if (!(_a < _b.length)) return [3 /*break*/, 7];
                        temperature = _b[_a];
                        generatedPassingTests = false;
                        // Push initial prompt to worklist
                        this.worklist.push(initialPrompt);
                        attempts = 0;
                        maxAttempts = 5;
                        _d.label = 3;
                    case 3:
                        if (!(this.worklist.length > 0 && attempts < maxAttempts)) return [3 /*break*/, 5];
                        prompt_1 = this.worklist.pop();
                        if (this.collector.hasPrompt(prompt_1)) {
                            return [3 /*break*/, 3];
                        }
                        promptString = prompt_1.refinedPrompt === '' ? prompt_1.renderUnitTestGenerationPrompt(inputs) : prompt_1.refinedPrompt;
                        return [4 /*yield*/, this.model.getCompletions(promptString, temperature)
                            // record the prompt info to avoid duplicate processing for the same prompt
                        ];
                    case 4:
                        completions = _d.sent();
                        // record the prompt info to avoid duplicate processing for the same prompt
                        this.collector.recordPromptInfo(prompt_1, completions.length);
                        completionArray = Array.isArray(completions) ? completions : [completions];
                        for (_c = 0, completionArray_1 = completionArray; _c < completionArray_1.length; _c++) {
                            completion = completionArray_1[_c];
                            testInfo = this.validateCompletion(prompt_1, completion, fileMeta.rootDir);
                            if (testInfo.outcome.status === "PASSED") {
                                generatedPassingTests = true;
                                this.collector.recordTestResult(testInfo);
                                generatedTests.push(testInfo.testSource);
                                break;
                            }
                            else if (testInfo.outcome.status === "FAILED") {
                                // Re-render the prompt with the error, simple promptRefiner implementation
                                inputs.generatedUnitTestCodeExecutionError = testInfo.outcome.error;
                                inputs.generatedUnitTestCode = testInfo.testSource;
                                refinedPrompt = new prompts_1.Prompts();
                                refinedPrompt.refinedPrompt = prompt_1.renderUnitTestGenerationRefinedPrompt(inputs);
                                this.worklist.push(refinedPrompt);
                                console.log('Attempt: ', attempts, '\nRefined prompt: ', refinedPrompt.refinedPrompt);
                            }
                            this.collector.recordTestResult(testInfo);
                        }
                        if (generatedPassingTests) {
                            return [3 /*break*/, 5];
                        }
                        attempts++;
                        return [3 /*break*/, 3];
                    case 5:
                        if (generatedPassingTests) {
                            return [3 /*break*/, 7];
                        }
                        _d.label = 6;
                    case 6:
                        _a++;
                        return [3 /*break*/, 2];
                    case 7:
                        _i++;
                        return [3 /*break*/, 1];
                    case 8:
                        coverageSummary = this.validator.getCoverageSummary();
                        console.log('Coverage summary: ', coverageSummary);
                        this.collector.recordCoverageInfo(coverageSummary);
                        return [2 /*return*/, {
                                generatedTests: generatedTests,
                                coverageSummary: coverageSummary,
                                testResults: this.collector.getTestResults()
                            }];
                }
            });
        });
    };
    TestGenerator.prototype.validateCompletion = function (prompt, completion, rootDir) {
        var testSource = this.parseExecutableCode(completion);
        var testInfo = {
            testName: "test_".concat(Date.now()),
            testSource: testSource,
            prompt: prompt,
            rootDir: rootDir
        };
        this.collector.recordTestInfo(testInfo);
        if (completion.trim() === "") {
            return __assign(__assign({}, testInfo), { outcome: { status: "FAILED", error: "Empty completion" } });
        }
        var outcome = this.validator.validateTest(testInfo.testName, testInfo.testSource, rootDir);
        console.log('Outcome for the testSource:\n', outcome, '\n\nTest source:\n', testInfo.testSource);
        return __assign(__assign({}, testInfo), { outcome: outcome });
    };
    TestGenerator.prototype.parseExecutableCode = function (completion) {
        /**
         * Input will be in the format below according to the prompt in renderUnitTestGenerationPrompt:
         *
         * ```typescript
         * <Generated Unit Test Code>
         * ```
         *
         * Extract the executable code from the Input directly
        **/
        try {
            var codeBlockRegex = /```(?:javascript|typescript)?\s*([\s\S]*?)```/g;
            var match = codeBlockRegex.exec(completion);
            if (match && match[1]) {
                return match[1].trim();
            }
            // throw new Error('No code block found in the completion');
            console.warn('No code block found in the completion, returning the original completion instead');
            return completion;
        }
        catch (error) {
            console.log('Error parsing completion: ', error);
            throw error;
        }
    };
    // TODO: Use a proper TypeScript parser like typescript-estree.
    TestGenerator.prototype.extractFunctions = function (fileContent) {
        var functionRegex = /(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*(?::\s*\w+)?\s*{[^}]*}/g;
        return fileContent.match(functionRegex) || [];
    };
    return TestGenerator;
}());
exports.TestGenerator = TestGenerator;
function removeDuplicateImports(allTestCases) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            /*
            Remove the duplicate import code since the unit test cases are first generated based on per function basis of each file, and duplicate import, e.g. import { add } from './sample' will be generated for each function
            allTestCases:
            [
                {
                    fileName: 'sample.ts',
                    testSource: "import { add } from 'test/sample';\n"
                    ...
                    "import { add } from 'test/sample';\n"
                    ...
                }
            ]
            */
            return [2 /*return*/, allTestCases.map(function (testCase) {
                    var lines = testCase.testSource.split('\n');
                    var uniqueImports = new Set();
                    var filteredLines = lines.filter(function (line) {
                        if (line.trim().startsWith('import ')) {
                            if (uniqueImports.has(line)) {
                                return false; // Skip duplicate import
                            }
                            uniqueImports.add(line);
                        }
                        return true; // Keep non-import lines and unique imports
                    });
                    return {
                        fileName: testCase.fileName,
                        testSource: filteredLines.join('\n')
                    };
                })];
        });
    });
}
function generateUnitTestsSuite(client, modelId, octokit, repo, unitTestSourceFolder) {
    return __awaiter(this, void 0, void 0, function () {
        var pullRequest, branchName, allTestCases, allCoverageSummaries, allTestResults, tags, baselineTagExists, files, _i, files_1, file, content, decodedContent, fileMeta, _a, generatedTests, coverageSummary, testResults, error_1, error_2, changedFiles, _b, changedFiles_1, file, content, decodedContent, fileMeta, _c, generatedTests, coverageSummary, testResults, readmeContent, _d, allTestCases_1, testCase, sourceFileName, testFileName, testFilePath, fileSha, existingFile, error_3, passedTests, failedTests, readmeFilePath, readmeFileSha, existingReadme, error_4, error_5;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    pullRequest = github_1.context.payload.pull_request;
                    branchName = pullRequest.head.ref;
                    allTestCases = [];
                    allCoverageSummaries = [];
                    allTestResults = [];
                    return [4 /*yield*/, octokit.rest.repos.listTags(__assign(__assign({}, repo), { per_page: 100 }))];
                case 1:
                    tags = (_e.sent()).data;
                    baselineTagExists = tags.some(function (tag) { return tag.name === 'auto-unit-test-baseline'; });
                    if (!!baselineTagExists) return [3 /*break*/, 15];
                    console.log('Baseline tag does not exist, generating tests for all .ts files in the specified folder');
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 9, , 10]);
                    return [4 /*yield*/, octokit.rest.repos.getContent(__assign(__assign({}, repo), { path: unitTestSourceFolder }))];
                case 3:
                    files = (_e.sent()).data;
                    if (!Array.isArray(files)) return [3 /*break*/, 8];
                    _i = 0, files_1 = files;
                    _e.label = 4;
                case 4:
                    if (!(_i < files_1.length)) return [3 /*break*/, 8];
                    file = files_1[_i];
                    if (!(file.type === 'file' && file.name.endsWith('.ts'))) return [3 /*break*/, 7];
                    return [4 /*yield*/, octokit.rest.repos.getContent(__assign(__assign({}, repo), { path: file.path }))];
                case 5:
                    content = (_e.sent()).data;
                    if (!('content' in content && typeof content.content === 'string')) return [3 /*break*/, 7];
                    decodedContent = Buffer.from(content.content, 'base64').toString('utf8');
                    fileMeta = {
                        fileName: file.name,
                        filePath: file.path,
                        fileContent: decodedContent,
                        rootDir: unitTestSourceFolder
                    };
                    return [4 /*yield*/, generateTestCasesForFile(client, modelId, fileMeta)];
                case 6:
                    _a = _e.sent(), generatedTests = _a.generatedTests, coverageSummary = _a.coverageSummary, testResults = _a.testResults;
                    allTestCases.push({ fileName: file.name, testSource: generatedTests.join('\n\n') });
                    allCoverageSummaries.push(coverageSummary);
                    allTestResults = allTestResults.concat(testResults);
                    _e.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 4];
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_1 = _e.sent();
                    console.error('Failed to list files in the specified folder:', error_1);
                    throw error_1;
                case 10:
                    _e.trys.push([10, 13, , 14]);
                    return [4 /*yield*/, octokit.rest.git.createRef(__assign(__assign({}, repo), { ref: 'refs/tags/auto-unit-test-baseline', sha: pullRequest.head.sha }))];
                case 11:
                    _e.sent();
                    console.log('Tag auto-unit-test-baseline created successfully');
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                case 12:
                    _e.sent(); // Wait for 5 seconds
                    return [3 /*break*/, 14];
                case 13:
                    error_2 = _e.sent();
                    console.error('Failed to create tag:', error_2);
                    return [3 /*break*/, 14];
                case 14: return [3 /*break*/, 21];
                case 15:
                    console.log('Baseline tag exists, generating tests for changed .ts files in the PR');
                    return [4 /*yield*/, octokit.rest.pulls.listFiles(__assign(__assign({}, repo), { pull_number: pullRequest.number }))];
                case 16:
                    changedFiles = (_e.sent()).data;
                    _b = 0, changedFiles_1 = changedFiles;
                    _e.label = 17;
                case 17:
                    if (!(_b < changedFiles_1.length)) return [3 /*break*/, 21];
                    file = changedFiles_1[_b];
                    if (!(file.filename.startsWith(unitTestSourceFolder) && file.filename.endsWith('.ts'))) return [3 /*break*/, 20];
                    return [4 /*yield*/, octokit.rest.repos.getContent(__assign(__assign({}, repo), { path: file.filename, ref: pullRequest.head.sha }))];
                case 18:
                    content = (_e.sent()).data;
                    if (!('content' in content && typeof content.content === 'string')) return [3 /*break*/, 20];
                    decodedContent = Buffer.from(content.content, 'base64').toString('utf8');
                    fileMeta = {
                        fileName: file.filename,
                        filePath: file.filename,
                        fileContent: decodedContent,
                        rootDir: unitTestSourceFolder
                    };
                    return [4 /*yield*/, generateTestCasesForFile(client, modelId, fileMeta)];
                case 19:
                    _c = _e.sent(), generatedTests = _c.generatedTests, coverageSummary = _c.coverageSummary, testResults = _c.testResults;
                    allTestCases.push({ fileName: fileMeta.fileName, testSource: generatedTests.join('\n\n') });
                    allCoverageSummaries.push(coverageSummary);
                    allTestResults = allTestResults.concat(testResults);
                    _e.label = 20;
                case 20:
                    _b++;
                    return [3 /*break*/, 17];
                case 21:
                    if (allTestCases.length === 0) {
                        console.warn('No test cases generated. Returning empty array.');
                        throw new Error('No test cases generated. Returning empty array.');
                    }
                    return [4 /*yield*/, removeDuplicateImports(allTestCases)];
                case 22:
                    allTestCases = _e.sent();
                    if (!pullRequest) return [3 /*break*/, 38];
                    _e.label = 23;
                case 23:
                    _e.trys.push([23, 37, , 38]);
                    if (!branchName) {
                        throw new Error('Unable to determine the branch name');
                    }
                    readmeContent = "# Auto-Generated Unit Tests\n\n";
                    readmeContent += "This document provides an overview of the automatically generated unit tests for this project.\n\n";
                    readmeContent += "## Generated Test Suites\n\n";
                    _d = 0, allTestCases_1 = allTestCases;
                    _e.label = 24;
                case 24:
                    if (!(_d < allTestCases_1.length)) return [3 /*break*/, 31];
                    testCase = allTestCases_1[_d];
                    sourceFileName = testCase.fileName;
                    testFileName = sourceFileName.replace(/\.ts$/, '.test.ts');
                    testFilePath = "test/".concat(testFileName);
                    fileSha = void 0;
                    _e.label = 25;
                case 25:
                    _e.trys.push([25, 27, , 28]);
                    return [4 /*yield*/, octokit.rest.repos.getContent(__assign(__assign({}, repo), { path: testFilePath, ref: branchName }))];
                case 26:
                    existingFile = (_e.sent()).data;
                    if ('sha' in existingFile) {
                        fileSha = existingFile.sha;
                    }
                    return [3 /*break*/, 28];
                case 27:
                    error_3 = _e.sent();
                    console.log("File ".concat(testFilePath, " does not exist in the repository. Creating it."));
                    return [3 /*break*/, 28];
                case 28: return [4 /*yield*/, octokit.rest.repos.createOrUpdateFileContents(__assign(__assign({}, repo), { path: testFilePath, message: "Add or update unit tests for ".concat(sourceFileName), content: Buffer.from(testCase.testSource).toString('base64'), branch: branchName, sha: fileSha }))];
                case 29:
                    _e.sent();
                    console.log("Unit tests file ".concat(testFilePath, " created or updated successfully."));
                    // Add information to README content
                    readmeContent += "- **".concat(testFileName, "**: Tests for `").concat(sourceFileName, "`\n");
                    readmeContent += "  - Location: `".concat(testFilePath, "`\n");
                    readmeContent += "  - Source file: `".concat(unitTestSourceFolder, "/").concat(sourceFileName, "`\n\n");
                    _e.label = 30;
                case 30:
                    _d++;
                    return [3 /*break*/, 24];
                case 31:
                    // Add test coverage information
                    readmeContent += "## Test Coverage\n\n";
                    readmeContent += "The following test coverage was achieved during the pre-flight phase:\n\n";
                    readmeContent += "```\n";
                    readmeContent += JSON.stringify(aggregateCoverageSummaries(allCoverageSummaries), null, 2);
                    readmeContent += "\n```\n\n";
                    // Add test results summary
                    readmeContent += "## Test Results Summary\n\n";
                    passedTests = allTestResults.filter(function (result) { return result.outcome.status === "PASSED"; }).length;
                    failedTests = allTestResults.filter(function (result) { return result.outcome.status === "FAILED"; }).length;
                    readmeContent += "Total tests: ".concat(allTestResults.length, "\n");
                    readmeContent += "Passed tests: ".concat(passedTests, "\n");
                    readmeContent += "Failed tests: ".concat(failedTests, "\n\n");
                    // Add instructions for manual execution
                    readmeContent += "## Running Tests Manually\n\n";
                    readmeContent += "To run these unit tests manually, follow these steps:\n\n";
                    readmeContent += "1. Ensure you have Node.js and npm installed on your system.\n";
                    readmeContent += "2. Navigate to the project root directory in your terminal.\n";
                    readmeContent += "3. Install the necessary dependencies by running:\n";
                    readmeContent += "   ```\n   npm install\n   ```\n";
                    readmeContent += "4. Run the tests using the following command:\n";
                    readmeContent += "   ```\n   npm test\n   ```\n";
                    readmeContent += "\nThis will execute all the unit tests in the `test` directory.\n";
                    readmeFilePath = 'test/AUTO_GENERATED_TESTS_README.md';
                    readmeFileSha = void 0;
                    _e.label = 32;
                case 32:
                    _e.trys.push([32, 34, , 35]);
                    return [4 /*yield*/, octokit.rest.repos.getContent(__assign(__assign({}, repo), { path: readmeFilePath, ref: branchName }))];
                case 33:
                    existingReadme = (_e.sent()).data;
                    if ('sha' in existingReadme) {
                        readmeFileSha = existingReadme.sha;
                    }
                    return [3 /*break*/, 35];
                case 34:
                    error_4 = _e.sent();
                    console.log("README file ".concat(readmeFilePath, " does not exist in the repository. Creating it."));
                    return [3 /*break*/, 35];
                case 35: return [4 /*yield*/, octokit.rest.repos.createOrUpdateFileContents(__assign(__assign({}, repo), { path: readmeFilePath, message: 'Add or update README for auto-generated unit tests', content: Buffer.from(readmeContent).toString('base64'), branch: branchName, sha: readmeFileSha }))];
                case 36:
                    _e.sent();
                    console.log("README file ".concat(readmeFilePath, " created or updated successfully."));
                    return [3 /*break*/, 38];
                case 37:
                    error_5 = _e.sent();
                    console.error('Error occurred while pushing the changes to the PR branch', error_5);
                    throw error_5;
                case 38: return [2 /*return*/];
            }
        });
    });
}
function generateTestCasesForFile(client, modelId, fileMeta) {
    return __awaiter(this, void 0, void 0, function () {
        var temperatures, snippetMap, model, validator, collector, testGenerator;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    temperatures = [0.2, 0.5, 0.8, 1.0];
                    snippetMap = new snippetMap_1.SnippetMap();
                    model = new languageModel_1.LanguageModel(client, modelId);
                    validator = new testValidator_1.TestValidator();
                    collector = new resultCollector_1.BaseTestResultCollector();
                    testGenerator = new TestGenerator(temperatures, snippetMap, model, validator, collector);
                    return [4 /*yield*/, testGenerator.generateAndValidateTests(fileMeta, [])];
                case 1: return [2 /*return*/, _a.sent()]; // Assuming no snippets for now
            }
        });
    });
}
function aggregateCoverageSummaries(summaries) {
    var aggregate = {
        lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
        statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
        functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
        branches: { total: 0, covered: 0, skipped: 0, pct: 0 }
    };
    for (var _i = 0, summaries_1 = summaries; _i < summaries_1.length; _i++) {
        var summary = summaries_1[_i];
        for (var _a = 0, _b = ['lines', 'statements', 'functions', 'branches']; _a < _b.length; _a++) {
            var key = _b[_a];
            aggregate[key].total += summary[key].total;
            aggregate[key].covered += summary[key].covered;
            aggregate[key].skipped += summary[key].skipped;
        }
    }
    for (var _c = 0, _d = ['lines', 'statements', 'functions', 'branches']; _c < _d.length; _c++) {
        var key = _d[_c];
        aggregate[key].pct = aggregate[key].total === 0 ? 100 : (aggregate[key].covered / aggregate[key].total) * 100;
    }
    return aggregate;
}
