import express from 'express';
import { Octokit } from '@octokit/rest';
import { WebhookEvent } from '@octokit/webhooks-types';
import { handleReviewComment, handlePRComment, handlePullRequest } from './handlers';

const app = express();
app.use(express.json());

const octokit = new Octokit({ auth: process.env.GITHUB_APP_TOKEN });

app.post('/webhook', async (req, res) => {
  const event = req.body as WebhookEvent;
  const githubEvent = req.headers["x-github-event"] as string;
  console.log("Event received:", event);

  try {
    switch (githubEvent) {
      case "pull_request_review_comment":
        await handleReviewComment(event, octokit);
        break;
      case "pull_request":
        if ('action' in event) {
          if (event.action === "opened" || event.action === "synchronize") {
            await handlePullRequest(event, octokit);
          } else if (event.action === "created" && 'comment' in event) {
            await handlePRComment(event, octokit);
          }
        }
        break;
      default:
        console.log(`Unhandled event type: ${githubEvent}`);
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));