// src/services/weatherService.js

const API_BASE_URL = 'http://localhost:5000/api'; // Your backend API base URL

/**
 * Fetches weather data for a given location.
 * @param {string} location - The city name or location string.
 * @returns {Promise<Object>} - A promise that resolves to the weather data.
 */
export const fetchWeatherData = async (location) => {
  try {
    const response = await fetch(`${API_BASE_URL}/weather/${encodeURIComponent(location)}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error; // Re-throw to be handled by the component
  }
};

/**
 * Sends a chat message with weather context to the backend.
 * @param {string} sessionId - Unique ID for the chat session.
 * @param {string} message - The user's message.
 * @param {Object} weatherContext - The current weather data to provide context to the AI.
 * @returns {Promise<Object>} - A promise that resolves to the chat reply.
 */
export const sendChatMessage = async (sessionId, message, weatherContext) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, message, weatherContext }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error; // Re-throw to be handled by the component
  }
};