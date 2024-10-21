import requests
import base64
import time
from datetime import datetime
import csv
from collections import Counter
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the GitHub token from environment variable
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')

if not GITHUB_TOKEN:
    raise ValueError("GITHUB_TOKEN is not set in the environment variables")

HEADERS = {
    'Authorization': f'token {GITHUB_TOKEN}',
    'Accept': 'application/vnd.github.v3+json',
}

def search_repos(query, page=1):
    url = f'https://api.github.com/search/code?q={query}&page={page}&per_page=100'
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}, {response.text}")
        return None

def get_file_content(url):
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        content = base64.b64decode(response.json()['content']).decode('utf-8')
        return content
    else:
        print(f"Error fetching file content: {response.status_code}, {response.text}")
        return None

def get_repo_info(repo_name):
    url = f'https://api.github.com/repos/{repo_name}'
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching repo info: {response.status_code}, {response.text}")
        return None

def analyze_workflow(content):
    lines = content.split('\n')
    job_names = []
    steps_with_action = []
    for i, line in enumerate(lines):
        if line.strip().startswith('jobs:'):
            for j in range(i+1, len(lines)):
                if lines[j].strip() and not lines[j].startswith(' '):
                    break
                if not lines[j].startswith('  '):
                    job_names.append(lines[j].strip().rstrip(':'))
        if 'yike5460/intelli-ops@stable' in line:
            step_name = "Unknown"
            for k in range(i-1, -1, -1):
                if lines[k].strip().startswith('- name:'):
                    step_name = lines[k].split('name:')[1].strip()
                    break
            steps_with_action.append(step_name)
    return job_names, steps_with_action

def main():
    query = 'yike5460/intelli-ops@stable+in:file+path:.github/workflows'
    page = 1
    results = []
    repo_types = Counter()
    job_names = Counter()
    step_names = Counter()

    while True:
        print(f"Fetching page {page}...")
        data = search_repos(query, page)
        
        if not data or 'items' not in data:
            break

        for item in data['items']:
            repo_name = item['repository']['full_name']
            file_path = item['path']
            file_url = item['html_url']
            raw_url = item['url']

            content = get_file_content(raw_url)
            if content:
                uses_count = content.count('yike5460/intelli-ops@stable')
                jobs, steps = analyze_workflow(content)
                
                repo_info = get_repo_info(repo_name)
                if repo_info:
                    repo_type = repo_info['language'] or 'Unknown'
                    repo_types[repo_type] += 1
                    
                job_names.update(jobs)
                step_names.update(steps)
                
                results.append({
                    'repo_name': repo_name,
                    'file_path': file_path,
                    'file_url': file_url,
                    'uses_count': uses_count,
                    'repo_type': repo_type,
                    'jobs': ', '.join(jobs),
                    'steps': ', '.join(steps)
                })

        if len(data['items']) < 100:  # Last page
            break

        page += 1
        time.sleep(10)  # Respect GitHub API rate limits

    # Save detailed results to CSV
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f'action_usage_detailed_{timestamp}.csv'
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['repo_name', 'file_path', 'file_url', 'uses_count', 'repo_type', 'jobs', 'steps']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for result in results:
            writer.writerow(result)

    # Save analysis results to JSON
    analysis_filename = f'action_usage_analysis_{timestamp}.json'
    analysis = {
        'total_repos': len(results),
        'repo_types': dict(repo_types),
        'top_10_job_names': dict(job_names.most_common(10)),
        'top_10_step_names': dict(step_names.most_common(10))
    }
    with open(analysis_filename, 'w', encoding='utf-8') as jsonfile:
        json.dump(analysis, jsonfile, indent=2)

    print(f"Detailed results saved to {filename}")
    print(f"Analysis results saved to {analysis_filename}")
    print(f"Total repositories using the action: {len(results)}")
    print(f"Top 5 repository types:")
    for repo_type, count in repo_types.most_common(5):
        print(f"  {repo_type}: {count}")

if __name__ == "__main__":
    main()
