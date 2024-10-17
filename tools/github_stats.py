import requests
import os
from datetime import datetime, timedelta
import logging
import time
import sys
import json

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def fetch_data(url, headers=None, params=None, max_retries=5):
    retries = 0
    while retries < max_retries:
        try:
            if params:
                params = {k: str(v) if isinstance(v, int) else v for k, v in params.items()}
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            # Refer to the https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28
            remaining = int(response.headers.get('X-RateLimit-Remaining', 0))
            if remaining < 3:
                reset_time = int(response.headers.get('X-RateLimit-Reset', 0))
                current_time = datetime.utcnow().timestamp()
                sleep_time = max(reset_time - current_time, 0) + 1
                logging.warning(f"Rate limit low. Sleeping for {sleep_time:.2f} seconds.")
                sleep_with_progress(sleep_time)
            else:
                time.sleep(0.1)  # Reduced delay between successful requests
            
            return response.json(), response.headers
        
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None:
                if e.response.status_code == 403 and 'rate limit exceeded' in e.response.text.lower():
                    reset_time = int(e.response.headers.get('X-RateLimit-Reset', 0))
                    current_time = datetime.utcnow().timestamp()
                    sleep_time = max(reset_time - current_time, 0) + (2 ** retries)
                    logging.warning(f"Rate limit exceeded. Retrying in {sleep_time:.2f} seconds.")
                    sleep_with_progress(sleep_time)
                    retries += 1
                elif e.response.status_code == 403 and 'abuse detection' in e.response.text.lower():
                    sleep_time = (2 ** retries)
                    logging.warning(f"Abuse detection triggered. Retrying in {sleep_time:.2f} seconds.")
                    sleep_with_progress(sleep_time)
                    retries += 1
                else:
                    logging.error(f"HTTP error occurred: {e}")
                    return None, None
            else:
                logging.error(f"Error fetching data: {e}")
                return None, None
    
    logging.error("Max retries reached. Unable to fetch data.")
    return None, None

def sleep_with_progress(sleep_time):
    for i in range(int(sleep_time)):
        remaining_time = max(sleep_time - i, 0)  # Ensure remaining time is never negative
        sys.stdout.write(f"\rSleeping: {remaining_time:.1f} seconds remaining")
        sys.stdout.flush()
        time.sleep(1)
    sys.stdout.write("\rResuming fetching data...                 \n")
    sys.stdout.flush()

def get_github_stats(repo, days=30):
    # GitHub API endpoint
    api_url = f"https://api.github.com/repos/{repo}"
    
    # Get GitHub token from environment variable
    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        raise ValueError("GITHUB_TOKEN environment variable is not set")

    # Set up headers for authentication
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    }

    # Calculate the date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Initialize counters
    stats = {
        "pr_created": 0,
        "pr_updated": 0,
        "pr_closed": 0,
        "issues_opened": 0,
        "issues_closed": 0,
        "issue_comments": 0,
        "pr_commits": 0,  # New counter for PR commits
        "prCommit_and_issueReply_all": 0  # New metric
    }

    logging.info(f"Analyzing repository: {repo} for the last {days} days")
    logging.info(f"Date range: {start_date} to {end_date}")

    # Fetch pull requests
    pr_url = f"{api_url}/pulls"
    pr_params = {
        "state": "all",
        "sort": "updated",
        "direction": "desc",
        "per_page": 100
    }
    
    page = 1
    while True:
        logging.info(f"Fetching pull requests page {page}")
        prs, headers = fetch_data(pr_url, headers=headers, params=pr_params)
        if not prs:
            break
        
        for pr in prs:
            pr_created_at = datetime.strptime(pr["created_at"], "%Y-%m-%dT%H:%M:%SZ")
            pr_updated_at = datetime.strptime(pr["updated_at"], "%Y-%m-%dT%H:%M:%SZ")
            
            if start_date <= pr_created_at <= end_date:
                stats["pr_created"] += 1
            
            if start_date <= pr_updated_at <= end_date:
                stats["pr_updated"] += 1
            
            if pr["closed_at"]:
                pr_closed_at = datetime.strptime(pr["closed_at"], "%Y-%m-%dT%H:%M:%SZ")
                if start_date <= pr_closed_at <= end_date:
                    stats["pr_closed"] += 1
            
            # Fetch commits for this PR
            commits_url = pr["commits_url"]
            commits_page = 1
            pr_commit_count = 0
            while True:
                commits_params = {"per_page": 100, "page": commits_page}
                commits, commits_headers = fetch_data(commits_url, headers=headers, params=commits_params)
                if not commits:
                    logging.warning(f"No commits fetched for PR #{pr['number']}")
                    break
                
                if isinstance(commits, dict) and 'message' in commits:
                    logging.error(f"Error fetching commits for PR #{pr['number']}: {commits['message']}")
                    if 'rate limit exceeded' in commits['message'].lower():
                        # Wait and retry
                        time.sleep(10)  # Reduced wait time before retrying
                        continue
                    break

                for commit in commits:
                    try:
                        if isinstance(commit, dict) and 'commit' in commit:
                            commit_date = datetime.strptime(commit['commit']['committer']['date'], "%Y-%m-%dT%H:%M:%SZ")
                            if start_date <= commit_date <= end_date:
                                stats["pr_commits"] += 1
                                stats["prCommit_and_issueReply_all"] += 1
                                pr_commit_count += 1
                        else:
                            logging.warning(f"Unexpected commit format in PR #{pr['number']}: {commit}")
                    except KeyError as e:
                        logging.error(f"KeyError in commit data for PR #{pr['number']}: {e}")
                        logging.debug(f"Commit data: {commit}")
                    except ValueError as e:
                        logging.error(f"ValueError in parsing commit date for PR #{pr['number']}: {e}")
                        logging.debug(f"Commit data: {commit}")
                
                if 'next' not in requests.utils.parse_header_links(commits_headers.get('Link', '')):
                    break
                commits_page += 1
                time.sleep(0.1)  # Reduced delay between commit requests
            
            logging.info(f"Processed PR #{pr['number']}. Commits in this PR: {pr_commit_count}. Total commits so far: {stats['pr_commits']}")
            logging.info(f"Processed PR #{pr['number']}. Current commit count: {stats['pr_commits']}")

        if 'next' not in requests.utils.parse_header_links(headers.get('Link', '')):
            break
        page += 1
        pr_params['page'] = page
        time.sleep(0.5)  # Reduced delay between PR page requests

    logging.info(f"Finished processing all pull requests. Total commits: {stats['pr_commits']}")

    logging.info(f"Current stats after pull requests: {stats}")

    # Fetch issues
    issue_url = f"{api_url}/issues"
    issue_params = {
        "state": "all",
        "sort": "updated",
        "direction": "desc",
        "per_page": 100
    }
    
    page = 1
    while True:
        logging.info(f"Fetching issues page {page}")
        issues, headers = fetch_data(issue_url, headers=headers, params=issue_params)
        if not issues:
            logging.warning("No issues fetched. Breaking the loop.")
            break
        
        if isinstance(issues, dict) and 'message' in issues:
            logging.error(f"Error fetching issues: {issues['message']}")
            break

        for issue in issues:
            if not isinstance(issue, dict):
                logging.error(f"Unexpected issue format: {issue}")
                continue

            if "pull_request" in issue:
                continue  # Skip pull requests

            try:
                issue_created_at = datetime.strptime(issue["created_at"], "%Y-%m-%dT%H:%M:%SZ")
                
                if start_date <= issue_created_at <= end_date:
                    stats["issues_opened"] += 1
                
                if issue["closed_at"]:
                    issue_closed_at = datetime.strptime(issue["closed_at"], "%Y-%m-%dT%H:%M:%SZ")
                    if start_date <= issue_closed_at <= end_date:
                        stats["issues_closed"] += 1

                # Fetch issue comments
                comments_url = issue["comments_url"]
                comments, _ = fetch_data(comments_url, headers=headers)
                if comments:
                    for comment in comments:
                        comment_created_at = datetime.strptime(comment["created_at"], "%Y-%m-%dT%H:%M:%SZ")
                        if start_date <= comment_created_at <= end_date:
                            stats["issue_comments"] += 1
                            stats["prCommit_and_issueReply_all"] += 1  # Count issue replies
                time.sleep(1)  # Add a 1-second delay between comment requests
            except KeyError as e:
                logging.error(f"Missing key in issue data: {e}")
            except ValueError as e:
                logging.error(f"Error parsing date: {e}")

        if headers and 'Link' in headers:
            if 'next' not in requests.utils.parse_header_links(headers['Link']):
                break
        else:
            break
        page += 1
        issue_params['page'] = page
        time.sleep(0.5)  # Reduced delay between issue page requests

    return stats

def process_repos(repos, days=30):
    all_stats = {}
    for repo in repos:
        logging.info(f"Processing repository: {repo}")
        try:
            stats = get_github_stats(repo, days)
            all_stats[repo] = stats
        except Exception as e:
            logging.error(f"Error processing {repo}: {str(e)}")
            all_stats[repo] = {"error": str(e)}
    return all_stats

def generate_summary(all_stats, days):
    summary = {
        "total_repos": len(all_stats),
        "successful_repos": sum(1 for stats in all_stats.values() if "error" not in stats),
        "failed_repos": sum(1 for stats in all_stats.values() if "error" in stats),
        "total_pr_created": sum(stats.get("pr_created", 0) for stats in all_stats.values() if "error" not in stats),
        "total_pr_updated": sum(stats.get("pr_updated", 0) for stats in all_stats.values() if "error" not in stats),
        "total_pr_closed": sum(stats.get("pr_closed", 0) for stats in all_stats.values() if "error" not in stats),
        "total_issues_opened": sum(stats.get("issues_opened", 0) for stats in all_stats.values() if "error" not in stats),
        "total_issues_closed": sum(stats.get("issues_closed", 0) for stats in all_stats.values() if "error" not in stats),
        "total_issue_comments": sum(stats.get("issue_comments", 0) for stats in all_stats.values() if "error" not in stats),
        "total_pr_commits": sum(stats.get("pr_commits", 0) for stats in all_stats.values() if "error" not in stats),
        "total_prCommit_and_issueReply": sum(stats.get("prCommit_and_issueReply_all", 0) for stats in all_stats.values() if "error" not in stats),
    }

    return {
        "summary": summary,
        "details": all_stats,
        "analyzed_days": days,
        "date_generated": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    repos_input = input("Enter GitHub repositories (comma-separated, format: owner/repo): ")
    repos = [repo.strip() for repo in repos_input.split(',')]
    days = int(input("Enter the number of days to analyze (default 30): ") or 30)
    
    try:
        all_stats = process_repos(repos, days)
        summary = generate_summary(all_stats, days)

        # Print a brief summary to console
        print("\nSummary:")
        print(f"Total repositories processed: {summary['summary']['total_repos']}")
        print(f"Successful: {summary['summary']['successful_repos']}")
        print(f"Failed: {summary['summary']['failed_repos']}")
        print(f"Total Pull Requests Created: {summary['summary']['total_pr_created']}")
        print(f"Total Pull Requests Closed: {summary['summary']['total_pr_closed']}")
        print(f"Total Issues Opened: {summary['summary']['total_issues_opened']}")
        print(f"Total Issues Closed: {summary['summary']['total_issues_closed']}")
        print(f"Total Pull Request Commits: {summary['summary']['total_pr_commits']}")

        # Print detailed metrics for each repository
        print("\nDetailed Metrics per Repository:")
        for repo, stats in summary['details'].items():
            print(f"\n{repo}:")
            if "error" in stats:
                print(f"  Error: {stats['error']}")
            else:
                print(f"  Pull Requests Created: {stats['pr_created']}")
                print(f"  Pull Requests Updated: {stats['pr_updated']}")
                print(f"  Pull Requests Closed: {stats['pr_closed']}")
                print(f"  Issues Opened: {stats['issues_opened']}")
                print(f"  Issues Closed: {stats['issues_closed']}")
                print(f"  Issue Comments: {stats['issue_comments']}")
                print(f"  Pull Request Commits: {stats['pr_commits']}")
                print(f"  PR Commits and Issue Replies: {stats['prCommit_and_issueReply_all']}")

        # Save detailed results to a JSON file
        output_file = f"github_stats_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump(summary, f, indent=2)
        print(f"\nDetailed results saved to {output_file}")

    except Exception as e:
        logging.exception(f"An error occurred: {str(e)}")
