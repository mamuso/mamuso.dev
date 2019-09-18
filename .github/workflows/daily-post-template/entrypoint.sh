#!/bin/sh

# Variables
POST_DATE=$(date -d +%Y-%m-%d)
POST_BRANCH_NAME="post-$POST_DATE"
POST_FILE="src/pages/$POST_DATE/index.md"
PULLS_URI="https://api.github.com/repos/$GITHUB_REPOSITORY/pulls"
API_HEADER="Accept: application/vnd.github.shadow-cat-preview"
AUTH_HEADER="Authorization: token $GITHUB_TOKEN"
PULL_REQUEST_TITLE="Share something on $POST_DATE"

# Create POST notes
echo "Create POST frontmatter"
cat <<-EOM > "$POST_FILE"
---
title: 
path: /$POST_DATE
category: 
date: $POST_DATE
image: 
---
EOM
echo "Created POST index in $POST_BRANCH_NAME" 

# Commit and push to POST_date branch
echo "Commit and push POST notes…"
cd "$GITHUB_WORKSPACE" || exit 1
git config user.name "$GITHUB_ACTOR"
git config user.email "$GITHUB_ACTOR@users.noreply.github.com"
git checkout -b "$POST_BRANCH_NAME"
git add .
git commit -m "Adds POST scaffold for $POST_DATE"
git push --force --set-upstream origin "$POST_BRANCH_NAME"
echo "Pushed scaffold to $POST_BRANCH_NAME" 

# Create pull request
echo "Open pull request…"
curl -o /dev/null --data "{\"title\": \"$PULL_REQUEST_TITLE\", \"head\": \"refs/heads/$POST_BRANCH_NAME\", \"draft\": true, \"base\": \"master\"}" -X POST -s -H "$AUTH_HEADER" -H "$API_HEADER" "$PULLS_URI"
echo "Opened pull request"