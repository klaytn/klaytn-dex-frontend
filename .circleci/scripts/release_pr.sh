#!/bin/bash
set -x

curl -sSLf https://github.com/github/hub/releases/download/v2.12.3/hub-linux-amd64-2.12.3.tgz | \
  tar zxf - --strip-components=1 -C /tmp && \
  sudo mv /tmp/bin/hub /usr/local/bin/hub
type hub

VERSION=$(hub pr list -s open -L 10 -f "%H%n")

echo $VERSION
if [[ $VERSION == *"release/${CIRCLE_TAG%-*}"* ]]; then
  echo "PR already exist"
else
  echo "hub pull-request -m "[Master] release/$CIRCLE_TAG QA Signoff" -b $CIRCLE_PROJECT_USERNAME:master -h $CIRCLE_PROJECT_USERNAME:${CIRCLE_TAG%-*}"
  echo -e "[Master] release/${CIRCLE_TAG%-*} QA Sign-off\n\nThis PR is automatically created by CI to release a new official version of $CIRCLE_PROJECT_REPONAME.\n\nWhen this PR is approved by QA team, a new version will be released." | hub pull-request -b $CIRCLE_PROJECT_USERNAME:master -h $CIRCLE_PROJECT_USERNAME:release/${CIRCLE_TAG%-*} -r $GITHUB_reviewer -l circleci -F-
fi
