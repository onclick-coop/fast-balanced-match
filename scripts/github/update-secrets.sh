#!/bin/bash
set -euo pipefail

# Source the .env sitting next to this script, regardless of the caller's cwd.
source "$(dirname "$0")/.env"

# npm trusts the release workflow only once the package exists, so its first publish needs this token, deleted once trusted publishing takes over.
gh secret set NPM_TOKEN <<< "$NPM_TOKEN"

echo "Done!"
