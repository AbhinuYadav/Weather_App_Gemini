const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios'); // axios is needed for general HTTP client features, and for error.response check


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❗ GEMINI_API_KEY is not set in .env — chat feature will fail.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Confirmed working model

// Simple in-memory chat sessions store
const activeChatSessions = new Map();

router.post('/chat', async (req, res) => {
  const { sessionId, message, weatherContext } = req.body;

  console.log('--- Chat Request Debug ---'); // DEBUG LOG START
  console.log('Backend received chat request:');
  console.log('  Session ID:', sessionId);
  console.log('  User Message:', message);
  console.log('  Weather Context Received Status:', weatherContext ? 'Received' : 'Not received'); // DEBUG LOG 2
  console.log('  Raw Weather Context Object:', JSON.stringify(weatherContext, null, 2)); // DEBUG LOG 3: Dump the whole context object


  if (!sessionId || !message) {
    return res.status(400).json({ message: '❗ sessionId and message are required.' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ message: 'Server config error: Gemini API key missing.' });
  }

  try {
    let chat = activeChatSessions.get(sessionId);

    if (!chat) {
      console.log(`🟢 New chat session started: ${sessionId}`);
      chat = model.startChat({
        history: []
      });
      activeChatSessions.set(sessionId, chat);
    }

    // Build prompt with weather context
    let fullPrompt = message;
    // Check if weatherContext is an object and has a 'current' property before using its data
    if (weatherContext && typeof weatherContext === 'object' && weatherContext.current) { 
      const city = weatherContext.city || 'N/A';
      const country = weatherContext.country || 'N/A';
      
      // Use optional chaining for nested properties and default to 'N/A' or appropriate value
      const currentTemp = weatherContext.current.temperature !== undefined ? `${Math.round(weatherContext.current.temperature)}°C` : 'N/A';
      const feelsLike = weatherContext.current.feelsLike !== undefined ? `${Math.round(weatherContext.current.feelsLike)}°C` : 'N/A';
      const humidity = weatherContext.current.humidity !== undefined ? `${weatherContext.current.humidity}%` : 'N/A';
      const windSpeed = weatherContext.current.windSpeed !== undefined ? `${weatherContext.current.windSpeed} m/s` : 'N/A';
      const description = weatherContext.current.description || 'N/A';
      
      // Safely access AQI data
      const aqi = weatherContext.airQuality && weatherContext.airQuality.main && weatherContext.airQuality.main.aqi !== undefined 
                  ? `AQI: ${weatherContext.airQuality.main.aqi} (${getAqiStatusText(weatherContext.airQuality.main.aqi)})` 
                  : 'N/A AQI';

      let dailyForecastSummary = '';
      if (weatherContext.dailySummary && weatherContext.dailySummary.length > 0) {
          dailyForecastSummary = weatherContext.dailySummary.map(day => 
              `- ${day.date}: ${Math.round(day.minTemp)}°C (Min) - ${Math.round(day.maxTemp)}°C (Max), Avg Humidity: ${day.avgHumidity}%, Condition: ${day.description}`
          ).join('\n');
      } else {
          dailyForecastSummary = 'No 5-day forecast summary available.';
      }

      // --- REVISED PROMPT ENGINEERING (Discreet Context Usage) ---
      fullPrompt = `You are a helpful AI assistant specialized in weather.
You have been provided with comprehensive, up-to-date weather data for ${city}, ${country}.
**Crucially, do NOT repeat or explicitly summarize the raw weather statistics unless the user directly asks for specific numbers or details.** Instead, use this information internally to provide context-aware, natural language answers.
Focus on providing helpful recommendations or insights *based on* the weather, rather than listing the stats.

--- CONTEXTUAL WEATHER DATA ---
Current weather details for ${city}, ${country}:
- Temperature: ${currentTemp} (feels like ${feelsLike})
- Humidity: ${humidity}
- Wind Speed: ${windSpeed}
- Description: ${description}
- Air Quality Index (AQI): ${aqi}

5-day forecast summary for ${city}, ${country}:
${dailyForecastSummary}
--- END CONTEXT ---

User's question: ${message}`;
    } else {
        console.warn('Weather context is incomplete or missing. Sending basic prompt.'); // This warning will appear if context is missing
    }

    console.log("📤 Sending prompt to Gemini:\n", fullPrompt); // DEBUG LOG 4: Show the exact prompt

    const result = await chat.sendMessage(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('❗ Error communicating with Gemini:', error);

    // Check if error has a 'response' property (common for Axios errors)
    if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
      console.error('Gemini API error details:', error.response.data);
      // Access status directly without 'as any'
      return res.status(error.response.status || 500).json({ message: error.response.data.message || 'Gemini API error.' });
    }
    // Generic error for non-Axios or other issues
    res.status(500).json({ message: `Server error processing chat message: ${error.message || 'Unknown error'}` });
  }
});

// Helper to get AQI text (same as frontend)
const getAqiStatusText = (aqi) => {
    if (aqi === 1) return "Good";
    if (aqi === 2) return "Fair";
    if (aqi === 3) return "Moderate";
    if (aqi === 4) return "Poor";
    if (aqi === 5) return "Very Poor";
    return "N/A";
};

module.exports = router;