import axios from 'axios';
import { cache } from '../cache';

// Type definitions
export interface PlayStationGame {
  id: string;
  name: string;
  hoursPlayed: number;
  coverArt: string;
  platform: string;
}

export interface PlayStationResponse {
  success: boolean;
  supported: boolean;
  games?: PlayStationGame[];
  reason?: string;
}

/**
 * Fetch playtime data from PlayStation Network API
 * @param psnId - PlayStation Network ID of the user
 * @returns PlayStationResponse object with games and playtime data
 */
export async function getPlayStationPlaytime(psnId: string): Promise<PlayStationResponse> {
  // Check cache first
  const cacheKey = `playstation:${psnId}`;
  const cachedData = await cache.get<PlayStationResponse>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Get API key from environment variable
    const apiKey = process.env.PLAYSTATION_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        supported: true,
        reason: 'PlayStation Network API key is not configured'
      };
    }
    
    // PlayStation Network API requires OAuth 2.0 authentication
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
    
    if (!accessToken) {
      return {
        success: false,
        supported: true,
        reason: 'Failed to authenticate with PlayStation Network'
      };
    }
    
    // Get trophy data to estimate playtime
    const trophyResponse = await axios.get(
      `https://m.np.playstation.com/api/trophy/v1/users/${psnId}/trophies/earned`,
      {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Process trophy data
    const trophyGroups = trophyResponse.data.trophyGroups || [];
    const games: PlayStationGame[] = [];
    
    // Convert trophy data to estimated playtime
    for (const group of trophyGroups) {
      // Get game details including cover art if available
      let coverArt = '';
      try {
        const gameDetailsResponse = await axios.get(
          `https://m.np.playstation.com/api/trophy/v1/npCommunicationIds/${group.npCommunicationId}/trophyTitles`,
          {
            headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        coverArt = gameDetailsResponse.data.trophyTitleDetail?.trophyTitleIconUrl || '';
      } catch (error) {
        console.error(`Error fetching game details for ${group.trophyTitleName}:`, error);
      }
      
      // Calculate estimated playtime based on trophies
      const bronzeTrophies = group.earnedTrophies?.bronze || 0;
      const silverTrophies = group.earnedTrophies?.silver || 0;
      const goldTrophies = group.earnedTrophies?.gold || 0;
      const platinumTrophies = group.earnedTrophies?.platinum || 0;
      
      // Weight different trophy types differently to estimate hours
      const estimatedHours = (
        bronzeTrophies * 0.5 + 
        silverTrophies * 2 + 
        goldTrophies * 5 + 
        platinumTrophies * 20
      );
      
      // Only add games with trophies
      if (bronzeTrophies + silverTrophies + goldTrophies + platinumTrophies > 0) {
        games.push({
          id: group.npCommunicationId || `psn-${games.length}`,
          name: group.trophyTitleName || 'Unknown Game',
          hoursPlayed: parseFloat(estimatedHours.toFixed(1)),
          coverArt: coverArt,
          platform: 'playstation'
        });
      }
    }
    
    const result: PlayStationResponse = {
      success: true,
      supported: true,
      games: games
    };
    
    // Cache the result
    await cache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error fetching PlayStation Network data:', error);
    return {
      success: false,
      supported: true,
      reason: 'Failed to fetch PlayStation Network data'
    };
  }
} 