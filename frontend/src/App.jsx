import { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const DEBOUNCE_MS = 300;

// Weather-based background images from Unsplash (live from internet)
const BG_IMAGES = {
  clear: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
  clouds: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1920&q=80',
  rain: 'https://images.unsplash.com/photo-1542223616-9de9adb5e3e8?w=1920&q=80',
  drizzle: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=1920&q=80',
  thunderstorm: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=80',
  snow: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1920&q=80',
  mist: 'https://images.unsplash.com/photo-1504281623087-1a6dd8f827c2?w=1920&q=80',
  default: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',
};

// Weather-based gradient themes
const GRADIENT_THEMES = {
  clear: 'linear-gradient(135deg, rgba(251, 191, 36, 0.4) 0%, rgba(245, 158, 11, 0.5) 30%, rgba(15, 23, 42, 0.85) 100%)',
  clouds: 'linear-gradient(135deg, rgba(100, 116, 139, 0.4) 0%, rgba(71, 85, 105, 0.5) 30%, rgba(15, 23, 42, 0.88) 100%)',
  rain: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(30, 64, 175, 0.5) 30%, rgba(15, 23, 42, 0.9) 100%)',
  drizzle: 'linear-gradient(135deg, rgba(96, 165, 250, 0.4) 0%, rgba(37, 99, 235, 0.5) 30%, rgba(15, 23, 42, 0.88) 100%)',
  thunderstorm: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(49, 46, 129, 0.6) 30%, rgba(15, 23, 42, 0.92) 100%)',
  snow: 'linear-gradient(135deg, rgba(224, 242, 254, 0.35) 0%, rgba(186, 230, 253, 0.4) 30%, rgba(15, 23, 42, 0.88) 100%)',
  mist: 'linear-gradient(135deg, rgba(148, 163, 184, 0.4) 0%, rgba(100, 116, 139, 0.5) 30%, rgba(15, 23, 42, 0.88) 100%)',
  default: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(15, 118, 110, 0.5) 30%, rgba(15, 23, 42, 0.85) 100%)',
};

function getWeatherType(id) {
  if (!id) return 'default';
  if (id >= 200 && id < 300) return 'thunderstorm';
  if (id >= 300 && id < 400) return 'drizzle';
  if (id >= 500 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 700 && id < 800) return 'mist';
  if (id === 800) return 'clear';
  if (id >= 801 && id <= 804) return 'clouds';
  return 'default';
}

function App() {
  const [city, setCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const weatherType = weather ? getWeatherType(weather.weather?.[0]?.id) : 'default';
  const bgImage = BG_IMAGES[weatherType];
  const gradientTheme = GRADIENT_THEMES[weatherType];

  // Debounced city suggestions
  useEffect(() => {
    const query = city.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/cities?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [city]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSuggestion = (s) => {
    setCity(s.label);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const search = async () => {
    if (!city.trim()) return;
    setLoading(true);
    setError('');
    setShowSuggestions(false);
    setSuggestions([]);
    setWeather(null);
    setForecast(null);
    try {
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(`${API_BASE}/weather/${encodeURIComponent(city.trim())}`),
        fetch(`${API_BASE}/forecast/${encodeURIComponent(city.trim())}`),
      ]);
      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();
      if (!weatherRes.ok) throw new Error(weatherData.error || 'City not found');
      if (!forecastRes.ok) throw new Error(forecastData.error || 'Forecast failed');
      setWeather(weatherData);
      setForecast(forecastData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (id) => `https://openweathermap.org/img/wn/${id}@2x.png`;

  const groupByDay = (list) => {
    const groups = {};
    list?.forEach((item) => {
      const day = new Date(item.dt * 1000).toDateString();
      if (!groups[day]) groups[day] = [];
      groups[day].push(item);
    });
    return Object.entries(groups).map(([day, items]) => ({
      day: new Date(day).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
      items,
    }));
  };

  const dailyForecast = forecast ? groupByDay(forecast.list).slice(0, 5) : [];

  return (
    <div className="app" style={{ '--bg-image': `url(${bgImage})`, '--gradient-overlay': gradientTheme }}>
      <div className="bg-layer" />
      <div className="gradient-overlay" />
      <div className="content-wrapper">
        <header className={`header ${weather ? 'header--compact' : ''} animate-up`}>
          <h1>Weather Forecast</h1>
          <p>Search for any city worldwide to get real-time weather and 5-day forecast</p>
          <div className="search" ref={suggestionsRef}>
            <div className="search-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                placeholder="Start typing a city name..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (showSuggestions && suggestions.length > 0) {
                      selectSuggestion(suggestions[0]);
                    } else {
                      search();
                    }
                  }
                  if (e.key === 'Escape') setShowSuggestions(false);
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              {showSuggestions && (
                <ul className="suggestions">
                  {suggestionsLoading ? (
                    <li className="suggestions-loading">Searching...</li>
                  ) : suggestions.length === 0 ? (
                    <li className="suggestions-empty">No cities found</li>
                  ) : (
                    suggestions.map((s, i) => (
                      <li
                        key={`${s.name}-${s.country}-${i}`}
                        onClick={() => selectSuggestion(s)}
                        role="option"
                      >
                        {s.label}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
            <button onClick={search} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </header>

        {error && (
          <div className="error animate-up">
            {error}
          </div>
        )}

        {weather && (
          <main className="content">
            <section className="current animate-up">
              <div className="current-main">
                <div>
                  <h2>{weather.name}, {weather.sys?.country}</h2>
                  <p className="desc">{weather.weather?.[0]?.description}</p>
                  <p className="time">
                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} local
                  </p>
                </div>
                <div className="temp-row">
                  <img src={getIcon(weather.weather?.[0]?.icon)} alt="" />
                  <span className="temp">{Math.round(weather.main?.temp)}°C</span>
                </div>
              </div>
              <div className="stats">
                <div className="stat">
                  <span className="stat-icon">🌡</span>
                  <span className="stat-label">Feels like</span>
                  <span className="stat-value">{Math.round(weather.main?.feels_like)}°C</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">💧</span>
                  <span className="stat-label">Humidity</span>
                  <span className="stat-value">{weather.main?.humidity}%</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">💨</span>
                  <span className="stat-label">Wind</span>
                  <span className="stat-value">{weather.wind?.speed} m/s</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">👁</span>
                  <span className="stat-label">Visibility</span>
                  <span className="stat-value">{(weather.visibility / 1000).toFixed(1)} km</span>
                </div>
              </div>
            </section>

            {dailyForecast.length > 0 && (
              <section className="forecast animate-up">
                <h3>5-Day Forecast</h3>
                <div className="forecast-grid">
                  {dailyForecast.map(({ day, items }, i) => {
                    const mid = items[Math.floor(items.length / 2)];
                    const icon = mid?.weather?.[0]?.icon;
                    const temp = Math.round(items.reduce((a, i) => a + i.main.temp, 0) / items.length);
                    const desc = mid?.weather?.[0]?.description;
                    const minTemp = Math.round(Math.min(...items.map((x) => x.main.temp_min)));
                    const maxTemp = Math.round(Math.max(...items.map((x) => x.main.temp_max)));
                    return (
                      <div key={day} className="forecast-card animate-up" style={{ animationDelay: `${(i + 1) * 80}ms` }}>
                        <span className="forecast-day">{day}</span>
                        <img src={getIcon(icon)} alt="" />
                        <span className="forecast-temp">{temp}°C</span>
                        <span className="forecast-range">{minTemp}° / {maxTemp}°</span>
                        <span className="forecast-desc">{desc}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
