// client/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import { fetchWeatherData } from './services/weatherService';
import WeatherDisplay from './components/WeatherDisplay'; // For weather data and charts
import Chat from './components/Chat'; // For the AI chat
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('chatSessionId') || uuidv4());

  // Save sessionId to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatSessionId', sessionId);
  }, [sessionId]);

  const handleLocationChange = (e) => {
    setLocation(e.target.value);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!location.trim()) {
      setError('Please enter a location.');
      setWeatherData(null);
      return;
    }

    setLoading(true);
    setError(null);
    setWeatherData(null); // Clear previous data

    try {
      const data = await fetchWeatherData(location);
      setWeatherData(data);
      // When new weather data is fetched, reset the chat session to ensure new context
      // This forces the Chat component to re-mount and clear its internal messages state
      setSessionId(uuidv4());
      console.log("New chat session ID generated:", sessionId);
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data.');
      console.error('Error fetching weather:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Weather & AI Assistant</h1>
      </header>
      <main>
        <form onSubmit={handleSearch} className="location-input-form">
          <input
            type="text"
            value={location}
            onChange={handleLocationChange}
            placeholder="Enter city name (e.g., London, Zirakpur)"
            className="location-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Get Weather'}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        {/* Conditionally render content only if weatherData exists */}
        {weatherData ? (
          <div className="content-container">
            <div className="left-panel">
              {/* WeatherDisplay shows current weather and forecast charts */}
              <WeatherDisplay weather={weatherData} />
            </div>
            <div className="right-panel">
              {/* Chat component uses the fetched weather data as context */}
              {/* Key prop ensures Chat component resets when sessionId changes (new location searched) */}
              <Chat sessionId={sessionId} weatherContext={weatherData} key={sessionId} />
            </div>
          </div>
        ) : (
          // Display an initial message when no weather data is loaded yet
          !loading && !error && (
            <p className="initial-message">Enter a city above to get weather details and start chatting with the AI assistant!</p>
          )
        )}
      </main>
    </div>
  );
}

export default App;