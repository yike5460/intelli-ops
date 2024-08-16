import { Octokit } from '@octokit/rest';
import { WebhookEvent } from '@octokit/webhooks-types';
import { generateUnitTests, modularizeFunction, generateStats, findConsoleLogStatements, generateClassDiagram, debugBotConfig } from './utils';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
const modelId = 'anthropic.claude-3-sonnet-20240229-v1:0'; // Replace with your desired model ID

export async function invokeModel(client: BedrockRuntimeClient, modelId: string, payloadInput: string): Promise<string> {
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
      // modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      modelId: modelId,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });

    const apiResponse = await client.send(command);
    const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
    const responseBody = JSON.parse(decodedResponseBody);
    const finalResult = responseBody.content[0].text;

    return finalResult;
  } catch (error) {
    console.error('Error occurred while invoking the model', error);
    throw error;
  }
}

export async function handleReviewComment(event: WebhookEvent, octokit: Octokit) {
  if ('comment' in event && 'pull_request' in event) {
    const { comment, pull_request, repository } = event;
    const commentBody = comment.body.toLowerCase();

    if (commentBody.includes('i pushed a fix in commit')) {
      const commitId = commentBody.split('commit')[1].trim();
      await octokit.pulls.createReplyForReviewComment({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number,
        comment_id: comment.id,
        body: `Thank you for pushing the fix. I'll review the changes in commit ${commitId}.`
      });
    } else if (commentBody.includes('generate unit testing code for this file')) {
      const unitTests = await generateUnitTests(repository.full_name, pull_request.head.ref, comment.path);
      await octokit.pulls.createReplyForReviewComment({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number,
        comment_id: comment.id,
        body: `Here are the generated unit tests for ${comment.path}:\n\n${unitTests}`
      });
    } else if (commentBody.includes('open a follow-up github issue for this discussion')) {
      const newIssue = await octokit.issues.create({
        owner: repository.owner.login,
        repo: repository.name,
        title: `Follow-up from PR #${pull_request.number}`,
        body: `This issue was created as a follow-up to the discussion in PR #${pull_request.number}.\n\nOriginal comment: ${comment.body}`
      });
      await octokit.pulls.createReplyForReviewComment({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number,
        comment_id: comment.id,
        body: `I've created a follow-up issue: ${newIssue.data.html_url}`
      });
    }
  }
}

export async function handleFileComment(event: WebhookEvent, octokit: Octokit) {
  if ('comment' in event && 'pull_request' in event) {
    const { comment, pull_request, repository } = event;
    const commentBody = comment.body.toLowerCase();

    if (commentBody.includes('@chatbot generate unit testing code for this file')) {
      const unitTests = await generateUnitTests(repository.full_name, pull_request.head.ref, comment.path);
      await octokit.pulls.createReviewComment({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number,
        commit_id: comment.commit_id,
        path: comment.path,
        body: `Here are the generated unit tests for ${comment.path}:\n\n${unitTests}`,
        line: comment.line ?? undefined
      });
    } else if (commentBody.includes('@chatbot modularize this function')) {
      const line = typeof comment.line === 'number' ? comment.line : undefined;
      if (line !== undefined) {
        const modularizedFunction = await modularizeFunction(repository.full_name, pull_request.head.ref, comment.path, line);
        await octokit.pulls.createReviewComment({
          owner: repository.owner.login,
          repo: repository.name,
          pull_number: pull_request.number,
          commit_id: comment.commit_id,
          path: comment.path,
          body: `Here's a modularized version of the function:\n\n${modularizedFunction}`,
          line: line
        });
      } else {
        console.error('Unable to modularize function: line number is not available');
      }
    }
  }
}

export async function handlePullRequest(event: WebhookEvent, octokit: Octokit) {
  if ('pull_request' in event) {
    const { pull_request, repository } = event;
    const prBody = pull_request.body?.toLowerCase() || '';

    if (prBody.includes('@chatbot review this pr')) {
      // Implement PR review logic here
      const reviewComment = "I've reviewed this PR. Here are my findings: ...";
      await octokit.pulls.createReview({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number,
        body: reviewComment,
        event: 'COMMENT'
      });
    } else if (prBody.includes('@chatbot summarize changes')) {
      // Implement change summary logic here
      const summary = "Here's a summary of the changes in this PR: ...";
      await octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: pull_request.number,
        body: summary
      });
    }
  }
}

export async function handlePRComment(event: WebhookEvent, octokit: Octokit) {
  if ('comment' in event && 'pull_request' in event) {
    const { comment, pull_request, repository } = event;
    const commentBody = comment.body.toLowerCase();

    if (commentBody.includes('@chatbot generate interesting stats')) {
      const stats = await generateStats(repository.full_name);
      await octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: pull_request.number,
        body: `Here are some interesting stats about this repository:\n\n${stats}`
      });
    } else if (commentBody.includes('@chatbot show all the console.log statements')) {
      const consoleLogStatements = await findConsoleLogStatements(repository.full_name, pull_request.head.ref);
      await octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: pull_request.number,
        body: `Here are all the console.log statements in this repository:\n\n${consoleLogStatements}`
      });
    } else if (commentBody.includes('@chatbot read') && commentBody.includes('and generate')) {
      const filePath = commentBody.split('read')[1].split('and')[0].trim();
      if (commentBody.includes('unit testing code')) {
        const unitTests = await generateUnitTests(repository.full_name, pull_request.head.ref, filePath);
        await octokit.issues.createComment({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: pull_request.number,
          body: `Here are the generated unit tests for ${filePath}:\n\n${unitTests}`
        });
      } else if (commentBody.includes('class diagram')) {
        const classDiagram = await generateClassDiagram(repository.full_name, pull_request.head.ref, filePath);
        await octokit.issues.createComment({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: pull_request.number,
          body: `Here's the generated class diagram for ${filePath}:\n\n${classDiagram}`
        });
      }
    } else if (commentBody.includes('@chatbot help me debug coderabbit configuration file')) {
      const debugInfo = await debugBotConfig(repository.full_name, pull_request.head.ref);
      await octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: pull_request.number,
        body: `Here's some debug information for your CodeRabbit configuration:\n\n${debugInfo}`
      });
    }
  }
}

export async function handleIssueComment(event: WebhookEvent, octokit: Octokit) {
  if ('comment' in event && 'issue' in event) {
    const { comment, issue, repository } = event;
    const commentBody = comment.body.toLowerCase();
    const appName = '@intellibotdemo'; // Replace with your actual GitHub app name

    if (commentBody.includes(appName) && commentBody.toLowerCase().includes('generate') && commentBody.toLowerCase().includes('stats')) {
      const stats = await generateStats(repository.full_name);
      await octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: issue.number,
        body: `Here are some interesting stats about this repository:\n\n${stats}`
      });
    } else if (commentBody.startsWith(appName)) {
      const userQuery = commentBody.replace(appName, '').trim();
      try {
        let context = "Files involved in this PR:\n";
        
        // Check if the issue is actually a pull request
        if ('pull_request' in issue) {
          try {
            const { data: files } = await octokit.pulls.listFiles({
              owner: repository.owner.login,
              repo: repository.name,
              pull_number: issue.number,
            });
            console.log("files: ", files);
            for (const file of files) {
              context += `${file.filename}\n`;
              if (file.status !== 'removed') {
                try {
                  const { data: content } = await octokit.repos.getContent({
                    owner: repository.owner.login,
                    repo: repository.name,
                    path: file.filename,
                    // Removed the 'ref' parameter
                  });
                  if ('content' in content && typeof content.content === 'string') {
                    context += `Content:\n${Buffer.from(content.content, 'base64').toString('utf-8')}\n\n`;
                  } else {
                    context += `Unable to decode content for this file.\n\n`;
                  }
                } catch (contentError) {
                  console.error(`Error fetching content for ${file.filename}:`, contentError);
                  context += `Unable to fetch content for this file.\n\n`;
                }
              }
            }
          } catch (filesError) {
            console.error('Error fetching files:', filesError);
            context += 'Unable to fetch files for this pull request.\n';
          }
        } else {
          context += 'This is not a pull request, so no files are directly associated.\n';
        }
        const fullQuery = `${context}\n\nUser query: ${userQuery}`;
        console.log("final user query along with context: ", fullQuery);
        const response = await invokeModel(bedrockClient, modelId, fullQuery);
        await octokit.issues.createComment({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: issue.number,
          body: `Here's the response to your query:\n\n${response}`
        });
      } catch (error) {
        console.error('Error invoking the model:', error);
        console.error('GitHub App Token:', process.env.GITHUB_APP_TOKEN ? 'Set' : 'Not set');
        console.error('Octokit instance:', octokit ? 'Created' : 'Not created');
        await octokit.issues.createComment({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: issue.number,
          body: `I apologize, but I encountered an error while processing your request. Please try again later or contact the repository maintainer if the issue persists.`
        });
      }
    }
  }
}