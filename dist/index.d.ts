import { getOctokit } from '@actions/github';
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
export declare function generatePRDescription(client: BedrockRuntimeClient, modelId: string, octokit: ReturnType<typeof getOctokit>): Promise<void>;
export declare function generateUnitTestsSuite(client: BedrockRuntimeClient, modelId: string, octokit: ReturnType<typeof getOctokit>, repo: {
    owner: string;
    repo: string;
}, unitTestSourceFolder: string): Promise<void>;
export declare function invokeModel(client: BedrockRuntimeClient, modelId: string, payloadInput: string): Promise<string>;
export declare function generateCodeReviewComment(bedrockClient: BedrockRuntimeClient, modelId: string, octokit: ReturnType<typeof getOctokit>, excludePatterns: string[], reviewLevel: string, outputLanguage: string): Promise<void>;
