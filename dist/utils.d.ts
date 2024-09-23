import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
export interface PullRequest {
    number: number;
    body: string;
    head: {
        sha: string;
        ref: string;
    };
}
export declare function exponentialBackoff<T>(fn: () => Promise<T>, maxRetries: number, initialDelay: number): Promise<T>;
export declare function invokeModel(client: BedrockRuntimeClient, modelId: string, payloadInput: string): Promise<string>;
