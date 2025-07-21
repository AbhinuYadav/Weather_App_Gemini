// Load environment variables from .env file at the very beginning.
// This must be at the top to ensure process.env variables are available.
require('dotenv').config();

const express = require('express');
const cors = require('cors'); // Middleware for Cross-Origin Resource Sharing
const weatherRoutes = require('./routes/weatherRoutes'); // Import your weather API routes
const chatRoutes = require('./routes/chatRoutes');     // Import your chat API routes

const app = express();
// Use the PORT from environment variables (defined in .env), default to 5000 if not set.
const PORT = process.env.PORT || 5000;

// --- Middleware Setup ---
// Enable CORS for all routes. This is essential for your React frontend (running on a different port)
// to make requests to this backend without browser security errors.
app.use(cors());

// Enable parsing of JSON request bodies. This middleware processes incoming requests
// with JSON payloads, making the data accessible in `req.body` in your route handlers.
// This is needed for receiving location data and chat messages from the frontend.
app.use(express.json());

// --- Basic Test Route ---
// This route serves as a simple check to confirm that your backend server is running.
// When you open http://localhost:5000/ in your browser, you will see this message.
app.get('/', (req, res) => {
  res.send('Weather Analytics API Backend is Running!');
});

// --- API Route Handling ---
// Mount your weather routes. All routes defined in weatherRoutes.js will be
// accessible under the '/api' prefix. For example, /api/weather/:location.
app.use('/api', weatherRoutes);

// Mount your chat routes. All routes defined in chatRoutes.js will also be
// accessible under the '/api' prefix. For example, /api/chat.
app.use('/api', chatRoutes);


// --- Start the Server ---
// The server starts listening for incoming HTTP requests on the specified PORT.
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access backend test at: http://localhost:${PORT}`);
  console.log(`Test weather API at: http://localhost:${PORT}/api/weather/YOUR_CITY_NAME (e.g., London, Zirakpur)`);
  console.log(`Test chat API: Use Postman/Insomnia for POST to http://localhost:${PORT}/api/chat (send { "sessionId": "some-id", "message": "Your message" })`);
});