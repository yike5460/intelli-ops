import * as core from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

interface ReviewComment {
  path: string;
  body: string;
}

interface PullRequest {
  number: number;
  head: {
    sha: string;
  };
}

async function run(): Promise<void> {
  try {
    // Get inputs
    const githubToken = core.getInput('github-token');
    const awsRegion = core.getInput('aws-region');

    // Log inputs and context
    console.log(`GitHub Token: ${githubToken ? 'Token is set' : 'Token is not set'}`);
    console.log(`AWS Region: ${awsRegion}`);
    console.log('GitHub context:', JSON.stringify(context, null, 2));

    if (!githubToken) {
      throw new Error('GitHub token is not set');
    }

    // Configure AWS SDK
    const client = new BedrockRuntimeClient({ region: awsRegion || 'us-east-1' });

    const octokit = getOctokit(githubToken);

    // Check if we're in a pull request context
    if (!context.payload.pull_request) {
      console.log('No pull request found in the context. This action should be run only on pull request events.');
      return;
    }

    // const pullRequest = context.payload.pull_request;
    const pullRequest = context.payload.pull_request as PullRequest;
    const repo = context.repo;

    // Log PR details
    console.log(`Reviewing PR #${pullRequest.number} in ${repo.owner}/${repo.repo}`);

    // Get changed files
    const { data: files } = await octokit.rest.pulls.listFiles({
      ...repo,
      pull_number: pullRequest.number,
    });

    let reviewComments: ReviewComment[] = [];

    for (const file of files) {
      if (file.status !== 'removed') {
        const { data: content } = await octokit.rest.repos.getContent({
          ...repo,
          path: file.filename,
          ref: pullRequest.head.sha,
        });

        if ('content' in content) {
          const fileContent = Buffer.from(content.content, 'base64').toString();
        
          console.log(`Reviewing file: ${file.filename}`);

          // Prepare the payload for the model
          const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: [{ 
                  type: "text",
                  text: `Please review the following code and provide constructive feedback:\n\n${fileContent}\n\nCode review:`
                }],
              },
            ],
          };

          // Invoke Claude with the payload
          const command = new InvokeModelCommand({
            modelId: "anthropic.claude-3-haiku-20240307-v1:0",
            contentType: "application/json",
            body: JSON.stringify(payload),
          });

          const apiResponse = await client.send(command);

          // Decode and process the response
          const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
          const responseBody = JSON.parse(decodedResponseBody);
          const review = responseBody.content[0].text;

          console.log(`Review for ${file.filename}: ${review.substring(0, 100)}...`);

          reviewComments.push({
            path: file.filename,
            body: review,
          });
        }
      }
    }

    // Post review comments
    await octokit.rest.pulls.createReview({
      ...repo,
      pull_number: pullRequest.number,
      event: 'COMMENT',
      comments: reviewComments,
    });

    console.log('Code review completed successfully.');

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
