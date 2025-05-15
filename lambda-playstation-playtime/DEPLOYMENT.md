# PlayStation Playtime Lambda Function Deployment Guide

This guide explains how to deploy the PlayStation Lambda function with actual PlayStation API integration.

## Prerequisites
- AWS CLI installed and configured with appropriate permissions
- Node.js and npm installed
- Access to AWS Lambda and API Gateway services
- PlayStation API key (register at [PlayStation Developer Portal](https://developer.playstation.com/))

## Deployment Steps

1. Install dependencies:
   ```
   npm install
   ```

2. Create a .env file with your PlayStation API key:
   ```
   PLAYSTATION_API_KEY=your_playstation_api_key_here
   ```

3. Update the PLAYSTATION_API_KEY environment variable in your Lambda function:
   ```
   aws lambda update-function-configuration \
     --function-name gaming-playtime-tracker-playstationPlaytime \
     --environment "Variables={PLAYSTATION_API_KEY=your_playstation_api_key_here,DYNAMODB_TABLE=gaming-playtime-tracker-dev}"
   ```

4. Package the Lambda function:
   ```
   zip -r lambda-function.zip index.js node_modules package.json
   ```

5. Create the Lambda function if it doesn't exist:
   ```
   aws lambda create-function \
     --function-name gaming-playtime-tracker-playstationPlaytime \
     --runtime nodejs18.x \
     --role arn:aws:iam::your-account-id:role/lambda-execution-role \
     --handler index.handler \
     --zip-file fileb://lambda-function.zip \
     --environment "Variables={PLAYSTATION_API_KEY=your_playstation_api_key_here,DYNAMODB_TABLE=gaming-playtime-tracker-dev}" \
     --timeout 30 \
     --memory-size 256
   ```

   Or update an existing function:
   ```
   aws lambda update-function-code \
     --function-name gaming-playtime-tracker-playstationPlaytime \
     --zip-file fileb://lambda-function.zip
   ```

6. Create API Gateway endpoint (if not already created):
   ```
   aws apigateway create-resource \
     --rest-api-id your-api-id \
     --parent-id your-parent-resource-id \
     --path-part playstation
   
   aws apigateway create-resource \
     --rest-api-id your-api-id \
     --parent-id playstation-resource-id \
     --path-part playtime
   
   aws apigateway create-resource \
     --rest-api-id your-api-id \
     --parent-id playtime-resource-id \
     --path-part "{psnId}"
   
   aws apigateway put-method \
     --rest-api-id your-api-id \
     --resource-id psnid-resource-id \
     --http-method GET \
     --authorization-type NONE
   
   aws apigateway put-integration \
     --rest-api-id your-api-id \
     --resource-id psnid-resource-id \
     --http-method GET \
     --type AWS_PROXY \
     --integration-http-method POST \
     --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:your-account-id:function:gaming-playtime-tracker-playstationPlaytime/invocations
   ```

7. Deploy the API:
   ```
   aws apigateway create-deployment \
     --rest-api-id your-api-id \
     --stage-name dev
   ```

8. Test the function:
   ```
   aws lambda invoke \
     --function-name gaming-playtime-tracker-playstationPlaytime \
     --payload '{"pathParameters": {"psnId": "your_test_psn_id"}, "requestContext": {"identity": {"sourceIp": "127.0.0.1"}}}' \
     output.json
   ```

9. Check the output file (`output.json`) to verify the function is working correctly.

## Notes on PlayStation API

The PlayStation API is more complex than some other gaming APIs:

1. It requires OAuth 2.0 authentication
2. There's no direct playtime API, so we estimate playtime based on trophy data
3. Our implementation calculates estimated hours based on trophy weights:
   - Bronze: 0.5 hours per trophy
   - Silver: 2 hours per trophy
   - Gold: 5 hours per trophy
   - Platinum: 20 hours per trophy

This is an approximation since PlayStation doesn't provide direct playtime metrics.

## Troubleshooting

1. If you see authentication errors, verify your PlayStation API key and make sure it has the necessary permissions.

2. If you encounter rate limiting issues, you may need to adjust the rate limiter parameters in the code.

3. For any AWS deployment issues, check the CloudWatch logs for the Lambda function. 