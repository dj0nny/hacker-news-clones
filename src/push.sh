    
#!/bin/bash
set -x
set -e

node ./index.js

export BRANCH_NAME=updated-readme
git --version
git branch -d $BRANCH_NAME || true
git checkout -b $BRANCH_NAME
git add ../README.md
git commit --message "Auto-update README" || exit 0
git remote add origin-$BRANCH_NAME https://${GITHUB_TOKEN}@github.com/${GH_REPO}.git
git push --force --quiet --set-upstream origin-$BRANCH_NAME $BRANCH_NAME