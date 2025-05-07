# Gaming Playtime Tracker

A full-stack web application that allows gamers to track their playtime across multiple gaming platforms in one place.

## Features

- **Multi-platform Integration**: Track gaming time across multiple platforms:
  - Steam
  - Riot Games (League of Legends, Valorant)
  - Xbox Live
  - PlayStation Network
  - Epic Games
  - Nintendo

- **Simple Interface**: Enter your gaming identifiers (Steam ID, Riot PUUID, Xbox Gamertag, etc.) and instantly see your playtime across all platforms.

- **Serverless Architecture**: Built on AWS serverless infrastructure for high availability and scalability.

- **Responsive Design**: Mobile-friendly interface that works well on all devices.

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Node.js, Serverless Framework
- **Infrastructure**: AWS Amplify, Lambda, API Gateway, DynamoDB

## Development Setup

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- AWS CLI installed and configured (for deployment only)

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## AWS Infrastructure

This project is optimized for AWS deployment with the following components:

- **API Gateway**: Exposes the Next.js API routes as Lambda functions
- **Lambda Functions**: Handles API requests with optimized cold start times
- **DynamoDB**: Used for persistent caching and rate limiting in production
- **CloudWatch**: Monitoring and logging for all AWS resources
- **Parameter Store**: Securely stores API keys for the various gaming platforms

For detailed deployment instructions, see the [AWS Deployment Instructions](./docs/aws-deployment.md).

## Environment Variables

The following environment variables are required:

- `STEAM_API_KEY`: API key for Steam Web API
- `RIOT_API_KEY`: API key for Riot Games API
- `XBOX_CLIENT_ID`: Client ID for Xbox Live API
- `XBOX_CLIENT_SECRET`: Client Secret for Xbox Live API
- `PLAYSTATION_API_KEY`: API key for PlayStation Network
- `EPIC_CLIENT_ID`: Client ID for Epic Games API
- `EPIC_CLIENT_SECRET`: Client Secret for Epic Games API
- `NINTENDO_CLIENT_ID`: Client ID for Nintendo API
- `NINTENDO_CLIENT_SECRET`: Client Secret for Nintendo API

In production, these are stored in AWS Parameter Store and accessed via the serverless.yml configuration.

## Testing

Run unit tests:
```bash
npm test
```

Run end-to-end tests:
```bash
npm run test:e2e
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 