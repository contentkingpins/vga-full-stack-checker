import React, { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [platform, setPlatform] = useState('steam');
  const [userIdentifier, setUserIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userIdentifier) {
      setError('Please enter a valid user identifier');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/${platform}/playtime/${userIdentifier}`);
      const data = await response.json();
      
      if (!data.success) {
        setError(data.reason || 'Failed to fetch game data');
        setGameData(null);
      } else {
        setGameData(data);
        setError('');
      }
    } catch (err) {
      setError('An error occurred while fetching game data');
      setGameData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Gaming Playtime Tracker</title>
        <meta name="description" content="Track your gaming playtime across multiple platforms" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Gaming Playtime Tracker
        </h1>
        
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="steam">Steam</option>
                <option value="riot">Riot Games</option>
                <option value="xbox">Xbox Live</option>
                <option value="playstation">PlayStation</option>
                <option value="epic">Epic Games</option>
                <option value="nintendo">Nintendo</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                User Identifier
              </label>
              <input
                type="text"
                value={userIdentifier}
                onChange={(e) => setUserIdentifier(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your ID/username"
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? 'Loading...' : 'Track Playtime'}
            </button>
          </form>
        </div>
        
        {gameData && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Your Games</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Game cards would be rendered here */}
              <p className="text-gray-700">Game data loaded successfully.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 