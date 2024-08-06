// import dotenv from 'dotenv';
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { invokeModel } from "./index";
import fetchMock from 'jest-fetch-mock';

// dotenv.config();
fetchMock.enableMocks();

describe('invokeModel', () => {
  let client: BedrockRuntimeClient;
  let modelId: string;
  let payloadInput: string;

  beforeEach(() => {
    client = new BedrockRuntimeClient({ region: 'us-east-1' });
    modelId = 'sagemaker.test.execute-api.test.amazonaws.com/prod';
    payloadInput = 'test input';
    fetchMock.resetMocks();
  });

  it('should invoke RESTFul endpoint exposed by API Gateway', async () => {
    const mockResponse = { generated_text: 'test response' };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await invokeModel(client, modelId, payloadInput);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`https://${modelId.split('sagemaker.')[1]}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: payloadInput,
        parameters: {
          max_new_tokens: 256,
          temperature: 0.1,
        },
      }),
    });
    expect(result).toEqual(mockResponse.generated_text);
  });

  // Add more tests for other branches of your function
});