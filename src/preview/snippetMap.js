"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnippetMap = void 0;
var SnippetMap = /** @class */ (function () {
    function SnippetMap() {
        this.snippets = new Map();
    }
    SnippetMap.prototype.addSnippet = function (functionName, snippet) {
        if (!this.snippets.has(functionName)) {
            this.snippets.set(functionName, []);
        }
        this.snippets.get(functionName).push(snippet);
    };
    SnippetMap.prototype.getSnippets = function (functionName) {
        return this.snippets.get(functionName) || [];
    };
    SnippetMap.prototype.hasSnippets = function (functionName) {
        return this.snippets.has(functionName) && this.snippets.get(functionName).length > 0;
    };
    return SnippetMap;
}());
exports.SnippetMap = SnippetMap;
