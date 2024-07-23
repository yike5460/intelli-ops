const core = require('@actions/core');
const github = require('@actions/github');
const AWS = require('aws-sdk');

async function run() {
  try {
    // Get inputs
    const githubToken = core.getInput('github-token');
    const awsRegion = core.getInput('aws-region');

    // Log inputs
    core.info(`GitHub Token: ${githubToken}`);
    core.info(`AWS Region: ${awsRegion}`);

    // AWS SDK will use the credentials set by configure-aws-credentials action
    AWS.config.update({ region: awsRegion });

    const bedrock = new AWS.BedrockRuntime();
    const octokit = github.getOctokit(githubToken);

    // Get PR details
    const { pull_request } = github.context.payload;
    const repo = github.context.repo;

    // Get changed files
    const { data: files } = await octokit.rest.pulls.listFiles({
      ...repo,
      pull_number: pull_request.number,
    });

    // Log changed files
    core.info(`Changed files: ${files.map(file => file.filename).join(', ')}`);

    let reviewComments = [];

    for (const file of files) {
      if (file.status !== 'removed') {
        const { data: content } = await octokit.rest.repos.getContent({
          ...repo,
          path: file.filename,
          ref: pull_request.head.sha,
        });

        const fileContent = Buffer.from(content.content, 'base64').toString();
        
        // Log file content
        core.info(`File content: ${fileContent}`);

        // Perform code review using AWS Bedrock
        const params = {
          modelId: "anthropic.claude-v2",
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify({
            prompt: `Please review the following code and provide constructive feedback:\n\n${fileContent}\n\nCode review:`,
            max_tokens_to_sample: 500,
            temperature: 0.7,
            top_p: 1,
          })
        };

        const bedrockResponse = await bedrock.invokeModel(params).promise();
        const review = JSON.parse(bedrockResponse.body).completion;

        reviewComments.push({
          path: file.filename,
          body: review,
        });
      }
    }

    // Post review comments
    await octokit.rest.pulls.createReview({
      ...repo,
      pull_number: pull_request.number,
      event: 'COMMENT',
      comments: reviewComments,
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();