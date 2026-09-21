# Briefly — Meeting Intelligence Platform

Create or join meetings, record or upload audio/video, get a transcript with
speaker diarization, a structured summary (Overview / Key Decisions / Open
Questions / Next Steps), tracked action items, a searchable meeting history,
and stubbed integrations with Google Calendar, Slack, Notion, Jira, and
Linear.

## What's real vs. stubbed

Everything in the product is fully built and usable **except** the parts that
need an LLM, which are intentionally deferred:

| Area | Status |
| --- | --- |
| Auth, teams, meetings, participants, join-by-code | Real |
| Recording upload + live browser mic recording | Real |
| Transcript viewer, speaker renaming, timeline highlights | Real |
| Action items (CRUD, owners, due dates, status) | Real |
| Dashboards (meetings, tasks, decision log) | Real |
| Keyword search over titles/summaries/transcripts | Real (SQL `ILIKE`) |
| Integration connections, activity log, trigger points | Real framework, **simulated** external calls |
| Speech-to-text + speaker diarization | **Stub** — deterministic placeholder transcript |
| Summarization + action-item extraction | **Stub** — deterministic placeholder content |
| Natural-language / semantic search, contextual Q&A | Not built yet |

Stubbed logic lives in `src/lib/processing.ts` (transcription/diarization/
summarization/action-items) and `src/lib/integrations.ts` (outbound calls to
providers). Both are commented with exactly what to replace when the LLM
integration work starts — the database schema, API routes, and UI don't need
to change.

## Stack

Next.js 16 (App Router, TypeScript) · Prisma 7 + PostgreSQL · Tailwind CSS 4 ·
JWT session auth (bcrypt + jose, no third-party auth provider) · local disk
storage for recordings.

## Getting started

```bash
npm install
docker compose up -d        # starts Postgres on localhost:5433
npm run db:migrate           # applies the schema
npm run db:seed              # creates a demo workspace + one processed meeting
npm run dev
```

Open http://localhost:3000 and sign in with the seeded demo account:

- **Email:** `demo@briefly.app`
- **Password:** `password123`

Or register a fresh workspace from the sign-up page.

### Environment variables

Copy `.env.example` to `.env` (already done for local dev — see `.env`):

- `DATABASE_URL` — Postgres connection string (matches `docker-compose.yml`)
- `AUTH_SECRET` — used to sign session JWTs; generate your own with
  `openssl rand -base64 32` before deploying anywhere real
- `ANTHROPIC_API_KEY` — **not used yet.** Reserved for when the LLM-powered
  features (real summarization, action-item extraction, natural-language
  search, contextual Q&A — see `src/lib/processing.ts`) get implemented
  against the Claude API. Get a key at https://console.anthropic.com/ when
  that work starts.

Uploaded recordings are stored under `storage/uploads/` (git-ignored) and
served back through an authenticated API route, not as static files.

### Useful scripts

- `npm run db:studio` — Prisma Studio, a GUI over the database
- `npm run db:migrate` — create/apply a new migration after editing
  `prisma/schema.prisma`
- `npm run db:seed` — re-run the demo seed (no-ops if the demo user already
  exists)

## Project layout

```
prisma/schema.prisma        Data model (see comments for what's LLM-adjacent)
src/lib/processing.ts       Stub transcription/diarization/summary pipeline
src/lib/integrations.ts     Stub outbound integration calls
src/lib/auth.ts             Password hashing + JWT session cookies
src/app/api/**              Route handlers (the whole backend)
src/app/(auth)/**           Login / register
src/app/(app)/**            Authenticated app shell + pages
src/components/**           UI components (meeting/ has the meeting-detail tabs)
```
