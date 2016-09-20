#!/bin/bash
# 
# This is run after make deploy has successfully run unit tests.
# 
# Tags the current branch with the release build number and updates the version
# build in package.json to match, then finally pushes the currently staged,
# including local tags.
# 
# Shortly thereafter, servers should be running the latest release.
# 

cd "`dirname "$0"`"

[[ "$(git status|grep 'Your branch is ahead of')" = "" ]] &&
    echo "*** There are no committed changes to deploy." &&
    exit 1

# git status | grep 'modified:.\+package.json' > /dev/null 2>&1 &&
#     echo "*** package.json has uncommitted modifications, cannot continue." &&
#     exit 1

# Get the current release number. Will be blank when untagged, which is okay as
# $(('' + 1)) => 1 in bash.
CUR_RELEASE=$(git tag | grep 'release-' | sed 's:release-::' | sort -n | tail -n 1)
CUR_RELEASE=$((CUR_RELEASE + 0))
NEW_RELEASE=$((CUR_RELEASE + 1))

echo
echo "--- Going from release build $CUR_RELEASE to $NEW_RELEASE, tagging ..."
echo

git tag release-$NEW_RELEASE
gsed -Ei 's/("version".+\-).+$/\1'$NEW_RELEASE'",/' package.json

[[ $? != 0 ]] &&
    echo "*** Failed to tag package.json" &&
    exit 1

echo
echo "--- Committing the tagged package.json ..."
echo

git add package.json
git commit -m "Deploy release build $NEW_RELEASE"

echo "--- Deploying changes ..."
git push && git push --tags

[[ $? != 0 ]] &&
    echo &&
    echo "*** Push failed, deployment was unsuccessful." &&
    exit 1

echo "--- Pushed all changes, servers will fetch the new release shortly."
