Handy notes:
To debug locally:
1. Install the Vercel CLI: npm i -g vercel
2. Run vercel dev in your project directory: vercel dev
3. Send a request to your local server: 

```
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: issue_comment" \
  -d @sample-payload.json
```

To set up the webhook URL in your GitHub app:
1. Deploy your app to Vercel using vercel deploy --prod
2. Get your deployment URL (e.g., https://your-app.vercel.app)
3. Setup the environment variable include GITHUB_APP_TOKEN and AWS credentials in Vercel, go to https://vercel.com/settings/environment-variables and add the variables
4. In your GitHub app settings, set the webhook URL to https://your-app.vercel.app/api/webhook