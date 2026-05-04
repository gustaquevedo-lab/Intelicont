#!/usr/bin/env python3
"""
Create GitHub Issues from backlog/gh-issues.md
Usage:
  export GITHUB_TOKEN=your_token
  python scripts/create_gh_issues.py

Notes:
- This script reads backlog/gh-issues.md, parses sections starting with '### ' as individual issues,
  and creates corresponding issues on the repository gustaquevedo-lab/Intelicont.
- It will skip creating an issue if an issue with the exact same title already exists.
- It uses a simple body parsed from the section; you can adjust the formatting in backlog file if needed.
"""
import os
import argparse
import sys
import json
import urllib.request
import urllib.error
from urllib.parse import urljoin

REPO_OWNER = "gustaquevedo-lab"
REPO_NAME = "Intelicont"
API_BASE = "https://api.github.com/"

BACKLOG_FILE = os.path.join(os.path.dirname(__file__), "..", "backlog", "gh-issues.md")

def read_backlog(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
    return text

def parse_issues(md_text):
    issues = []
    lines = md_text.splitlines()
    current_title = None
    current_body_lines = []
    for line in lines:
        if line.strip().startswith("### "):
            # push previous
            if current_title is not None:
                issues.append((current_title, "\n".join(current_body_lines).strip()))
            current_title = line.strip()[4:].strip()
            current_body_lines = []
        else:
            if current_title is not None:
                current_body_lines.append(line)
    if current_title is not None:
        issues.append((current_title, "\n".join(current_body_lines).strip()))
    return issues

def get_existing_titles(token, owner, repo):
    titles = set()
    url = f"{API_BASE}repos/{owner}/{repo}/issues?state=open&per_page=100"
    req = urllib.request.Request(url, headers={"Authorization": f"token {token}", "Accept": "application/vnd.github+json"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            for item in data:
                titles.add(item.get('title'))
    except urllib.error.HTTPError as e:
        print(f"Warning: could not fetch existing issues: {e}")
    return titles

def create_issue(token, owner, repo, title, body, labels=None):
    url = f"{API_BASE}repos/{owner}/{repo}/issues"
    payload = {"title": title, "body": body}
    if labels:
        payload["labels"] = labels
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Authorization": f"token {token}", "Accept": "application/vnd.github+json", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode())
        return result
    return None

def main():
    parser = argparse.ArgumentParser(description="Create GitHub issues from backlog MD")
    parser.add_argument('--dry-run', action='store_true', help='Parse backlog and show what would be created, but do not call GitHub API')
    args = parser.parse_args()
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("Error: GITHUB_TOKEN environment variable not set.")
        if not args.dry_run:
            sys.exit(2)
    # Load backlog and parse issues
    backlog_md = read_backlog(BACKLOG_FILE)
    issues = parse_issues(backlog_md)

    existing = get_existing_titles(token, REPO_OWNER, REPO_NAME)

    created = []
    for title, body in issues:
        if title in existing:
            print(f"Skipping existing issue: {title}")
            continue
        # Basic labeling heuristic: epic/foundation/mvp
        labels = ["backlog"]
        if title.startswith("FND-"):
            labels.append("foundation")
        if title.startswith("MVP-"):
            labels.append("mvp")
        if title.startswith("IA-"):
            labels.append("ia")
        if title.startswith("SEC-"):
            labels.append("security")
        if title.startswith("OBS-"):
            labels.append("observability")
        if title.startswith("REL-"):
            labels.append("release")
        try:
            if args.dry_run:
                print(f"[DRY-RUN] Would create: {title}\nBody:\n{body[:1000]}...\nLabels: {labels}")
                created.append((title, None))
            else:
                res = create_issue(token, REPO_OWNER, REPO_NAME, title, body, labels=labels)
                created.append((title, res.get('number')))
                print(f"Created: {title} -> #{res.get('number')}")
        except urllib.error.HTTPError as e:
            print(f"Failed to create issue '{title}': {e}")
    print("Done. Created:", created)

if __name__ == '__main__':
    main()
