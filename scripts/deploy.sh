#!/bin/bash
set -e

# Change to the project root (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

zip -r wealth-tracker.zip src .env node_modules package.json package-lock.json

# Configuration
STACK_NAME="wealth-tracker-stack"

# Export AWS credentials
source .env

export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION=$AWS_REGION
