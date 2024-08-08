jest.mock('aws-sdk', () => ({ client: jest.fn(() => ({ invoke_endpoint: jest.fn(() => ({ Body: { read: jest.fn(() => JSON.stringify({ result: 'mocked response' })) } })) })) }));

const event = { body: JSON.stringify({ prompt: 'test prompt', parameters: { max_new_tokens: 256, temperature: 0.1 } }) };
const context = {};

test('lambda_handler with valid input', async () => {
  const response = await lambda_handler(event, context);
  expect(response).toEqual({ statusCode: 200, body: JSON.stringify({ result: 'mocked response' }) });
});

jest.mock('aws-sdk', () => ({ client: jest.fn(() => ({ invoke_endpoint: jest.fn(() => ({ Body: { read: jest.fn(() => JSON.stringify({ result: 'mocked response' })) } })) })) }));

const event = { body: JSON.stringify({ parameters: { max_new_tokens: 256, temperature: 0.1 } }) };
const context = {};

test('lambda_handler with missing prompt', async () => {
  const response = await lambda_handler(event, context);
  expect(response).toEqual({ statusCode: 200, body: JSON.stringify({ result: 'mocked response' }) });
});

jest.mock('aws-sdk', () => ({ client: jest.fn(() => ({ invoke_endpoint: jest.fn(() => ({ Body: { read: jest.fn(() => JSON.stringify({ result: 'mocked response' })) } })) })) }));

const event = { body: 'invalid input' };
const context = {};

test('lambda_handler with invalid input', async () => {
  const response = await lambda_handler(event, context);
  expect(response).toEqual({ statusCode: 400, body: JSON.stringify({ error: 'Invalid input' }) });
});

