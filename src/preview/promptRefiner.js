"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptRefiner = void 0;
var PromptRefiner = /** @class */ (function () {
    function PromptRefiner() {
    }
    PromptRefiner.refinePrompt = function (prompt, error) {
        var refinedPrompts = [];
        // SnippetIncluder
        if (!prompt.hasSnippets()) {
            refinedPrompts.push(prompt.addSnippets());
        }
        // RetryWithError
        refinedPrompts.push(prompt.addError(error));
        // DocCommentIncluder
        if (!prompt.hasDocComments()) {
            refinedPrompts.push(prompt.addDocComments());
        }
        // FunctionBodyIncluder
        if (!prompt.hasFunctionBody()) {
            refinedPrompts.push(prompt.addFunctionBody());
        }
        return refinedPrompts;
    };
    return PromptRefiner;
}());
exports.PromptRefiner = PromptRefiner;
