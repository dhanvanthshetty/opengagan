# Contributing to OpenGagan

Glad you're here. This is a fully open project — no auth, no paywalls, no gatekeeping.

## Get it running (3 commands)

```bash
git clone https://github.com/opengagan/opengagan
cp .env.example .env      # fill in your free API keys (see below)
npm install && npm run seed && npm run dev
```

Frontend → http://localhost:5173
Backend → http://localhost:4000

## Free API keys you'll need

| Service | Sign up | Used for |
|---------|---------|----------|
| OpenSky Network | opensky-network.org | Live aircraft positions |
| NASA FIRMS | firms.modaps.eosdis.nasa.gov | Fire hotspots |
| OpenWeatherMap | openweathermap.org | Fog & visibility |
| MongoDB Atlas M0 | mongodb.com/atlas | Database (free tier) |

## Before you PR

- Fork → feature branch off `main` → PR
- Run `npm test` — all tests must pass
- All data sources must stay free and open (no paid APIs)
- Every endpoint stays public — no auth
- If you're changing types, update `shared/src/types/` too

## Easiest contributions (no TypeScript needed)

Just edit a JSON file in `shared/src/data/`:

- Add a quiz question → `quiz.json`
- Add an airline → `airlines.json`
- Add a registration prefix → `reg-prefixes.json`
- Update airspace info → `airspace.json`

## Reporting bugs

Open a GitHub Issue with browser console output, server logs, and steps to reproduce.
