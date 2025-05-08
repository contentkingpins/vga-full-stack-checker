import axios from 'axios';
import { cache } from '../cache';

// Type definitions
export interface RobloxGame {
  id: string;
  name: string;
  hoursPlayed: number;
  coverArt: string;
  platform: string;
}

export interface RobloxResponse {
  success: boolean;
  supported: boolean;
  games?: RobloxGame[];
  reason?: string;
}

/**
 * Fetch playtime data from Roblox API
 * @param robloxId - Roblox ID of the user
 * @returns RobloxResponse object with games and playtime data
 */
export async function getRobloxPlaytime(robloxId: string): Promise<RobloxResponse> {
  // Check cache first
  const cacheKey = `roblox:${robloxId}`;
  const cachedData = await cache.get<RobloxResponse>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Get API credentials from environment variables
    const apiKey = process.env.ROBLOX_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        supported: true,
        reason: 'Roblox API key is not configured'
      };
    }
    
    // This would be the actual API call in a real implementation
    // const response = await axios.get(`https://apis.roblox.com/user-playtime/v1/users/${robloxId}/games`, {
    //   headers: {
    //     'x-api-key': apiKey
    //   }
    // });
    
    // Mock data for demonstration
    const mockGames: RobloxGame[] = [
      {
        id: '606849621',
        name: 'Jailbreak',
        hoursPlayed: 42.5,
        coverArt: 'https://tr.rbxcdn.com/e4c146bf2d5fc98ab86f2cdfb7875e8b/768/432/Image/Png',
        platform: 'roblox'
      },
      {
        id: '1962086868',
        name: 'Tower of Hell',
        hoursPlayed: 15.3,
        coverArt: 'https://tr.rbxcdn.com/65e97fac4c23ef39ab98bcc623b9e10a/768/432/Image/Png',
        platform: 'roblox'
      }
    ];
    
    const result: RobloxResponse = {
      success: true,
      supported: true,
      games: mockGames
    };
    
    // Cache the result
    await cache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error fetching Roblox data:', error);
    return {
      success: false,
      supported: true,
      reason: 'Failed to fetch Roblox data'
    };
  }
} 