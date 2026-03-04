require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.WEATHER_API_KEY;

app.use(cors());
app.use(express.json());

if (!API_KEY) {
  console.warn('⚠️  WEATHER_API_KEY not found in .env - API calls will fail');
}

// Geocode: get lat/lon from city name
async function getCoords(city) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: data[0].lat, lon: data[0].lon, name: data[0].name, country: data[0].country };
}

// Current weather (by city name)
app.get('/api/weather/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.cod !== 200) {
      return res.status(404).json({ error: data.message || 'City not found' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5-day forecast (by city name)
app.get('/api/forecast/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const coords = await getCoords(city);
    if (!coords) {
      return res.status(404).json({ error: 'City not found' });
    }
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.cod !== '200') {
      return res.status(500).json({ error: data.message || 'Forecast failed' });
    }
    res.json({ ...data, city: coords.name, country: coords.country });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Weather API server running on http://localhost:${PORT}`);
});
