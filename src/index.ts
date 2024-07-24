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

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('github-token');
    const awsRegion = core.getInput('aws-region');

    console.log(`GitHub Token: ${githubToken ? 'Token is set' : 'Token is not set'}`);
    console.log('GitHub context:', JSON.stringify(context, null, 2));

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

    for (const file of files) {
      if (file.status !== 'removed') {
        console.log(`Reviewing file: ${file.filename}`);

        const { data: patch } = await octokit.rest.pulls.get({
          ...repo,
          pull_number: pullRequest.number,
          mediaType: {
            format: 'diff',
          },
        });

        const filePatch = patch.split('diff --git').find(p => p.includes(`a/${file.filename} b/${file.filename}`));
        if (!filePatch) continue;

        const changedLines = filePatch.split('\n')
          .filter(line => line.startsWith('+') && !line.startsWith('+++'))
          .map(line => line.substring(1));

        if (changedLines.length === 0) continue;

        const fileContent = changedLines.join('\n');

        const payload = {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [{ 
                type: "text",
                text: `Please review the following code changes and provide constructive feedback for each changed line:\n\n${fileContent}\n\nCode review:`
              }],
            },
          ],
        };

        const command = new InvokeModelCommand({
          modelId: "anthropic.claude-3-haiku-20240307-v1:0",
          contentType: "application/json",
          body: JSON.stringify(payload),
        });

        const apiResponse = await client.send(command);
        const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
        const responseBody = JSON.parse(decodedResponseBody);
        const review = responseBody.content[0].text;

        console.log(`Review for ${file.filename}: ${review.substring(0, 100)}...`);

        // Split the review into lines
        const reviewLines = review.split('\n');
        let currentLine = 0;

        changedLines.forEach((line, index) => {
          const lineNumber = file.patch!.split('\n')
            .findIndex(l => l.startsWith('+') && l.substring(1) === line) + 1;

          if (lineNumber > 0 && index < reviewLines.length) {
            reviewComments.push({
              path: file.filename,
              body: reviewLines[index],
              line: lineNumber,
              side: 'RIGHT',
            });
          }
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
