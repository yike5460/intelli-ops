import { Octokit } from '@octokit/rest';
import { WebhookEvent } from '@octokit/webhooks-types';
import { generateUnitTests, modularizeFunction, generateStats, findConsoleLogStatements, generateClassDiagram, debugBotConfig } from './utils';

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
        line: comment.line
      });
    } else if (commentBody.includes('@chatbot modularize this function')) {
      const modularizedFunction = await modularizeFunction(repository.full_name, pull_request.head.ref, comment.path, comment.line);
      await octokit.pulls.createReviewComment({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number,
        commit_id: comment.commit_id,
        path: comment.path,
        body: `Here's a modularized version of the function:\n\n${modularizedFunction}`,
        line: comment.line
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