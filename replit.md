# 사이클링 날씨 어드바이저

Korean cycling weather advisor app for 8 major Korean cities. Gives cyclists a 0–100 suitability score, a 5-level verdict, detailed outfit recommendations, and a 3-day forecast.

## Architecture

**Monorepo** managed by pnpm workspaces.

### Artifacts

| Name | Path | Description |
|------|------|-------------|
| `cycling-advisor` | `/` | React + Vite SPA — main frontend |
| `api-server` | `/api` | Express proxy to 3 weather providers |
| `mockup-sandbox` | `/__mockup` | Canvas preview server |

### Libraries

| Name | Description |
|------|-------------|
| `lib/api-spec` | OpenAPI spec (`openapi.yaml`) |
| `lib/api-client-react` | TanStack Query hooks generated from OpenAPI spec |
| `lib/api-zod` | Zod validation schemas generated from OpenAPI spec |

## Key Files

### Backend (`artifacts/api-server/src/`)
- `routes/weather.ts` — 3-provider weather fetching, aggregation, 5-min cache
- `routes/index.ts` — route registration

### Frontend (`artifacts/cycling-advisor/src/`)
- `data/cities.ts` — 8 Korean cities registry
- `data/outfitCatalog.ts` — 35+ outfit items with insulation/waterproof/material attributes
- `services/cyclingScorer.ts` — 0–100 scoring logic + 5-level verdict
- `services/outfitEngine.ts` — weather-driven outfit selection
- `pages/Home.tsx` — main page: city selector, score circle, weather stats, forecast tabs, outfit grid

## Weather Providers

1. **Open-Meteo** — free, no key needed
2. **OpenWeather** — requires `OPENWEATHER_API_KEY` secret
3. **WeatherAPI** — requires `WEATHERAPI_KEY` secret

All 3 are fetched in parallel, results are aggregated (weighted average). App degrades gracefully if any provider fails.

## Scoring Logic

- Base score: 100
- Temperature deduction: ideal 10–24°C, up to –40 pts outside range
- Wind deduction: ideal <6 m/s, up to –40 pts
- Precipitation deduction: drizzle –15, light rain –25, moderate –40, heavy –50
- Humidity deduction: ideal 30–80%, up to –15 pts
- UV deduction: –5 to –10 pts above UV index 8
- Extreme weather (thunderstorm, blizzard, `extreme`) → score 0, verdict "위험"

## Verdicts (5-level)

| Score | Korean | English |
|-------|--------|---------|
| 90–100 | 최상 | Excellent |
| 70–89 | 좋음 | Good |
| 50–69 | 보통 | Fair |
| 30–49 | 나쁨 | Poor |
| 0–29 | 위험 | Dangerous |

## Cities Supported

서울, 부산, 인천, 대구, 광주, 대전, 울산, 제주
