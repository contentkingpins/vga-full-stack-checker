# Xbox Playtime Lambda Function Deployment Guide

This guide explains how to deploy the updated Xbox Lambda function with actual Xbox API integration.

## Prerequisites
- AWS CLI installed and configured with appropriate permissions
- Node.js and npm installed
- Access to AWS Lambda and API Gateway services
- Xbox API key

## Deployment Steps

1. Install dependencies:
   ```
   npm install
   ```

2. Create a .env file with your Xbox API key:
   ```
   XBOX_API_KEY=your_xbox_api_key_here
   ```

3. Update the XBOX_API_KEY environment variable in your Lambda function:
   ```
   aws lambda update-function-configuration \
     --function-name gaming-playtime-tracker-xboxPlaytime \
     --environment "Variables={XBOX_API_KEY=your_xbox_api_key_here,DYNAMODB_TABLE=gaming-playtime-tracker-dev}"
   ```

4. Package the Lambda function:
   ```
   zip -r lambda-function.zip index.js node_modules package.json
   ```

5. Deploy the updated function:
   ```
   aws lambda update-function-code \
     --function-name gaming-playtime-tracker-xboxPlaytime \
     --zip-file fileb://lambda-function.zip
   ```

6. Test the function:
   ```
   aws lambda invoke \
     --function-name gaming-playtime-tracker-xboxPlaytime \
     --payload '{"pathParameters": {"xboxId": "your_test_xbox_id"}, "requestContext": {"identity": {"sourceIp": "127.0.0.1"}}}' \
     output.json
   ```

7. Check the output file (`output.json`) to verify the function is working correctly.

## Troubleshooting

1. If you see an error about missing environment variables, make sure to set the XBOX_API_KEY as described in step 3.

2. If you encounter rate limiting or access issues with the Xbox API, verify your API key is valid and has the necessary permissions.

3. For any AWS deployment issues, check the CloudWatch logs for the Lambda function. 