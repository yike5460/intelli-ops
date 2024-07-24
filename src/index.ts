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
  line: number;
  side: 'RIGHT';
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

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('github-token');
    const awsRegion = core.getInput('aws-region');

    console.log(`GitHub Token: ${githubToken ? 'Token is set' : 'Token is not set'}`);
    console.log(`AWS Region: ${awsRegion}`);

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
      if (file.status !== 'removed' && file.patch) {
        console.log(`Reviewing file: ${file.filename}`);

        const changedLines = file.patch
          .split('\n')
          .filter(line => line.startsWith('+') && !line.startsWith('+++'))
          .map(line => line.substring(1));

        if (changedLines.length === 0) continue;

        const fileContent = changedLines.join('\n');

        // Split the file content into chunks if it exceeds the maximum token limit
        const chunks = splitContentIntoChunks(fileContent, 4096);
        if (chunks.length > 1) {
          console.log(`File content exceeds the maximum token limit. Splitting into ${chunks.length} chunks.`);
        }

        const payload = {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: [{ 
                type: "text",
                text: `Please review the following code changes and provide constructive feedback:\n\n${fileContent}\n\nCode review:`
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

        // Find the line numbers of the changes in the patch
        const lineNumbers = file.patch
          .split('\n')
          .reduce((acc, line, index) => {
            if (line.startsWith('+') && !line.startsWith('+++')) {
              acc.push(index + 1);
            }
            return acc;
          }, [] as number[]);

        console.log(`Review for ${file.filename}; Partial review from Claude ${review.substring(0, 100)}...; Line number changed ${lineNumbers.join(', ')}`);

        // Create a review comment for each changed line
        lineNumbers.forEach((lineNumber, index) => {
          reviewComments.push({
            path: file.filename,
            body: review,
            line: lineNumber,
            side: 'RIGHT',
          });
        });
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
