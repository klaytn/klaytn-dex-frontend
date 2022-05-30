#!/bin/bash
set -x

VERSION=v$(awk '/"version/ {gsub("\"",""); print $2}' package.json | tr -d ',')

echo "Tagging major $VERSION"
git config --global user.email "team.devops@groundx.xyz"
git config --global user.name "circleci-gx"
git tag -a $VERSION -m "$CIRCLE_STAGE"
git push origin $VERSION


#delete release branch. it trigger by merge title
if [[ "release/v" = $(git log --oneline -1 | grep -o "release/v") ]]; then
  echo "Delete branch release/$VERSION"
  git push origin --delete release/$VERSION
else
  echo "Need to delete branch manually"
fi  
