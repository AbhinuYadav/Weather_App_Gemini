// ... (existing code)

const express = require('express');
const cors = require('cors');
const weatherRoutes = require('./routes/weatherRoutes'); // <--- ADD THIS LINE

const app = express();
const PORT = process.env.PORT || 5000;

// ... (existing middleware)

app.use(cors());
app.use(express.json());

// ... (existing basic test route)

app.get('/', (req, res) => {
  res.send('Weather Analytics API Backend is Running!');
});

// --- Use API Routes ---
app.use('/api', weatherRoutes); // <--- ADD THIS LINE: All routes in weatherRoutes will be prefixed with /api

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access backend test at: http://localhost:${PORT}`);
  console.log(`Test weather API at: http://localhost:${PORT}/api/weather/YOUR_CITY_NAME`); // <--- ADD THIS console.log
});

// ... (end of file)