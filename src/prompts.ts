export class Inputs {
    systemMessage: string
    title: string
    description: string
    rawSummary: string
    shortSummary: string
    filename: string
    fileContent: string
    fileDiff: string
    hunkContent: string
    patches: string
    diff: string
    commentChain: string
    comment: string
    languageName: string
  
    constructor(
        systemMessage = '',
        title = '',
        description = '',
        rawSummary = '',
        shortSummary = '',
        filename = '',
        fileContent = '',
        fileDiff = '',
        hunkContent = '',
        patches = '',
        diff = '',
        commentChain = '',
        comment = '',
        languageName = ''
    ) {
        this.systemMessage = systemMessage
        this.title = title
        this.description = description
        this.rawSummary = rawSummary
        this.shortSummary = shortSummary
        this.filename = filename
        this.fileContent = fileContent
        this.fileDiff = fileDiff
        this.hunkContent = hunkContent
        this.patches = patches
        this.diff = diff
        this.commentChain = commentChain
        this.comment = comment
        this.languageName = languageName
    }
  
    clone(): Inputs {
      return new Inputs(
        this.systemMessage,
        this.title,
        this.description,
        this.rawSummary,
        this.shortSummary,
        this.filename,
        this.fileContent,
        this.fileDiff,
        this.patches,
        this.diff,
        this.commentChain,
        this.comment
      )
    }
  
    render(content: string): string {
        if (!content) {
            return ''
        }
        if (this.hunkContent) {
            content = content.replace('{{hunk_content}}', this.hunkContent)
        }
        if (this.languageName) {
            content = content.replace('{{language_name}}', this.languageName)
        }
        return content
    }
}

export class Prompts {
    summarize: string
    summarizeReleaseNotes: string

    // Refer to https://google.github.io/eng-practices/review/reviewer/looking-for.html and https://google.github.io/eng-practices/review/reviewer/standard.html
    detailedReviewPrompt = 
`<task_context>
You are an expert code reviewer tasked with reviewing a code change (CL) for a software project. Your primary goal is to ensure that the overall code health of the system is improving while allowing developers to make progress. Your feedback should be constructive, educational, and focused on the most important issues.
</task_context>

<tone_context>
Maintain a constructive and educational tone. Be thorough but not overly pedantic. Remember that the goal is continuous improvement, not perfection.
</tone_context>

<code_change>
{{hunk_content}}
</code_change>

<detailed_task_description>
Review the provided code change, which is presented in diff format. Lines starting with '+' are additions, and lines starting with '-' are removals. Consider the following aspects:
1. Design: Evaluate the overall design and how it integrates with the existing system.
2. Functionality: Assess if the code does what it's intended to do and if it's good for the users.
3. Complexity: Check if the code is more complex than necessary.
4. Tests: Verify the presence and quality of unit, integration, or end-to-end tests.
5. Naming: Ensure clear and appropriate naming for variables, functions, and classes.
6. Comments: Check for clear and useful comments that explain why, not what.
7. Style: Verify adherence to the project's style guide.
8. Documentation: Check if necessary documentation is updated or added.
9. Potential issues: Look for possible concurrency problems, edge cases, or error handling issues.
10. Code health: Assess if the change improves the overall code health of the system.

Provide feedback on these aspects, categorizing your comments as follows:
- Critical: Issues that must be addressed before approval.
- Improvement: Suggestions that would significantly improve the code but aren't blocking.
- Suggestion: Minor stylistic or preferential changes, prefixed with "Suggestion:".
</detailed_task_description>

<rules>
1. Focus on the most important issues that affect code health and functionality.
2. Balance the need for improvement with the need to make progress.
3. Be specific in your feedback, referencing line numbers when applicable.
4. Explain the reasoning behind your suggestions, especially for design-related feedback.
5. If suggesting an alternative approach, briefly explain its benefits.
6. Acknowledge good practices and improvements in the code.
7. If relevant, mention any educational points that could help the developer learn, prefixed with "Learning opportunity:".
</rules>

If changed code is good or simple enough to skip or not fitting in categories: Critical, Improvements, Suggestions, please answer only "Looks Good To Me" directly. Otherwise provide your review in the following format. Limit the total response within 100 words, the output language should be {{language_name}}, and follow the output format below.

Summary:
Conclude the review with one of the following statements: "Approve", "Approve with minor modifications", or "Request changes", in ONLY one of the categories below

Critical Issues:
List any critical issues that need to be addressed, mandatory to include if the summary is "Request changes"

Improvements:
List potential improvements, mandatory to include if the summary is "Approve with minor modifications"

Suggestions:
List any minor suggestions, optional to include
`
    conciseReviewPrompt =
`<task_context>
You are an expert code reviewer tasked with reviewing a code change (CL) for a software project. Your primary goal is to ensure that the overall code health of the system is improving while allowing developers to make progress. Your feedback should be constructive, educational, and focused on the most important issues.
</task_context>

<tone_context>
Maintain a constructive and educational tone. Be thorough but not overly pedantic. Remember that the goal is continuous improvement, not perfection.
</tone_context>

<code_change>
{{hunk_content}}
</code_change>

<detailed_task_description>
Review the provided code change, which is presented in diff format. Lines starting with '+' are additions, and lines starting with '-' are removals. Consider the following aspects:
1. Design: Evaluate the overall design and how it integrates with the existing system.
2. Functionality: Assess if the code does what it's intended to do and if it's good for the users.
3. Complexity: Check if the code is more complex than necessary.
4. Tests: Verify the presence and quality of unit, integration, or end-to-end tests.
5. Comments: Check for clear and useful comments that explain why, not what.
6. Potential issues: Look for possible concurrency problems, edge cases, or error handling issues.

Provide feedback on these aspects, categorizing your comments as follows:
- Critical: Issues that must be addressed before approval.
- Improvement: Suggestions that would significantly improve the code but aren't blocking.
</detailed_task_description>

<rules>
1. Focus on the most important issues that affect code health and functionality.
2. Balance the need for improvement with the need to make progress.
3. Be specific in your feedback, referencing line numbers when applicable.
4. Explain the reasoning behind your suggestions, especially for design-related feedback.
5. If suggesting an alternative approach, briefly explain its benefits.
</rules>

If changed code is good or simple enough to skip or not fitting in categories: Critical, Improvements, please answer only "Looks Good To Me" directly. Otherwise provide your review in the following format. Limit the total response within 50 words. The output language should be {{language_name}}, and follow the output format below.

Summary:
Conclude the review with one of the following statements: "Approve", "Approve with minor modifications", or "Request changes", in ONLY one of the categories below

Critical Issues:
List any critical issues that need to be addressed, mandatory to include if the summary is "Request changes"

Improvements:
List potential improvements, mandatory to include if the summary is "Approve with minor modifications"
`
    reviewFileDiff = 
`## GitHub PR Title

{{title}} 

## Description

\`\`\`
$description
\`\`\`

## Summary of changes

\`\`\`
$short_summary
\`\`\`

## IMPORTANT Instructions

Input: New hunks annotated with line numbers and old hunks (replaced code). Hunks represent incomplete code fragments.
Additional Context: PR title, description, summaries and comment chains.
Task: Review new hunks for substantive issues using provided context and respond with comments if necessary.
Output: Review comments in markdown with exact line number ranges in new hunks. Start and end line numbers must be within the same hunk. For single-line comments, start=end line number. Must use example response format below.
Use fenced code blocks using the relevant language identifier where applicable.
Don't annotate code snippets with line numbers. Format and indent code correctly.
Do not use \`suggestion\` code blocks.
For fixes, use \`diff\` code blocks, marking changes with \`+\` or \`-\`. The line number range for comments with fix snippets must exactly match the range to replace in the new hunk.

- Do NOT provide general feedback, summaries, explanations of changes, or praises 
  for making good additions. 
- Focus solely on offering specific, objective insights based on the 
  given context and refrain from making broad comments about potential impacts on 
  the system or question intentions behind the changes.

If there are no issues found on a line range, you MUST respond with the 
text \`LGTM!\` for that line range in the review section. 

## Example

### Example changes

---new_hunk---
\`\`\`
  z = x / y
    return z

20: def add(x, y):
21:     z = x + y
22:     retrn z
23: 
24: def multiply(x, y):
25:     return x * y

def subtract(x, y):
  z = x - y
\`\`\`
  
---old_hunk---
\`\`\`
  z = x / y
    return z

def add(x, y):
    return x + y

def subtract(x, y):
    z = x - y
\`\`\`

---comment_chains---
\`\`\`
Please review this change.
\`\`\`

---end_change_section---

### Example response

22-22:
There's a syntax error in the add function.
\`\`\`diff
-    retrn z
+    return z
\`\`\`
---
24-25:
LGTM!
---

## Changes made to \`$filename\` for your review

$patches
`
    constructor(summarize = '', summarizeReleaseNotes = '') {
      this.summarize = summarize
      this.summarizeReleaseNotes = summarizeReleaseNotes
    }

    renderDetailedReviewPrompt(inputs: Inputs): string {
      return inputs.render(this.detailedReviewPrompt)
    }

    renderConciseReviewPrompt(inputs: Inputs): string {
      return inputs.render(this.conciseReviewPrompt)
    }

    renderReviewFileDiff(inputs: Inputs): string {
      return inputs.render(this.reviewFileDiff)
    }

}