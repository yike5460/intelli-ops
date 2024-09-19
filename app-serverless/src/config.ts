import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const GITHUB_APP_TOKEN = process.env.GITHUB_APP_TOKEN;
export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string | undefined;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY as string | undefined;

console.log('AWS_REGION:', AWS_REGION);
console.log('GITHUB_APP_TOKEN:', GITHUB_APP_TOKEN ? 'Set' : 'Not set');
console.log('AWS_ACCESS_KEY_ID:', AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
console.log('AWS_SECRET_ACCESS_KEY:', AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');