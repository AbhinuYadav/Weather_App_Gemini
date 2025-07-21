const express = require('express');
const axios = require('axios'); // For making HTTP requests to external APIs
const router = express.Router(); // Create a new router object

// Load API key from environment variables
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
// Base URL for OpenWeatherMap's current weather API (for simplicity in MVP)
const OPENWEATHER_CURRENT_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Route to get current weather data for a given location
// This will be accessed by your frontend as e.g., /api/weather/London
router.get('/weather/:location', async (req, res) => {
  const { location } = req.params; // Get the location (city name) from the URL parameter
  const units = 'metric'; // Request temperature in Celsius. Use 'imperial' for Fahrenheit.

  if (!OPENWEATHER_API_KEY) {
    console.error('OPENWEATHER_API_KEY is not set in .env');
    return res.status(500).json({ message: 'Server configuration error: OpenWeatherMap API key missing.' });
  }

  try {
    // Construct the API URL for current weather
    const apiUrl = `${OPENWEATHER_CURRENT_URL}?q=${encodeURIComponent(location)}&units=${units}&appid=${OPENWEATHER_API_KEY}`;

    // Make the request to OpenWeatherMap API
    const response = await axios.get(apiUrl);
    const weatherData = response.data;

    // Extract relevant information for our MVP
    const extractedData = {
      city: weatherData.name,
      country: weatherData.sys.country,
      temperature: weatherData.main.temp,
      feelsLike: weatherData.main.feels_like,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      // You can add more fields as needed for the basic display
    };

    res.json(extractedData); // Send back the extracted weather data

  } catch (error) {
    console.error('Error fetching current weather data:', error.message);
    if (error.response) {
      // Log specific error from OpenWeatherMap API
      console.error('OpenWeatherMap API Error Response:', error.response.data);
      // Send a user-friendly error message back to the frontend
      if (error.response.status === 404) {
        return res.status(404).json({ message: 'Location not found. Please check the city name.' });
      }
      return res.status(error.response.status).json({ message: error.response.data.message || 'Error fetching weather data from OpenWeatherMap.' });
    }
    res.status(500).json({ message: 'Server error fetching weather data.' });
  }
});

module.exports = router; // Export the router to be used in index.js
