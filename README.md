# 사이클링 날씨 어드바이저

A cycling weather advisor for 8 major Korean cities. Get a real-time suitability score, outfit recommendations, and a 3-day forecast before heading out on your bike.

## Features

- **0–100 suitability score** based on temperature, wind, precipitation, humidity, and UV index
- **5-level verdict** — 최상 / 좋음 / 보통 / 나쁨 / 위험
- **Outfit recommendations** with insulation, waterproof, and material attributes
- **3-day forecast** with per-day score and conditions
- **8 cities** — 서울, 부산, 인천, 대구, 광주, 대전, 울산, 제주
- Data aggregated from 3 weather providers for higher reliability

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TanStack Query, Tailwind CSS |
| API | Cloudflare Worker (weather-proxy) |
| Hosting | Cloudflare Pages |
| Monorepo | pnpm workspaces |

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 9+

### Install dependencies

```bash
pnpm install
```

### Environment variables

Create `artifacts/cycling-advisor/.env.local`:

```
VITE_API_BASE_URL=https://weather-proxy.neisii.workers.dev
```

### Run in development

```bash
pnpm --filter @workspace/cycling-advisor run dev
```

Open `http://localhost:5173`.

### Build

```bash
pnpm build
```

Output: `artifacts/cycling-advisor/dist/public/`

## Deployment

The frontend is a static site deployed to **Cloudflare Pages**. API calls are proxied through the separately deployed **Cloudflare Worker** (`weather-proxy`).

Set the following environment variable in the Cloudflare Pages dashboard:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://weather-proxy.neisii.workers.dev` |

## Project Structure

```
artifacts/
  cycling-advisor/     React SPA — scoring, outfit engine, UI
  mockup-sandbox/      Design sandbox
lib/
  api-spec/            OpenAPI spec
  api-client-react/    TanStack Query hooks (generated)
  api-zod/             Zod schemas (generated)
```

## Scoring Logic

| Factor | Ideal range | Max deduction |
|--------|-------------|---------------|
| Temperature | 10–24°C | –40 pts |
| Wind speed | < 6 m/s | –40 pts |
| Precipitation | None | –50 pts |
| Humidity | 30–80% | –15 pts |
| UV index | < 8 | –10 pts |

Thunderstorms, blizzards, and other extreme conditions override the score to 0 (위험).

---

## Credits

**Cycling Adviser · Ver 1.0**

Created by [@neisii](https://github.com/neisii)

Bug reports & inquiries: neisii@outlook.com
