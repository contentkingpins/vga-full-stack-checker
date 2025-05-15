const AWS = require('aws-sdk');
const axios = require('axios');

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Rate limiter implementation
async function isRateLimited(key, tableName, windowMs = 60000, maxRequests = 10) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const ttlValue = Math.floor((now + windowMs * 2) / 1000); // TTL in seconds
  
  try {
    // Get existing records
    const result = await dynamoDB.query({
      TableName: tableName,
      KeyConditionExpression: 'id = :id AND #timestamp >= :windowStart',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'  // Using timestamp instead of ttl for the time comparison
      },
      ExpressionAttributeValues: {
        ':id': key,
        ':windowStart': Math.floor(windowStart),
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
        ttl: ttlValue,
        timestamp: Math.floor(now),
      },
    }).promise();

    return false; // Not rate limited
  } catch (error) {
    console.error('Rate limiter error:', error);
    // If there's an error, we'll allow the request by default
    return false;
  }
}

// Xbox API integration
async function getXboxPlaytime(xboxId) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.XBOX_API_KEY;
    
    if (!apiKey) {
      throw new Error('XBOX_API_KEY environment variable is not set');
    }
    
    // Make the actual API call to Xbox
    const response = await axios.get(
      `https://xboxapi.com/v2/${xboxId}/gamesplayed`,
      {
        headers: { 'X-AUTH': apiKey }
      }
    );
    
    // Process the response from Xbox API
    // This structure depends on the actual Xbox API response format
    // Adjust this according to the actual API documentation
    const games = response.data.map(game => ({
      name: game.title,
      playtime: Math.floor(game.minutes_played || 0)
    }));
    
    // Calculate total playtime
    const totalPlaytime = games.reduce((total, game) => total + game.playtime, 0);
    
    return {
      success: true,
      xboxId: xboxId,
      totalPlaytime: totalPlaytime,
      games: games
    };
  } catch (error) {
    console.error('Error fetching Xbox data:', error);
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
    const isLimited = await isRateLimited(`xbox:${clientIp}`, tableName);
    
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

    // Get xboxId from path parameters
    const xboxId = event.pathParameters?.xboxId;
    
    if (!xboxId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false, 
          reason: 'Invalid Xbox ID provided'
        })
      };
    }

    // Get playtime data
    const playtimeData = await getXboxPlaytime(xboxId);
    
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