import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
export declare function invokeModel(client: BedrockRuntimeClient, modelId: string, payloadInput: string): Promise<string>;
