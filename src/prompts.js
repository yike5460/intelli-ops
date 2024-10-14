"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prompts = exports.Inputs = void 0;
var Inputs = /** @class */ (function () {
    function Inputs(systemMessage, title, description, rawSummary, shortSummary, fileName, filePath, fileContent, fileDiff, patches, diff, commentChain, comment, languageName, 
    // code review
    hunkContent, 
    // unit test generation
    snippets, docComments, functionBody, generatedUnitTestCodeExecutionError, generatedUnitTestCode, 
    // app intention classification
    userQuery) {
        if (systemMessage === void 0) { systemMessage = ''; }
        if (title === void 0) { title = ''; }
        if (description === void 0) { description = ''; }
        if (rawSummary === void 0) { rawSummary = ''; }
        if (shortSummary === void 0) { shortSummary = ''; }
        if (fileName === void 0) { fileName = ''; }
        if (filePath === void 0) { filePath = ''; }
        if (fileContent === void 0) { fileContent = ''; }
        if (fileDiff === void 0) { fileDiff = ''; }
        if (patches === void 0) { patches = ''; }
        if (diff === void 0) { diff = ''; }
        if (commentChain === void 0) { commentChain = ''; }
        if (comment === void 0) { comment = ''; }
        if (languageName === void 0) { languageName = ''; }
        if (hunkContent === void 0) { hunkContent = ''; }
        if (snippets === void 0) { snippets = []; }
        if (docComments === void 0) { docComments = ''; }
        if (functionBody === void 0) { functionBody = ''; }
        if (generatedUnitTestCodeExecutionError === void 0) { generatedUnitTestCodeExecutionError = ''; }
        if (generatedUnitTestCode === void 0) { generatedUnitTestCode = ''; }
        if (userQuery === void 0) { userQuery = ''; }
        // unit test generation
        this.snippets = [];
        this.docComments = '';
        this.functionBody = '';
        this.generatedUnitTestCodeExecutionError = '';
        this.generatedUnitTestCode = '';
        // app intention classification
        this.userQuery = '';
        this.systemMessage = systemMessage;
        this.title = title;
        this.description = description;
        this.rawSummary = rawSummary;
        this.shortSummary = shortSummary;
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileContent = fileContent;
        this.fileDiff = fileDiff;
        this.functionBody = functionBody;
        this.hunkContent = hunkContent;
        this.patches = patches;
        this.diff = diff;
        this.commentChain = commentChain;
        this.comment = comment;
        this.languageName = languageName;
    }
    Inputs.prototype.clone = function () {
        return new Inputs(this.systemMessage, this.title, this.description, this.rawSummary, this.shortSummary, this.fileName, this.filePath, this.fileContent, this.fileDiff, this.patches, this.diff, this.commentChain, this.comment, this.languageName, 
        // code review
        this.hunkContent, 
        // unit test generation
        this.snippets, this.docComments, this.functionBody, this.generatedUnitTestCodeExecutionError, this.generatedUnitTestCode, 
        // app intention classification
        this.userQuery);
    };
    Inputs.prototype.render = function (content) {
        if (!content) {
            return '';
        }
        if (this.title) {
            content = content.replace('{{title}}', this.title);
        }
        if (this.description) {
            content = content.replace('{{description}}', this.description);
        }
        if (this.fileName) {
            content = content.replace('{{fileName}}', this.fileName);
        }
        if (this.filePath) {
            content = content.replace('{{file_path}}', this.filePath);
        }
        if (this.fileContent) {
            content = content.replace('{{file_content}}', this.fileContent);
        }
        if (this.functionBody) {
            content = content.replace('{{function_to_be_tested}}', this.functionBody);
        }
        if (this.shortSummary) {
            content = content.replace('{{short_summary}}', this.shortSummary);
        }
        if (this.hunkContent) {
            content = content.replace('{{hunk_content}}', this.hunkContent);
        }
        if (this.languageName) {
            content = content.replace('{{language_name}}', this.languageName);
        }
        if (this.snippets) {
            content = content.replace('{{snippets}}', this.snippets.join('\n'));
        }
        if (this.docComments) {
            content = content.replace('{{doc_comments}}', this.docComments);
        }
        if (this.functionBody) {
            content = content.replace('{{function_body}}', this.functionBody);
        }
        if (this.generatedUnitTestCodeExecutionError) {
            content = content.replace('{{generated_unit_test_code_execution_error}}', this.generatedUnitTestCodeExecutionError);
        }
        if (this.generatedUnitTestCode) {
            content = content.replace('{{generated_unit_test_code}}', this.generatedUnitTestCode);
        }
        if (this.userQuery) {
            content = content.replace('{{user_query}}', this.userQuery);
        }
        return content;
    };
    return Inputs;
}());
exports.Inputs = Inputs;
var Prompts = /** @class */ (function () {
    function Prompts(apiFunction, snippets, docComments, functionBody, summarize, summarizeReleaseNotes, refinedPrompt) {
        if (apiFunction === void 0) { apiFunction = ''; }
        if (snippets === void 0) { snippets = []; }
        if (docComments === void 0) { docComments = ''; }
        if (functionBody === void 0) { functionBody = ''; }
        if (summarize === void 0) { summarize = ''; }
        if (summarizeReleaseNotes === void 0) { summarizeReleaseNotes = ''; }
        if (refinedPrompt === void 0) { refinedPrompt = ''; }
        this.apiFunction = apiFunction;
        this.docComments = '';
        this.functionBody = '';
        // Refer to https://google.github.io/eng-practices/review/reviewer/looking-for.html and https://google.github.io/eng-practices/review/reviewer/standard.html
        this.detailedReviewPrompt = "<Task Context>\nYou are an expert code reviewer tasked with reviewing a code change (CL) for a software project, review new hunks for substantive issues using provided context and respond with comments if necessary. Your primary goal is to ensure that the overall code health of the system is improving while allowing developers to make progress. Your feedback should be constructive, educational, and focused on the most important issues.\n</Task Context>\n\n<Tone Context>\nMaintain a constructive and educational tone. Be thorough but not overly pedantic. Remember that the goal is continuous improvement, not perfection.\n</Tone Context>\n\n<GitHub PR context>\nGitHub PR Title:\n{{title}}\n\nGitHub PR Description:\n{{description}}\n\nFile name:\n{{fileName}}\n\nSummary of changes:\n{{short_summary}}\n\nHunk content:\n{{hunk_content}}\n</GitHub PR context>\n\n<Detailed Task Description>\n<Input and Output>\nInput: hunks content with hunk headers. Lines starting with '+' are additions, and lines starting with '-' are removals. Hunks represent incomplete code fragments with sample content shown below.\n@@ -1,3 +1,2 @@\n- This is the original line 1.\n- This is the original line 2.\n+ This is the new line 1.\n+ This is an unchanged line.\n@@ is the hunk header that shows where the changes are and how many lines are changed. In this case, it indicates that the changes start at line 1 of the old file and affect 3 lines, and start at line 1 of the new file and affect 2 lines\nAdditional Context: PR title, PR description, summaries.\n\nOutput: Review the input following the <Review Guidelines>, and output the review comments in the following format:\n- The review comment consists of: one sentence provide specific actionable feedback on the code change with bolded markdown text, and explanation of the feedback with exact line number ranges in new hunks in markdown format. Start and end line numbers must be within the same hunk. For single-line comments, start=end line number.\n- Use fenced code blocks using the relevant language identifier where applicable.\n- Don't annotate code snippets with line numbers. Format and indent code correctly.\n- Do not use `suggestion` code blocks.\n- XML tag must not be outputted.\n- For fixes, use `diff` code blocks, marking changes with `+` or `-`. The line number range for comments with fix snippets must exactly match the range to replace in the new hunk.\n- If there are no issues found or simple enough on a line range, you MUST respond with the text `Looks Good To Me!` in the beginning for that line range in the review section only, no more output otherwise.\n- Limit the total response within 100 words, the output language should be {{language_name}}.\n- Refer to the <Examples> below for the exact format of the output.\n</Input and Output>\n\n<Review Guidelines>\n- Do NOT provide general feedback, summaries, explanations of changes, or praises for making good additions. \n- Focus solely on offering specific, objective insights based on the given context and refrain from making broad comments about potential impacts on the system or question intentions behind the changes.\n- Focus on the most important issues that affect code health and functionality.\n- Balance the need for improvement with the need to make progress.\n- Be specific in your feedback, referencing line numbers when applicable.\n- Explain the reasoning behind your suggestions, especially for design-related feedback.\n- If suggesting an alternative approach, briefly explain its benefits.\n- Acknowledge good practices and improvements in the code.\n</Review Guidelines>\n</Detailed Task Description>\n\n<Examples>\n<Input>\n--- example.js\n+++ example.js\n@@ -7,9 +7,13 @@ const _ = require(\"underscore\");\n  */\n\nfunction exampleCall({ nameObj } = {}) {\n-  const retObj = { ..._.omit(nameObj, \"firstName\", \"lastName\"), firstName: nameObj.firstName, lastName: nameObj.lastName };\n+  const retObj = {\n+    ..._.omit(nameObj, \"firstName\", \"lastName\"),\n+    firstName: nameObj.firstName,\n+    lastName: nameObj.lastName\n+  };\n\n-  if (!nameObj.firstName && !nameObj.lastName) {\n+  if (!nameObj || (!nameObj.firstName && !nameObj.lastName)) {\n     retObj.anObjectHasNoName = true;\n   }\n</Input>\n\n<Output>\n7-13:\nLooks Good To Me! The code has been reformatted to improve readability. This change looks good and follows best practices for object formatting.\n\n14-14:\nLooks Good To Me! The condition has been updated to include a null check for <nameObj>. This is a good defensive programming practice.\n</Output>\n\n<Input>\n--- another_example.js\n+++ another_example.js\n@@ -13,7 +13,7 @@ function exampleCall({ nameObj } = {}) {\n     lastName: nameObj.lastName\n   };\n \n-  if (!nameObj || (!nameObj.firstName && !nameObj.lastName)) {\n+  if (!nameObj.firstName && !nameObj.lastName) {\n     retObj.anObjectHasNoName = true;\n   }\n</Input>\n\n<Output>\n13-13:\n\n\n**Consider adding null check for `nameObj`.**\n\n\nThe condition has removed the null check for `nameObj`. This change could potentially lead to null pointer exceptions if `nameObj` is undefined or null. Consider to add the null check to ensure defensive programming practices.\n\n```diff\n-  if (!nameObj || (!nameObj.firstName && !nameObj.lastName)) {\n+  if (!nameObj.firstName && !nameObj.lastName) {\n```\n\n</Output>\n<Examples>\n";
        // TODO: add concise review prompt, use the same format as detailed review prompt for now
        this.conciseReviewPrompt = this.detailedReviewPrompt;
        /**
    * Structured representation of a prompt we finally send to the model to generate test cases, which is a generation from another prompt.
    *
    * ```js
    * let mocha = require('mocha');            // -+
    * let assert = require('assert');          //  | Imports
    * let pkg = require('pkg');                // -+
    *
    * // usage #1                              // -+
    * ...                                      //  |
    * // usage #2                              //  | Usage snippets
    * ...                                      // -+
    *
    * // this does...                          // -+
    * // @param foo                            //  |
    * // @returns bar                          //  | Doc comment
    * ...                                      // -+
    *
    * // fn(args)                              //    Signature of the function we're testing
    * // function fn(args) {                   // -+
    * //     ...                               //  | Function body (optional)
    * // }                                     // -+
    *
    * describe('test pkg', function() {        //    Test suite header
    *   it('test fn', function(done) {         //    Test case header
    * ```
    *
    * The structured representation keeps track of these parts and provides methods
    * to assemble them into a textual prompt and complete them into a test case.
    */
        this.preProcessUnitTestGenerationPrompt = "\nTODO\n";
        this.unitTestGenerationPrompt = "\n<Task Context>\nYou are an expert TypeScript developer specializing in unit testing. Your task is to analyze the following TypeScript code and generate comprehensive unit tests using Jest.\n</Task Context>\n\n<Code Context>\n// File name:\n{{fileName}}\n\n// File path:\nFile path:\n{{file_path}}\n\n// Whole file content:\n{{file_content}}\n\nFunction to be tested:\n{{function_to_be_tested}}\n</Code Context>\n\n<Detailed Task Description>\n<Input and Output>\nInput: Code context including file name, file path, whole file content and function to be tested.\nOutput: Jest unit test code, with fenced code blocks using the relevant language identifier where applicable, do not include any explanatory text outside of the fenced code blocks.\n```typescript\n<Generated Unit Test Code>\n```\n</Input and Output>\n\n<Generation Guidelines>\n- Carefully read and understand the provided TypeScript code.\n- Ensure your tests are comprehensive and cover various scenarios, including edge cases.\n- Use clear and descriptive test names.\n- Include comments in your test code to explain the purpose of each test.\n- Follow TypeScript and Jest best practices.\n- Import internal dependencies and mock external modules in absolute path using file path, e.g. import { calculateDiscount } from 'src/example'.\n- Use jest.mock() to mock external dependencies like fs, path, and child_process.\n- Include setup and teardown code (beforeEach, afterEach) where necessary.\n- Use appropriate Jest matchers (e.g., toHaveBeenCalledWith, toThrow) for precise assertions.\n- Consider using test.each for parameterized tests when appropriate.\n- Ensure that async functions are properly tested using async/await syntax.\n</Generation Guidelines>\n\n<Example>\n<Input>\n// File name\nexample.ts\n\n// File path\nsrc/example.ts\n\n// Whole file content\nexport function otherFunction() {\n  return 'otherFunction'\n}\n\nexport function calculateDiscount(price: number, discountPercentage: number): number {\n  if (price < 0 || discountPercentage < 0 || discountPercentage > 100) {\n    throw new Error('Invalid input parameters');\n  }\n  \n  const discountAmount = price * (discountPercentage / 100);\n  return Number((price - discountAmount).toFixed(2));\n}\n\n// Function to be tested\nexport function calculateDiscount(price: number, discountPercentage: number): number {\n  if (price < 0 || discountPercentage < 0 || discountPercentage > 100) {\n    throw new Error('Invalid input parameters');\n  }\n  \n  const discountAmount = price * (discountPercentage / 100);\n  return Number((price - discountAmount).toFixed(2));\n}\n</Input>\n\n<Output>\n```typescript\nimport { calculateDiscount } from 'src/example'\n\ndescribe('calculateDiscount', () => {\n  it('should return the correct discount', () => {\n    expect(calculateDiscount(100, 10)).toBe(90);\n  });\n});\n```\n</Output>\n</Example>\n";
        this.unitTestGenerationRefinedPrompt = "\n<Task Context>\nYou are an expert TypeScript developer specializing in unit testing. Your task is to analyze the following TypeScript code, generated unit test code and error in the test case execution, then refine the generated unit test code accordingly.\n</Task Context>\n\n<Code Context>\n// File name:\n{{fileName}}\n\n// File path:  \n{{file_path}}\n\n// Whole file content:\n{{file_content}}\n\n// Function to be tested:\n{{function_to_be_tested}}\n\n// Generated unit test code:\n{{generated_unit_test_code}}\n\n// Error in the unit test execution:\n{{generated_unit_test_code_execution_error}}\n</Code Context>\n\n<Detailed Task Description>\n<Input and Output>\nInput: Code context including file name, file path, whole file content and function to be tested, generated unit test code and error in the test case execution.\nOutput: Refined unit test code, with fenced code blocks using the relevant language identifier where applicable, do not include any explanatory text outside of the fenced code blocks.\n```typescript\n<Refined Unit Test Code>\n```\n</Input and Output>\n\n<Generation Guidelines>\n- Carefully read and understand the provided TypeScript code, generated unit test code and error in the test case execution.\n- Fix the error in the test case execution and refine the generated unit test code accordingly.\n- Ensure that the refined unit test code is correct and comprehensive.\n- Use the absolute path and avoid using relative path e.g. import { calculateDiscount } from 'src/example' instead of import { calculateDiscount } from './example' or import { calculateDiscount } from '../example' or import { calculateDiscount } from '../../example'.\n</Generation Guidelines>\n\n<Example>\n<Input>\n// File name\nexample.ts\n\n// File path\nsrc/example.ts\n\n// Whole file content\nexport function otherFunction() {\n  return 'otherFunction'\n}\n\nexport function calculateDiscount(price: number, discountPercentage: number): number {\n  if (price < 0 || discountPercentage < 0 || discountPercentage > 100) {\n    throw new Error('Invalid input parameters');\n  }\n  \n  const discountAmount = price * (discountPercentage / 100);\n  return Number((price - discountAmount).toFixed(2));\n}\n\n// Function to be tested\nexport function calculateDiscount(price: number, discountPercentage: number): number {\n  if (price < 0 || discountPercentage < 0 || discountPercentage > 100) {\n    throw new Error('Invalid input parameters');\n  }\n  \n  const discountAmount = price * (discountPercentage / 100);\n  return Number((price - discountAmount).toFixed(2));\n}\n\n// Generated unit test code\nimport { calculateDiscount } from 'src/example'\ndescribe('calculateDiscount', () => {\n  it('should return the correct discount', () => {\n    expect(calculateDiscount(100, 10)).toBe(90);\n  });\n});\n\n// Error in the unit test execution\nError: expect(received).toBe(expected) // Object.is equality\n\nExpected: 90\nReceived: 90.00\n\n  4 |   it('should return the correct discount', () => {\n  5 |     expect(calculateDiscount(100, 10)).toBe(90);\n> 6 |   });\n    |   ^\n  7 | });\n\n</Input>\n\n<Output>\n```typescript\nimport { calculateDiscount } from 'src/example'\ndescribe('calculateDiscount', () => {\n  it('should return the correct discount', () => {\n    expect(calculateDiscount(100, 10)).toBeCloseTo(90, 2);\n  });\n});\n```\n</Output>\n</Example>\n";
        this.intentionClassificationPrompt = "\n<Task Context>\nYou are an AI assistant for a GitHub repository, designed to help users with various repository-related tasks.\n</Task Context>\n\n<Tone Context>\nMaintain a helpful and professional tone, focusing on accurately classifying user queries.\n</Tone Context>\n\n<Background Data>\nYou have access to repository statistics, code analysis tools, and configuration files.\n</Background Data>\n\n<Detailed Task Description>\n\n<Input and Output>\nInput: {{user_query}}\nOutput: Classify the user's query into one of the predefined categories, respond with only the category name, nothing else.\n</Input and Output>\n\n<Guidelines>\n- If the query doesn't fit any category, classify it as \"Other (general query)\".\n- Think step by step, reasoning through the query and the context of the repository\n- Do not attempt to execute any actions; your task is solely classification.\n- Compare the query to the predefined categories and examples, and choose the most appropriate category.\n</Guidelines>\n\n<Categories>\n- Code review and analysis\n- Repository management\n- Documentation tasks\n- GitHub Actions and CI/CD operations\n- Other (general query)\n</Categories>\n</Detailed Task Description>\n\n<Examples>\n<Input>\nI pushed a fix in commit 4a8fd9f, please review it.\n</Input>\n<Output>\nCode review and analysis\n</Output>\n\n<Input>\nSummarize stats about this repository and render them as a table. Additionally, render a pie chart showing the language distribution in the codebase.\n</Input>\n<Output>\nRepository management\n</Output\n\n<Input>\nGenerate a Pull Request description for this PR.\n</Input>\n<Output>\nDocumentation tasks\n</Output>\n</Examples>\n";
        this.id = "prompt_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        this.snippets = snippets;
        this.refinedPrompt = refinedPrompt;
        this.summarize = summarize;
        this.summarizeReleaseNotes = summarizeReleaseNotes;
    }
    Prompts.prototype.renderDetailedReviewPrompt = function (inputs) {
        return inputs.render(this.detailedReviewPrompt);
    };
    Prompts.prototype.renderConciseReviewPrompt = function (inputs) {
        return inputs.render(this.conciseReviewPrompt);
    };
    // TODO: refine the multiple prompts template
    Prompts.prototype.renderUnitTestGenerationPrompt = function (inputs) {
        return inputs.render(this.unitTestGenerationPrompt);
    };
    Prompts.prototype.renderUnitTestGenerationRefinedPrompt = function (inputs) {
        return inputs.render(this.unitTestGenerationRefinedPrompt);
    };
    Prompts.prototype.renderIntentionClassificationPrompt = function (inputs) {
        return inputs.render(this.intentionClassificationPrompt);
    };
    return Prompts;
}());
exports.Prompts = Prompts;
