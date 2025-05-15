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

// PlayStation API integration
async function getPlayStationPlaytime(psn) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.PLAYSTATION_API_KEY;
    
    if (!apiKey) {
      throw new Error('PLAYSTATION_API_KEY environment variable is not set');
    }

    // PlayStation Network API requires a bearer token for authentication
    // First, get the authentication token
    const authResponse = await axios.post(
      'https://ca.account.sony.com/api/authz/v3/oauth/token',
      {
        grant_type: 'authorization_code',
        client_id: apiKey
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const accessToken = authResponse.data.access_token;
    
    // Make the actual API call to PlayStation to get recently played games
    const response = await axios.get(
      `https://m.np.playstation.com/api/trophy/v1/users/${psn}/trophies/earned`,
      {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Process the response from PlayStation API
    // This structure depends on the actual PlayStation API response format
    // We estimate playtime based on trophy data since PSN doesn't have direct playtime API
    const trophyGroups = response.data.trophyGroups || [];
    const games = trophyGroups.map(game => {
      // Estimate playtime based on number of trophies earned
      // This is just an estimate since PSN doesn't provide exact playtime
      const bronzeTrophies = game.earnedTrophies?.bronze || 0;
      const silverTrophies = game.earnedTrophies?.silver || 0;
      const goldTrophies = game.earnedTrophies?.gold || 0;
      const platinumTrophies = game.earnedTrophies?.platinum || 0;
      
      // Weight different trophy types differently to estimate hours
      const estimatedHours = (
        bronzeTrophies * 0.5 + 
        silverTrophies * 2 + 
        goldTrophies * 5 + 
        platinumTrophies * 20
      );
      
      return {
        name: game.trophyTitleName || 'Unknown Game',
        playtime: Math.floor(estimatedHours) // Convert to hours
      };
    });
    
    // Filter out games with zero playtime
    const gamesWithPlaytime = games.filter(game => game.playtime > 0);
    
    // Calculate total playtime
    const totalPlaytime = gamesWithPlaytime.reduce((total, game) => total + game.playtime, 0);
    
    return {
      success: true,
      psnId: psn,
      totalPlaytime: totalPlaytime,
      games: gamesWithPlaytime
    };
  } catch (error) {
    console.error('Error fetching PlayStation data:', error);
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
    const isLimited = await isRateLimited(`playstation:${clientIp}`, tableName);
    
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

    // Get PSN ID from path parameters
    const psnId = event.pathParameters?.psnId;
    
    if (!psnId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false, 
          reason: 'Invalid PlayStation Network ID provided'
        })
      };
    }

    // Get playtime data
    const playtimeData = await getPlayStationPlaytime(psnId);
    
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