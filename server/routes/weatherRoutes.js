const express = require('express');
const axios = require('axios');
const router = express.Router();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// Base URLs for OpenWeatherMap API 2.5 endpoints (CONFIRMED TO BE WORKING/ACCESSIBLE)
const OPENWEATHER_CURRENT_URL = 'https://api.openweathermap.org/data/2.5/weather';
const OPENWEATHER_FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const OPENWEATHER_AIR_POLLUTION_URL = 'http://api.openweathermap.org/data/2.5/air_pollution'; // This is generally part of developer plans


// Route to get current weather, 5-day/3-hour forecast, and current Air Quality data
router.get('/weather/:location', async (req, res) => {
  const { location } = req.params;
  const units = 'metric'; // Celsius

  if (!OPENWEATHER_API_KEY) {
    console.error('OPENWEATHER_API_KEY is not set in .env');
    return res.status(500).json({ message: 'Server configuration error: OpenWeatherMap API key missing.' });
  }

  try {
    // --- Step 1: Fetch Current Weather Data ---
    const currentWeatherApiUrl = `${OPENWEATHER_CURRENT_URL}?q=${encodeURIComponent(location)}&units=${units}&appid=${OPENWEATHER_API_KEY}`;
    const currentWeatherResponse = await axios.get(currentWeatherApiUrl);
    const currentWeatherData = currentWeatherResponse.data;

    const { lat, lon } = currentWeatherData.coord; // Get lat/lon from current weather for other calls
    const cityDisplayName = currentWeatherData.name;
    const countryDisplayName = currentWeatherData.sys.country;

    // --- Step 2: Fetch 5-day / 3-hour Forecast Data ---
    const forecastApiUrl = `${OPENWEATHER_FORECAST_URL}?q=${encodeURIComponent(location)}&units=${units}&appid=${OPENWEATHER_API_KEY}`;
    const forecastResponse = await axios.get(forecastApiUrl);
    const forecastData = forecastResponse.data;

    // --- Step 3: Fetch Current Air Pollution Data ---
    const airPollutionApiUrl = `${OPENWEATHER_AIR_POLLUTION_URL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
    const airPollutionResponse = await axios.get(airPollutionApiUrl);
    const airPollutionData = airPollutionResponse.data;


    // Structure the comprehensive response to send back to the frontend
    const extractedData = {
      city: cityDisplayName,
      country: countryDisplayName,
      latitude: lat,
      longitude: lon,

      current: {
        temperature: currentWeatherData.main.temp,
        feelsLike: currentWeatherData.main.feels_like,
        humidity: currentWeatherData.main.humidity,
        windSpeed: currentWeatherData.wind.speed,
        description: currentWeatherData.weather[0].description,
        icon: currentWeatherData.weather[0].icon,
        pressure: currentWeatherData.main.pressure,
        visibility: currentWeatherData.visibility,
        clouds: currentWeatherData.clouds.all,
      },

      forecastList: forecastData.list, // Raw 3-hourly forecast for 5 days

      // Process forecastList to get daily summaries for charts (next 5 days)
      dailySummary: (() => {
          const dailyForecasts = {};
          forecastData.list.forEach(item => {
              const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              if (!dailyForecasts[date]) {
                  dailyForecasts[date] = {
                      date: date,
                      minTemp: item.main.temp_min,
                      maxTemp: item.main.temp_max,
                      humidity: [],
                      description: item.weather[0].description,
                      icon: item.weather[0].icon
                  };
              } else {
                  dailyForecasts[date].minTemp = Math.min(dailyForecasts[date].minTemp, item.main.temp_min);
                  dailyForecasts[date].maxTemp = Math.max(dailyForecasts[date].maxTemp, item.main.temp_max);
              }
              dailyForecasts[date].humidity.push(item.main.humidity);
          });
          return Object.values(dailyForecasts).map(day => {
              const avgHumidity = day.humidity.reduce((sum, h) => sum + h, 0) / day.humidity.length;
              return {
                  date: day.date,
                  minTemp: day.minTemp,
                  maxTemp: day.maxTemp,
                  avgHumidity: parseFloat(avgHumidity.toFixed(1)),
                  description: day.description,
                  icon: day.icon
              };
          });
      })(),

      // Current Air Quality Data (AQI from 1 to 5, pollutants)
      airQuality: airPollutionData.list && airPollutionData.list.length > 0 ? airPollutionData.list[0] : null,

      // Removed: historicalHourly data due to API activation issues.
      // For comprehensive historical data, a separate endpoint with explicit plan activation is required.
    };

    res.json(extractedData);

  } catch (error) {
    console.error('Error fetching weather or air pollution data:', error.message);
    if (error.response) {
      console.error('OpenWeatherMap API Error Response:', error.response.data);
      if (error.response.status === 404) {
        return res.status(404).json({ message: 'Location not found. Please check the city name.' });
      }
      if (error.response.status === 401) {
          // This specific 401 message now means Air Pollution API also needs activation,
          // or there's an issue with your base API key.
          return res.status(401).json({ message: 'Unauthorized: OpenWeatherMap API key invalid or not activated for this endpoint/plan. Check your API key and plan on OpenWeatherMap.' });
      }
      return res.status(error.response.status).json({ message: error.response.data.message || 'Error fetching data from OpenWeatherMap.' });
    }
    res.status(500).json({ message: 'Server error fetching weather/air pollution data.' });
  }
});

module.exports = router;