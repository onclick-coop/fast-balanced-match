#!/bin/bash
set -euo pipefail

# Publishes the version jsr.json holds to JSR, which skips a version it already holds.

VERSION=$(jq -r .version package.json)
JSR_VERSION=$(jq -r .version jsr.json)

# The two manifests describe one release, so a version bumped in only one of them stops here.
if [ "$VERSION" != "$JSR_VERSION" ]; then
  echo "package.json is at $VERSION but jsr.json is at $JSR_VERSION"
  exit 1
fi

vp exec jsr publish
