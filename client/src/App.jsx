import React, { useState, useEffect } from 'react';
import MoodTracker from './components/MoodTracker';

function App() {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check server connection
    const checkConnection = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/health`);
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-xl text-purple-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">&#x26A0;&#xFE0F;</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Server Offline</h1>
          <p className="text-gray-600">
            Cannot connect to the mood tracker server. Please ensure the server is running.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return <MoodTracker />;
}

export default App;
