const AWS = require('aws-sdk');
const axios = require('axios');

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Rate limiter implementation
async function isRateLimited(key, tableName, windowMs = 60000, maxRequests = 10) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const ttl = Math.floor((now + windowMs * 2) / 1000); // TTL in seconds
  
  try {
    // Get existing records
    const result = await dynamoDB.query({
      TableName: tableName,
      KeyConditionExpression: 'id = :id AND ttl >= :windowStart',
      ExpressionAttributeValues: {
        ':id': key,
        ':windowStart': Math.floor(windowStart / 1000),
      },
    }).promise();

    const count = result.Items?.length || 0;

    // If count is at or above limit, deny the request
    if (count >= maxRequests) {
      return true; // Is rate limited
    }

    // Record this request
    await dynamoDB.put({
      TableName: tableName,
      Item: {
        id: key,
        ttl: ttl,
        timestamp: now,
      },
    }).promise();

    return false; // Not rate limited
  } catch (error) {
    console.error('Rate limiter error:', error);
    // If there's an error, we'll allow the request by default
    return false;
  }
}

// Steam API integration
async function getSteamPlaytime(steamId) {
  try {
    // For demo purposes - in a real implementation, you would:
    // 1. Call the Steam API using the STEAM_API_KEY environment variable
    // 2. Process and transform the response
    // 3. Handle error cases from the Steam API
    
    // Example of how you'd make a real API call:
    // const apiKey = process.env.STEAM_API_KEY;
    // const response = await axios.get(
    //   `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&format=json&include_appinfo=true`
    // );
    
    // For now, still returning mock data but logging that we would make a real call
    console.log(`Would call Steam API for user ${steamId} with key ${process.env.STEAM_API_KEY}`);
    
    return {
      success: true,
      steamId: steamId,
      totalPlaytime: 1234,
      games: [
        { name: "Counter-Strike 2", playtime: 450 },
        { name: "Dota 2", playtime: 320 },
        { name: "PUBG", playtime: 280 },
        { name: "Elden Ring", playtime: 184 }
      ]
    };
  } catch (error) {
    console.error('Error fetching Steam data:', error);
    throw error;
  }
}

// Lambda handler
exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));
  
  // Get the client IP address for rate limiting
  const clientIp = event.requestContext.identity?.sourceIp || 'unknown';
  const tableName = process.env.DYNAMODB_TABLE || 'gaming-playtime-tracker-dev';
  
  try {
    // Check rate limit
    const isLimited = await isRateLimited(`steam:${clientIp}`, tableName);
    
    if (isLimited) {
      return {
        statusCode: 429,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          reason: 'Rate limit exceeded. Please try again later.'
        })
      };
    }

    // Get steamId from path parameters
    const steamId = event.pathParameters?.steamId;
    
    if (!steamId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false, 
          reason: 'Invalid Steam ID provided'
        })
      };
    }

    // Get playtime data
    const playtimeData = await getSteamPlaytime(steamId);
    
    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(playtimeData)
    };
  } catch (error) {
    console.error('Error in Lambda handler:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        reason: 'An internal server error occurred' 
      })
    };
  }
};