# AWS Deployment Instructions

This document outlines the steps required to deploy the Gaming Playtime Tracker application to AWS using the Serverless Framework.

## Prerequisites

- Node.js 18.x or later
- AWS CLI installed and configured with appropriate credentials
- Serverless Framework installed (`npm install -g serverless`)
- API keys for all gaming platforms:
  - Steam API Key
  - Riot Games API Key
  - Xbox Live Client ID and Secret
  - PlayStation Network API Key
  - Epic Games Client ID and Secret
  - Nintendo Client ID and Secret

## Deployment Steps

### 1. Install dependencies

```bash
cd gaming-playtime-tracker
npm install
```

### 2. Set up AWS Parameter Store entries for API keys

You can set up the required Parameter Store entries using the provided script:

```bash
# Make the script executable
chmod +x setup-aws-resources.sh

# Edit the script to replace placeholder API keys with your actual keys
nano setup-aws-resources.sh

# Run the script
./setup-aws-resources.sh
```

Alternatively, you can manually create the Parameter Store entries using the AWS Management Console:

1. Navigate to AWS Systems Manager > Parameter Store
2. Create the following SecureString parameters:
   - `/gaming-playtime/steam-api-key`
   - `/gaming-playtime/riot-api-key`
   - `/gaming-playtime/xbox-client-id`
   - `/gaming-playtime/xbox-client-secret`
   - `/gaming-playtime/playstation-api-key`
   - `/gaming-playtime/epic-client-id`
   - `/gaming-playtime/epic-client-secret`
   - `/gaming-playtime/nintendo-client-id`
   - `/gaming-playtime/nintendo-client-secret`

### 3. Deploy the application using Serverless Framework

```bash
# Deploy to the dev stage (default)
serverless deploy

# Or deploy to a specific stage
serverless deploy --stage production
```

This will deploy the following AWS resources:

- API Gateway: Exposes the Next.js API routes as Lambda functions
- Lambda Functions: Handles API requests with optimized cold start times
- DynamoDB Tables:
  - `gaming-playtime-tracker-{stage}-cache`: For persistent caching
  - `gaming-playtime-tracker-{stage}-rate-limits`: For rate limiting
- IAM Roles: With required permissions for Lambda and DynamoDB

### 4. Set up CloudWatch Alarms (Optional)

You can set up CloudWatch Alarms to monitor your application:

1. Navigate to CloudWatch in the AWS Management Console
2. Create alarms for:
   - Lambda Error Rate
   - API Gateway 4xx and 5xx Errors
   - DynamoDB Throttling
   - Lambda Duration (to monitor cold starts)

Example CloudWatch alarm for Lambda errors:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "gaming-playtime-tracker-lambda-errors" \
  --alarm-description "Alarm when Lambda function errors exceed threshold" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 60 \
  --threshold 5 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --dimensions Name=FunctionName,Value=gaming-playtime-tracker-dev-api \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:notify-me \
  --region us-east-1
```

### 5. Verify Deployment

Once deployed, you can verify that the application is running:

1. Check the CloudFormation stack in the AWS Management Console
2. Test the API endpoints using the provided URL from the Serverless Framework output
3. Monitor the application using CloudWatch Logs and Metrics

## Troubleshooting

### Common Issues

1. **Missing API Keys**: Ensure all API keys are properly set in Parameter Store
2. **Insufficient IAM Permissions**: Make sure your AWS user has sufficient permissions
3. **Cold Start Performance**: Consider provisioned concurrency for production workloads
4. **DynamoDB Capacity**: Monitor DynamoDB usage and adjust capacity if needed

### Logs and Monitoring

- CloudWatch Logs: Check Lambda function logs for errors
- CloudWatch Metrics: Monitor API Gateway, Lambda, and DynamoDB metrics
- X-Ray Tracing: Enable X-Ray tracing for performance debugging

## Clean Up

To remove all deployed resources:

```bash
serverless remove
```

Note: This will delete all resources created by the Serverless Framework, including DynamoDB tables and their data. 