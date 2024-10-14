"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prompt = void 0;
var Prompt = /** @class */ (function () {
    function Prompt(apiFunction, snippets) {
        if (snippets === void 0) { snippets = []; }
        this.apiFunction = apiFunction;
        this.docComments = '';
        this.functionBody = '';
        this.error = '';
        this.id = "prompt_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        this.snippets = snippets;
    }
    Prompt.prototype.assemble = function () {
        var assembledPrompt = "Write a unit test for the following API function:\n\n".concat(this.apiFunction, "\n\n");
        if (this.snippets.length > 0) {
            assembledPrompt += "Usage examples:\n" + this.snippets.join("\n") + "\n\n";
        }
        if (this.docComments) {
            assembledPrompt += "Function documentation:\n" + this.docComments + "\n\n";
        }
        if (this.functionBody) {
            assembledPrompt += "Function body:\n" + this.functionBody + "\n\n";
        }
        if (this.error) {
            assembledPrompt += "Previous error:\n" + this.error + "\n\nPlease address this error in the new test.\n\n";
        }
        assembledPrompt += "Generate a complete, runnable unit test for this function:";
        return assembledPrompt;
    };
    Prompt.prototype.createTestSource = function (completion) {
        return "\nconst assert = require('assert');\nconst { ".concat(this.extractFunctionName(this.apiFunction), " } = require('../src/your-module');\n\ndescribe('").concat(this.extractFunctionName(this.apiFunction), " Tests', () => {\n    ").concat(completion, "\n});\n");
    };
    Prompt.prototype.extractFunctionName = function (apiFunction) {
        var match = apiFunction.match(/function\s+(\w+)/);
        return match && match[1] ? match[1] : 'UnknownFunction';
    };
    Prompt.prototype.hasSnippets = function () {
        return this.snippets.length > 0;
    };
    Prompt.prototype.hasDocComments = function () {
        return this.docComments !== '';
    };
    Prompt.prototype.hasFunctionBody = function () {
        return this.functionBody !== '';
    };
    Prompt.prototype.addSnippets = function () {
        // In a real implementation, you'd fetch snippets from somewhere
        var newSnippets = __spreadArray(__spreadArray([], this.snippets, true), ["const result = apiFunction(arg1, arg2);"], false);
        return new Prompt(this.apiFunction, newSnippets);
    };
    Prompt.prototype.addDocComments = function () {
        var newPrompt = new Prompt(this.apiFunction, this.snippets);
        newPrompt.docComments = "/** This function does something important */";
        return newPrompt;
    };
    Prompt.prototype.addFunctionBody = function () {
        var newPrompt = new Prompt(this.apiFunction, this.snippets);
        newPrompt.functionBody = "function body { /* implementation */ }";
        return newPrompt;
    };
    Prompt.prototype.addError = function (error) {
        var newPrompt = new Prompt(this.apiFunction, this.snippets);
        newPrompt.error = error;
        return newPrompt;
    };
    return Prompt;
}());
exports.Prompt = Prompt;
