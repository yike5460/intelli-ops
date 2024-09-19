import { VercelRequest, VercelResponse } from '@vercel/node';
import { WebhookEvent } from '@octokit/webhooks-types';
import { Octokit } from '@octokit/rest';
import { handleReviewComment, handlePullRequest, handleIssueComment } from '../src/handler';
import { GITHUB_APP_TOKEN } from '../src/config';

let octokit: Octokit | null = null;

if (GITHUB_APP_TOKEN) {
  octokit = new Octokit({ auth: GITHUB_APP_TOKEN });
  console.log("GitHub App Token is set:", !!GITHUB_APP_TOKEN);
} else {
  console.warn("GitHub App Token is not set. Some functionality may be limited.");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Received request:', req.method, req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!octokit) {
      return res.status(500).json({ error: 'GitHub App Token not configured' });
    }

    const event = req.body as WebhookEvent;
    const githubEvent = req.headers["x-github-event"] as string;
    console.log('githubEvent received: ', githubEvent);

    switch (githubEvent) {
      case "pull_request_review_comment":
        await handleReviewComment(event, octokit);
        break;
      case "pull_request":
        if ('action' in event) {
          if (event.action === "opened" || event.action === "synchronize") {
            await handlePullRequest(event, octokit);
          }
        }
        break;
      case "issue_comment":
        if ('action' in event && (event.action === "created" || event.action === "edited")) {
          await handleIssueComment(event, octokit);
        }
        break;
      default:
        console.log(`Unhandled event type: ${githubEvent}`);
    }
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}