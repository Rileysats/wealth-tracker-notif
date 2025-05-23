#!/bin/bash
set -e

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the project root (parent of scripts/)
cd "$SCRIPT_DIR/.."

zip -r wealth-tracker.zip src .env node_modules package.json package-lock.json

# Configuration
STACK_NAME="wealth-tracker-stack"
# FUNCTION_NAME="wealthTracker"
# S3_BUCKET="your-s3-bucket-name"  # Change this to your existing S3 bucket
# ZIP_FILE="lambda.zip"
# S3_KEY="lambda/$ZIP_FILE"

# # Step 1: Zip your Lambda code
# echo "Zipping Lambda function..."
# cd lambda


# zip -r ../$ZIP_FILE . > /dev/null
# cd ..

# # Step 2: Upload to S3
# echo "Uploading $ZIP_FILE to s3://$S3_BUCKET/$S3_KEY ..."
# aws s3 cp $ZIP_FILE s3://$S3_BUCKET/$S3_KEY

source .env

echo "export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID"
echo "export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY"
echo "export AWS_DEFAULT_REGION=$AWS_REGION"


# # Step 3: Deploy the CloudFormation stack
# echo "Deploying CloudFormation stack..."
# aws cloudformation deploy \
#   --stack-name $STACK_NAME \
#   --template-file ../infrastructure/stack.yaml \
#   --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \

# # Step 4: Clean up
# rm $ZIP_FILE

# echo "✅ Deployment complete."
