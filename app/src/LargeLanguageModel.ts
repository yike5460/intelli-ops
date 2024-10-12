import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export class LargeLanguageModel {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor(client: BedrockRuntimeClient, modelId: string) {
    this.client = client;
    this.modelId = modelId;
  }

  async classify(prompt: string): Promise<string> {
    try {
      const result = await this.invokeModel(prompt);
      return result.trim();
    } catch (error) {
      console.error('Error occurred while classifying:', error);
      throw error;
    }
  }

  async invokeModel(payloadInput: string): Promise<string> {
    try {
      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [{
              type: "text",
              text: payloadInput,
            }],
          },
        ],
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });

      const apiResponse = await this.client.send(command);
      const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
      const responseBody = JSON.parse(decodedResponseBody);
      const finalResult = responseBody.content[0].text;

      return finalResult;
    } catch (error) {
      console.error('Error occurred while invoking the model', error);
      throw error;
    }
  }
}
