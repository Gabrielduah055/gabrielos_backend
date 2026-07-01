# GabrielOS Backend

Personal AI operating system backend: tracks scholarships, jobs, and business
leads through a **Scout Goal -> Opportunity Candidate -> Opportunity** pipeline,
scored and deduplicated via web search (Tavily).

## Architecture

- **Express 5 + TypeScript**, raw `pg` (no ORM), Postgres.
- **Two auth surfaces:**
  - `firebaseAuth` - Firebase ID token (`Authorization: Bearer <token>`), used
    by the dashboard frontend. Resolves the acting user dynamically per request.
  - `serviceAuth` - static shared secret (`Authorization: Bearer <SERVICE_API_KEY>`),
    used by automation callers (Hermes Agent). Resolves a fixed tenant via
    `HERMES_SERVICE_USER_ID` - this is a personal, single-user system, so
    automation doesn't need per-request identity.
- **Pipeline:** a `scout_goal` defines search criteria (keywords/location/type/
  frequency/minimum score). Running it searches the web, scores results, and
  creates `opportunity_candidates` (deduplicated by normalized URL). Approving
  a candidate transactionally converts it into a tracked `opportunity` with a
  status workflow (saved -> interested -> contacted -> applied -> ... -> won/lost).
- **Daily brief:** aggregates pending candidates, opportunities needing
  follow-up, and upcoming deadlines, optionally summarized into natural
  language via OpenAI (falls back to a plain-text template if unconfigured or
  if the OpenAI call fails).

## API surface

| Route | Auth | Notes |
|---|---|---|
| `GET /` | none | health check |
| `GET /api/test-db` | none | DB connectivity check |
| `POST /api/auth/login` | none | |
| `POST /api/auth/logout` | firebaseAuth | |
| `GET/PUT /api/users/me` | firebaseAuth | |
| `GET/POST /api/opportunities`, `GET/PATCH/DELETE /api/opportunities/:id` | firebaseAuth | |
| `GET/POST /api/opportunity-candidates`, `GET/PATCH/DELETE /api/opportunity-candidates/:id`, `POST /:id/approve`, `POST /:id/ignore` | firebaseAuth | |
| `GET/POST /api/scout-goals`, `GET/PATCH/DELETE /api/scout-goals/:id`, `POST /:id/run` | firebaseAuth | runs a scout goal on demand |
| `GET /api/service/scout-goals` | serviceAuth | for automation callers |
| `POST /api/service/scout-goals/:id/run` | serviceAuth | same as above, service-auth door |
| `GET /api/service/opportunity-candidates` | serviceAuth | pending candidates only |
| `GET /api/service/daily-brief` | serviceAuth | aggregated summary + narrative |

## Environment variables

| Var | Required | Notes |
|---|---|---|
| `PORT` | no | defaults to 5000 |
| `DATABASE_URL` | yes* | or discrete `DB_USER`/`DB_HOST`/`DB_NAME`/`DB_PASSWORD`/`DB_PORT` |
| `FIREBASE_SERVICE_ACCOUNT` | yes | JSON string, for dashboard auth |
| `FIREBASE_WEB_API_KEY` | yes | |
| `TAVILY_API_KEY` | yes | scout goal web search |
| `SEARCH_PROVIDER` | yes | currently `tavily` |
| `SERVICE_API_KEY` | yes, for automation | shared secret for `/api/service/*` |
| `HERMES_SERVICE_USER_ID` | yes, for automation | numeric `users.id` automation acts as |
| `OPENAI_API_KEY` | no | enables AI daily-brief narrative; falls back to a template if unset |

## Development

```
npm install
npm run dev     # ts-node-dev, src/server.ts
npm run build   # tsc -> dist/
npm start       # node dist/server.js
```

Schema is applied defensively on startup (`src/config/initDatabase.ts` runs
`src/database/schema.sql`, which uses `CREATE TABLE IF NOT EXISTS` /
`ALTER TABLE ADD COLUMN IF NOT EXISTS` throughout - safe to re-run).

## Hermes Agent integration status

The `/api/service/*` routes exist and work, but **no Hermes cron job calls
them yet** - that wiring is a separate, later phase (after the dashboard
frontend is built). This backend does not run its own scheduler or Telegram
bot; when that phase lands, Hermes Agent's own cron scheduler and existing
Telegram connection will handle scheduling and delivery by calling these
endpoints and relaying the results.
