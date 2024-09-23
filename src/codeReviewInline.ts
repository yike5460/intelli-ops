import * as core from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { invokeModel, PullRequest, PullFile, shouldExcludeFile, languageCodeToName, LanguageCode } from '@/src/utils';

const CODE_REVIEW_HEADER = "🔍 AI Code Review (Powered by Amazon Bedrock)";

interface ReviewComment {
    path: string;
    body: string;
    position?: number;
}

// Refer to https://google.github.io/eng-practices/review/reviewer/looking-for.html and https://google.github.io/eng-practices/review/reviewer/standard.html
const detailed_review_prompt = 
`<task_context>
You are an expert code reviewer tasked with reviewing a code change (CL) for a software project. Your primary goal is to ensure that the overall code health of the system is improving while allowing developers to make progress. Your feedback should be constructive, educational, and focused on the most important issues.
</task_context>

<tone_context>
Maintain a constructive and educational tone. Be thorough but not overly pedantic. Remember that the goal is continuous improvement, not perfection.
</tone_context>

<code_change>
{{CODE_SNIPPET}}
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

If changed code is good or simple enough to skip or not fitting in categories: Critical, Improvements, Suggestions, please answer only "Looks Good To Me" directly. Otherwise provide your review in the following format. Limit the total response within 100 words, the output language should be {{LANGUAGE_NAME}}, and follow the output format below.

Summary:
Conclude the review with one of the following statements: "Approve", "Approve with minor modifications", or "Request changes", in ONLY one of the categories below

Critical Issues:
List any critical issues that need to be addressed, mandatory to include if the summary is "Request changes"

Improvements:
List potential improvements, mandatory to include if the summary is "Approve with minor modifications"

Suggestions:
List any minor suggestions, optional to include
`;

const concise_review_prompt =
`<task_context>
You are an expert code reviewer tasked with reviewing a code change (CL) for a software project. Your primary goal is to ensure that the overall code health of the system is improving while allowing developers to make progress. Your feedback should be constructive, educational, and focused on the most important issues.
</task_context>

<tone_context>
Maintain a constructive and educational tone. Be thorough but not overly pedantic. Remember that the goal is continuous improvement, not perfection.
</tone_context>

<code_change>
{{CODE_SNIPPET}}
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

If changed code is good or simple enough to skip or not fitting in categories: Critical, Improvements, please answer only "Looks Good To Me" directly. Otherwise provide your review in the following format. Limit the total response within 50 words. The output language should be {{LANGUAGE_NAME}}, and follow the output format below.

Summary:
Conclude the review with one of the following statements: "Approve", "Approve with minor modifications", or "Request changes", in ONLY one of the categories below

Critical Issues:
List any critical issues that need to be addressed, mandatory to include if the summary is "Request changes"

Improvements:
List potential improvements, mandatory to include if the summary is "Approve with minor modifications"
`;

export async function generateCodeReviewComment(bedrockClient: BedrockRuntimeClient, modelId: string, octokit: ReturnType<typeof getOctokit>, excludePatterns: string[], reviewLevel: string, outputLanguage: string): Promise<void> {

  const pullRequest = context.payload.pull_request as PullRequest;
  const repo = context.repo;

  // fetch the list of files changed in the PR each time since the file can be changed in operation like unit test generation etc.
  const { data: files } = await octokit.rest.pulls.listFiles({
    ...repo,
    pull_number: pullRequest.number,
  });

  let reviewComments: { path: string; position: number; body: string }[] = [];
  let looksGoodToMeCount = 0;
  let ignoredFilesCount = 0;
  let selectedFilesCount = 0;
  let additionalCommentsCount = 0;
  let ignoredFilesDetails: string[] = [];
  let selectedFilesDetails: string[] = [];
  let additionalCommentsDetails: string[] = [];

  for (const file of files as PullFile[]) {
    // The sample contents of file.patch, which contains a unified diff representation of the changes made to a file in a pull request:
    // diff --git a/file1.txt b/file1.txt
    // index 7cfc5c8..e69de29 100644
    // --- a/file1.txt
    // +++ b/file1.txt
    // @@ -1,3 +1,2 @@
    // -This is the original line 1.
    // -This is the original line 2.
    // +This is the new line 1.
    //  This is an unchanged line.
    // @@ is the hunk header that shows where the changes are and how many lines are changed. In this case, it indicates that the changes start at line 1 of the old file and affect 3 lines, and start at line 1 of the new file and affect 2 lines.

    // console.log(`File patch content: ${file.patch} for file: ${file.filename}`);
    if (file.status !== 'removed' && file.patch && !shouldExcludeFile(file.filename, excludePatterns)) {
      selectedFilesCount++;

      // Split the patch into hunks
      const hunks = file.patch.split(/^@@\s+-\d+,\d+\s+\+\d+,\d+\s+@@/m);
      selectedFilesDetails.push(`${file.filename} (${hunks.length - 1} hunks)`);

      let totalPosition = 0;
      console.log(`======================= Debugging Hunks of file: ${file.filename} ========================\n ${hunks}\n ================================================`);
      for (const [hunkIndex, hunk] of hunks.entries()) {
        if (hunkIndex === 0) continue; // Skip the first element (it's empty due to the split)
        const hunkLines = hunk.split('\n').slice(1); // Remove the hunk header

        const diffContent = hunkLines.join('\n');
        console.log(`======================= Debugging Diff content ========================\n ${diffContent}\n ================================================`);
        const promptTemplate = reviewLevel === 'detailed' ? detailed_review_prompt : concise_review_prompt;
        let formattedContent = promptTemplate.replace('{{CODE_SNIPPET}}', diffContent);

        const languageName = languageCodeToName[outputLanguage as LanguageCode] || 'English';
        if (!(outputLanguage in languageCodeToName)) {
          core.warning(`Unsupported output language: ${outputLanguage}. Defaulting to English.`);
        }
        formattedContent = formattedContent.replace('{{LANGUAGE_NAME}}', languageName);

        var review = await invokeModel(bedrockClient, modelId, formattedContent);  

        if (!review || review.trim() == '') {
          console.warn(`No review comments generated for hunk ${hunkIndex} in file ${file.filename}, skipping`);
          continue;
        }

        if (review.trim() === 'Looks Good To Me') {
          looksGoodToMeCount++;
          additionalCommentsDetails.push(`Skip posting review for hunk ${hunkIndex} in file ${file.filename} due to "Looks Good To Me"`);
          continue;
        }

        // Prepend the header to each review comment
        const reviewWithHeader = `${CODE_REVIEW_HEADER}\n\n${review}`;

        // add the generated review comments to the end of per hunk
        const position = totalPosition + 1;
        reviewComments.push({
          path: file.filename,
          position: position,
          body: reviewWithHeader,
        });
        totalPosition += hunkLines.length;
      }
    } else {
      ignoredFilesCount++;
      console.log(`Skipping file: ${file.filename} due to the file being removed or explicitly excluded`);
      ignoredFilesDetails.push(`${file.filename} is excluded by exclude rules`);
    }
  }

  if (reviewComments.length > 0) {
    let summaryTemplate = `
{{CODE_REVIEW_HEADER}}

Actionable comments posted: ${reviewComments.length}
<details>
<summary>Review Details</summary>
<details>
<summary>Review option chosen</summary>
${reviewLevel}
</details>
<details>
<summary>Commits</summary>
Files that changed from the base of the PR and between ${pullRequest.base.sha} to ${pullRequest.head.sha}
</details>
<details>
<summary>Files ignored due to path filters (${ignoredFilesCount})</summary>
${ignoredFilesDetails.map(file => `- ${file}`).join('\n')}
</details>
<details>
<summary>Files selected for processing (${selectedFilesCount})</summary>
${selectedFilesDetails.map(file => `- ${file}`).join('\n')}
</details>
<details>
<summary>Additional comments not posted (${additionalCommentsCount})</summary>
${additionalCommentsDetails.map(file => `- ${file}`).join('\n')}
</details>
</details>
`;
    summaryTemplate = summaryTemplate.replace('{{CODE_REVIEW_HEADER}}', CODE_REVIEW_HEADER);
    try {
      await octokit.rest.pulls.createReview({
        ...repo,
        pull_number: pullRequest.number,
        commit_id: pullRequest.head.sha,
        body: summaryTemplate,
        event: 'COMMENT',
        comments: reviewComments,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      console.log('Code review comments posted successfully.');
    } catch (error) {
      console.error('Error posting code review comments:', error);
      throw error;
    }
  } else if (looksGoodToMeCount > 0) {
    console.log('Review result is "Looks Good To Me". No comments to post.');
  } else {
    console.log('No review comments to post.');
  }
}
