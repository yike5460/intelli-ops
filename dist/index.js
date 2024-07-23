"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
async function run() {
    try {
        // Get inputs
        const githubToken = core.getInput('github-token');
        const awsRegion = core.getInput('aws-region');
        // Log inputs
        console.log(`GitHub Token: ${githubToken ? 'Token is set' : 'Token is not set'}`);
        console.log(`AWS Region: ${awsRegion}`);
        if (!githubToken) {
            throw new Error('GitHub token is not set');
        }
        // Configure AWS SDK, set region to us-east-1 if not provided
        const client = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: awsRegion || 'us-east-1' });
        const octokit = (0, github_1.getOctokit)(githubToken);
        // Get PR details
        const { pull_request } = github_1.context.payload;
        const repo = github_1.context.repo;
        if (!pull_request) {
            throw new Error('No pull request found in the context');
        }
        // Log PR details
        console.log(`Reviewing PR #${pull_request.number} in ${repo.owner}/${repo.repo}`);
        // Get changed files
        const { data: files } = await octokit.rest.pulls.listFiles({
            ...repo,
            pull_number: pull_request.number,
        });
        let reviewComments = [];
        for (const file of files) {
            if (file.status !== 'removed') {
                const { data: content } = await octokit.rest.repos.getContent({
                    ...repo,
                    path: file.filename,
                    ref: pull_request.head.sha,
                });
                if ('content' in content) {
                    const fileContent = Buffer.from(content.content, 'base64').toString();
                    // Log file content
                    console.log(`File: ${file.filename}`);
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
                        awsRegion: awsRegion,
                    };
                    // Invoke Claude with the payload
                    const command = new client_bedrock_runtime_1.InvokeModelCommand({
                        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
                        contentType: "application/json",
                        body: JSON.stringify(payload),
                    });
                    const apiResponse = await client.send(command);
                    // Decode and process the response
                    const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
                    const responseBody = JSON.parse(decodedResponseBody);
                    const review = responseBody.content[0].text;
                    // Log review
                    console.log(`Review: ${review}`);
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
            pull_number: pull_request.number,
            event: 'COMMENT',
            comments: reviewComments,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed('An unknown error occurred');
        }
    }
}
run();
