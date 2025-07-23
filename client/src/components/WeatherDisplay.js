// client/src/components/WeatherDisplay.js
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line
} from 'recharts';
// Removed: import Chat from './Chat'; // Chat component is now rendered directly in App.js

// Helper to get AQI status text
const getAqiStatusText = (aqi) => {
  if (aqi === 1) return "Good";
  if (aqi === 2) return "Fair";
  if (aqi === 3) return "Moderate";
  if (aqi === 4) return "Poor";
  if (aqi === 5) return "Very Poor";
  return "N/A";
};

// Helper function to capitalize the first letter of each word
const capitalizeWords = (str) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

const WeatherDisplay = ({ weather }) => { // sessionId prop is no longer needed here
  if (!weather) {
    return <p>Enter a location to see weather details.</p>;
  }

  const { city, country, current, dailySummary, airQuality } = weather;

  const OPENWEATHER_ICON_URL = "https://openweathermap.org/img/wn/";

  // Prepare data for charts
  const chartData = dailySummary.map(day => ({
    name: day.date.substring(0, 6), // e.g., "Wed, J" or "Jul 23"
    "Min Temp (°C)": day.minTemp,
    "Max Temp (°C)": day.maxTemp,
    "Avg Humidity (%)": day.avgHumidity,
  }));

  return (
    <div className="weather-display-container">
      <h2 className="city-name">{city}, {country}</h2>

      {/* Current Weather Section */}
      <section className="current-weather">
        <h3>Current Weather</h3>
        <div className="current-weather-details">
          <img
            src={`${OPENWEATHER_ICON_URL}${current.icon}@2x.png`}
            alt={current.description}
            className="weather-icon"
          />
          <p className="temperature">{current.temperature.toFixed(1)}°C</p>
          <p className="description">{capitalizeWords(current.description)}</p>
          <p>Feels like: {current.feelsLike.toFixed(1)}°C</p>
          <p>Humidity: {current.humidity}%</p>
          <p>Wind Speed: {current.windSpeed.toFixed(1)} m/s</p>
          {airQuality && airQuality.main && (
            <p>Air Quality Index (AQI): {airQuality.main.aqi} ({getAqiStatusText(airQuality.main.aqi)})</p>
          )}
        </div>
      </section>

      {/* Daily Forecast Summary Section */}
      {dailySummary && dailySummary.length > 0 && (
        <section className="daily-forecast">
          <h3>5-Day Forecast</h3>
          <div className="forecast-grid">
            {dailySummary.map((day, index) => (
              <div key={index} className="forecast-card">
                <p className="forecast-date">{day.date}</p>
                <img
                  src={`${OPENWEATHER_ICON_URL}${day.icon}@2x.png`}
                  alt={day.description}
                  className="weather-icon-small"
                />
                <p>Min: {day.minTemp.toFixed(1)}°C</p>
                <p>Max: {day.maxTemp.toFixed(1)}°C</p>
                <p>Humidity: {day.avgHumidity.toFixed(1)}%</p>
                <p className="forecast-description">{capitalizeWords(day.description)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Charts Section */}
      {dailySummary && dailySummary.length > 0 && (
        <section className="weather-charts">
          <h3>Forecast Analytics</h3>

          <h4>Temperature (°C)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Min Temp (°C)" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="Max Temp (°C)" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>

          <h4 style={{ marginTop: '30px' }}>Average Humidity (%)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Humidity (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Avg Humidity (%)" stroke="#ffc658" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Chat component is now rendered directly in App.js, not here */}
    </div>
  );
};

export default WeatherDisplay;