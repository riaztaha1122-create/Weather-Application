# Weather Application

A simple weather app with React frontend and Express backend. Uses [OpenWeatherMap](https://openweathermap.org/api) for forecasts.

## Setup

### 1. Get API key
- Sign up at [OpenWeatherMap](https://openweathermap.org/api)
- Copy your API key from the [API keys](https://home.openweathermap.org/api_keys) page

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env and add: WEATHER_API_KEY=your_api_key_here
npm install
npm start
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints (Backend)

| Endpoint | Description |
|----------|-------------|
| `GET /api/weather/:city` | Current weather for a city |
| `GET /api/forecast/:city` | 5-day forecast for a city |

## Deploy on Vercel

**Frontend** – deploy the `frontend` folder:
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

**Backend** – Vercel works best for static/serverless. For the Express backend, deploy separately on [Railway](https://railway.app), [Render](https://render.com), or similar. Then set your frontend's API base URL to your deployed backend in production.
