#!/usr/bin/env python3
"""
Create GitHub Issues from backlog/gh-issues-export.md using the
GitHub Actions provided GITHUB_TOKEN (no user-provided tokens required).

This script is intended to run inside a GitHub Actions workflow (workflow_dispatch).
It reads backlog/gh-issues-export.md, parses blocks, and creates issues in
gustaquevedo-lab/Intelicont via the GitHub API.
"""
import os
import sys
import json
import re
import urllib.request
from urllib.parse import urljoin

REPO_OWNER = "gustaquevedo-lab"
REPO_NAME = "Intelicont"
API_BASE = "https://api.github.com/"

TOKEN = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
if not TOKEN:
    print("Error: GITHUB_TOKEN not set in environment for GitHub Actions.")
    sys.exit(2)

BACKLOG_MD = os.path.join(os.path.dirname(__file__), "..", "backlog", "gh-issues-export.md")

def read_md(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def parse_issues(md_text):
    issues = []
    current_title = None
    current_body_lines = []
    for line in md_text.splitlines():
        if line.strip().startswith("### "):
            if current_title:
                issues.append((current_title.strip(), "\n".join(current_body_lines).strip()))
            current_title = line.strip()[4:]
            current_body_lines = []
        else:
            if current_title:
                current_body_lines.append(line)
    if current_title:
        issues.append((current_title.strip(), "\n".join(current_body_lines).strip()))
    return issues

def existing_titles():
    url = f"{API_BASE}repos/{REPO_OWNER}/{REPO_NAME}/issues?state=open&per_page=100"
    req = urllib.request.Request(url, headers={"Authorization": f"token {TOKEN}",
                                           "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        return {it.get("title") for it in data}
    return set()

def create_issue(title, body, labels=None):
    url = f"{API_BASE}repos/{REPO_OWNER}/{REPO_NAME}/issues"
    payload = {"title": title, "body": body}
    if labels:
        payload["labels"] = labels
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Authorization": f"token {TOKEN}",
                                                       "Accept": "application/vnd.github+json",
                                                       "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def label_for_title(title):
    t = title or ""
    labels = ["backlog"]
    if t.startswith("FND-"):
        labels.append("foundation")
    if t.startswith("MVP-"):
        labels.append("mvp")
    if t.startswith("IA-"):
        labels.append("ia")
    if t.startswith("SEC-"):
        labels.append("security")
    if t.startswith("OBS-"):
        labels.append("observability")
    if t.startswith("REL-"):
        labels.append("release")
    return labels

def main():
    md = read_md(BACKLOG_MD)
    issues = parse_issues(md)
    existing = existing_titles()
    created = []
    for title, body in issues:
        if title in existing:
            print(f"Existing: {title}, skipping.")
            continue
        labels = list(dict.fromkeys(label_for_title(title)))  # unique while preserving order
        res = create_issue(title, body, labels=labels)
        created.append((title, res.get("number")))
        print(f"Created: {title} -> #{res.get('number')}" )
    print("Done. Created:", created)

if __name__ == '__main__':
    main()
