const mockEvent = { body: JSON.stringify({ prompt: 'Hello, world!', parameters: { max_new_tokens: 256, temperature: 0.1 } }) }; const mockContext = {}; const mockSMRClient = { invoke_endpoint: jest.fn().mockReturnValueOnce({ Body: { read: () => JSON.stringify({ result: 'Hello, world! This is the response.' }) } }) }; const mockOS = { environ: { get: jest.fn().mockReturnValue('my-endpoint') } }; const lambda_handler = require('./notebook/lambda_function').lambda_handler; jest.mock('boto3', () => ({ client: jest.fn().mockReturnValue(mockSMRClient) })); jest.mock('os', () => mockOS); lambda_handler(mockEvent, mockContext).then(result => { expect(result).toEqual({ statusCode: 200, body: JSON.stringify({ result: 'Hello, world! This is the response.' }) }); });

const mockEvent = { body: JSON.stringify({ parameters: { max_new_tokens: 256, temperature: 0.1 } }) }; const mockContext = {}; const lambda_handler = require('./notebook/lambda_function').lambda_handler; lambda_handler(mockEvent, mockContext).then(result => { expect(result).toEqual({ statusCode: 400, body: JSON.stringify({ error: 'Missing prompt in the request body.' }) }); });

const mockEvent = { body: JSON.stringify({ prompt: 'Hello, world!', parameters: { max_new_tokens: 256, temperature: 0.1 } }) }; const mockContext = {}; const mockOS = { environ: { get: jest.fn().mockReturnValue(undefined) } }; const lambda_handler = require('./notebook/lambda_function').lambda_handler; jest.mock('os', () => mockOS); lambda_handler(mockEvent, mockContext).then(result => { expect(result).toEqual({ statusCode: 500, body: JSON.stringify({ error: 'SAGEMAKER_ENDPOINT_NAME environment variable not set.' }) }); });

const mockEvent = { body: JSON.stringify({ prompt: 'Hello, world!', parameters: { max_new_tokens: 256, temperature: 0.1 } }) }; const mockContext = {}; const mockSMRClient = { invoke_endpoint: jest.fn().mockRejectedValueOnce(new Error('SageMaker client error')) }; const mockOS = { environ: { get: jest.fn().mockReturnValue('my-endpoint') } }; const lambda_handler = require('./notebook/lambda_function').lambda_handler; jest.mock('boto3', () => ({ client: jest.fn().mockReturnValue(mockSMRClient) })); jest.mock('os', () => mockOS); lambda_handler(mockEvent, mockContext).catch(error => { expect(error).toEqual({ statusCode: 500, body: JSON.stringify({ error: 'SageMaker client error' }) }); });