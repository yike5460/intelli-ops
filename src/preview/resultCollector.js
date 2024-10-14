"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTestResultCollector = void 0;
var BaseTestResultCollector = /** @class */ (function () {
    function BaseTestResultCollector() {
        this.tests = new Map();
        this.prompts = new Map();
        this.testResults = [];
        this.coverageInfo = null;
    }
    BaseTestResultCollector.prototype.recordTestInfo = function (testInfo) {
        this.tests.set(testInfo.testName, testInfo);
    };
    BaseTestResultCollector.prototype.recordTestResult = function (testInfo) {
        this.testResults.push(testInfo);
    };
    BaseTestResultCollector.prototype.recordPromptInfo = function (prompt, completionsCount) {
        this.prompts.set(prompt.id, { prompt: prompt, completionsCount: completionsCount });
    };
    BaseTestResultCollector.prototype.recordCoverageInfo = function (coverageSummary) {
        this.coverageInfo = coverageSummary;
    };
    BaseTestResultCollector.prototype.hasPrompt = function (prompt) {
        return this.prompts.has(prompt.id);
    };
    BaseTestResultCollector.prototype.getTestResults = function () {
        return this.testResults;
    };
    BaseTestResultCollector.prototype.getTestSource = function (testName) {
        var testInfo = this.tests.get(testName);
        return testInfo ? testInfo.testSource : null;
    };
    BaseTestResultCollector.prototype.getCoverageInfo = function () {
        return this.coverageInfo || {
            lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
            statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
            functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
            branches: { total: 0, covered: 0, skipped: 0, pct: 0 }
        };
    };
    return BaseTestResultCollector;
}());
exports.BaseTestResultCollector = BaseTestResultCollector;
