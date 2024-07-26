import * as core from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

interface PullRequest {
  number: number;
  head: {
    sha: string;
  };
}

interface ReviewComment {
  path: string;
  body: string;
  position?: number;
}

interface PullFile {
  filename: string;
  status: string;
  patch?: string;
}

function splitContentIntoChunks(content: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  content.split('\n').forEach(line => {
    if (currentChunk.length + line.length > maxChunkSize) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += line + '\n';
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function shouldExcludeFile(filename: string, excludePatterns: string[]): boolean {
  return excludePatterns.some(pattern => {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    return regex.test(filename);
  });
}

// Refer to https://google.github.io/eng-practices/review/reviewer/looking-for.html and https://google.github.io/eng-practices/review/reviewer/standard.html
const code_review_prompt_template = 
`<task_context>
You are an expert code reviewer tasked with reviewing a code change (CL) for a software project. Your primary goal is to ensure that the overall code health of the system is improving while allowing developers to make progress.
</task_context>

<tone_context>
Maintain a constructive and educational tone. Be thorough but not overly pedantic. Remember that the goal is continuous improvement, not perfection.
</tone_context>

<background_data>
<project_info>
[Insert brief description of the project, its goals, and any relevant context]
</project_info>

<code_change>
[Insert the code change to be reviewed, including file names and line numbers if applicable]
</code_change>
</background_data>

<detailed_task_description>
Review the provided code change, considering the following aspects:
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
- Nitpick: Minor stylistic or preferential changes, prefixed with "Nit:".
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

<output_format>
Provide your review in the following format:

Summary:
[Conclude the review with one of the following statements: "Approve", "Approve with minor modifications", or "Request changes", in one of the categories below]

Critical Issues:
[List any critical issues that need to be addressed]

Improvements:
[List suggested improvements]

Nitpicks:
[List any nitpicks or minor suggestions]
</output_format>

<immediate_task>
Please review the provided code change and provide your feedback following the guidelines and format specified above.
</immediate_task>
`;

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('github-token');
    const awsRegion = core.getInput('aws-region');
    const excludeFiles = core.getInput('exclude-files');
    const excludePatterns = excludeFiles ? excludeFiles.split(',').map(p => p.trim()) : [];

    console.log(`GitHub Token: ${githubToken ? 'Token is set' : 'Token is not set'}`);
    console.log(`AWS Region: ${awsRegion}`);
    console.log(`Excluded file patterns: ${excludePatterns.join(', ')}`);

    if (!githubToken) {
      throw new Error('GitHub token is not set');
    }

    const client = new BedrockRuntimeClient({ region: awsRegion || 'us-east-1' });
    const octokit = getOctokit(githubToken);

    if (!context.payload.pull_request) {
      console.log('No pull request found in the context. This action should be run only on pull request events.');
      return;
    }

    const pullRequest = context.payload.pull_request as PullRequest;
    const repo = context.repo;

    console.log(`Reviewing PR #${pullRequest.number} in ${repo.owner}/${repo.repo}`);

    const { data: files } = await octokit.rest.pulls.listFiles({
      ...repo,
      pull_number: pullRequest.number,
    });

    let reviewComments: ReviewComment[] = [];

    for (const file of files as PullFile[]) {
      if (file.status !== 'removed' && file.patch && !shouldExcludeFile(file.filename, excludePatterns)) {
        console.log(`Reviewing file: ${file.filename}`);

        const changedLines = file.patch
          .split('\n')
          .filter(line => line.startsWith('+') && !line.startsWith('+++'))
          .map(line => line.substring(1));

        if (changedLines.length === 0) continue;

        const fileContent = changedLines.join('\n');
        const chunks = splitContentIntoChunks(fileContent, 4096);

        let formattedContent = code_review_prompt_template.replace('[Insert the code change to be reviewed, including file names and line numbers if applicable]', fileContent);

        const payload = {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: [{
                type: "text",
                text: formattedContent,
              }],
            },
          ],
        };

        const command = new InvokeModelCommand({
          modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
          contentType: "application/json",
          body: JSON.stringify(payload),
        });

        const apiResponse = await client.send(command);
        const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
        const responseBody = JSON.parse(decodedResponseBody);
        const review = responseBody.content[0].text;

        const position = file.patch.split('\n').findIndex(line => line.startsWith('+') && !line.startsWith('+++')) + 1;
        if (position > 0) {
          reviewComments.push({
            path: file.filename,
            body: review,
            position: position,
          });
        }
      } else {
        console.log(`Skipping file: ${file.filename}`);
      }
    }

    if (reviewComments.length > 0) {
      await octokit.rest.pulls.createReview({
        ...repo,
        pull_number: pullRequest.number,
        event: 'COMMENT',
        comments: reviewComments,
      });
      console.log('Code review comments posted successfully.');
    } else {
      console.log('No review comments to post.');
    }

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Error: ${error.message}`);
      console.error('Stack trace:', error.stack);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();
