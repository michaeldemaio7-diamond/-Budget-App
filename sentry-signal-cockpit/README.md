# Sentry Signal Cockpit — Demo

> **Demo/prototype only.** This is a standalone, headless web app that lives
> **outside** Salesforce. It is **not** wired to any real or sandbox Salesforce
> org, Data 360 instance, Slack workspace, or third-party API (Gong, Marketo,
> Clearbit, Lusha, ZoomInfo, etc.). Every account, contact, lead, signal,
> opportunity, case, Slack message, and activity event is synthetic/fictional
> and checked into this repo as static JSON. No real credentials, API keys,
> OAuth flows, or live network calls to Salesforce/Slack/Data 360 exist
> anywhere in this codebase.

A sales-rep-facing intelligence cockpit that unifies scattered signals —
product usage, support cases, Slack/Discord activity, marketing engagement,
funding/firmographic intent, and emerging AEO/AI-search intent — into one
ranked, clickable feed. Built to demo how a real **Data 360 Golden Record
Hub** could feed a **Lead Prioritization Dashboard** for Sentry reps (see
`ARCHITECTURE.md` for how this evolves into that real system).

## What's inside

- **Top Signals** — ranked, filterable cross-source signal feed (default view)
- **Top Opportunities** — open pipeline, sortable by amount or close date
- **Utilization** — stack-ranked quota consumption by account, with
  module-level breakdown (Errors / Transactions / Spans / Session Replay /
  Crons) and 30/60/90-day trend
- **Cases** — support queue ordered by SLA breach
- **Detail drawer** — opens from any signal, opportunity, or case row with:
  an embedded (mocked) Slack channel panel, a unified activity timeline, and
  a linked (mocked) Notion POC doc
- **Ask-anything agent** — floating chat bubble with a small canned Q&A set,
  stubbed to demonstrate where a real LLM/agent endpoint would plug in

## Tech stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, TanStack Query, Recharts
- **Backend:** lightweight Express server serving the mock JSON API (and the
  built frontend in production) — no external database
- **Data:** procedurally generated fixtures in `/data/*.json`, produced by
  `data/generate.mjs`

## Brand system

`tailwind.config.ts` approximates Sentry's public brand identity from memory
(dark near-black purple surfaces, violet/glitch-purple accent, warm
orange/pink alert accent, condensed sans headers) for a believable demo
theme. **Before any customer-facing use**, swap in the exact hex values,
logo assets, and licensed type family from Sentry's official brand guide and
Brandfetch page — this repo deliberately does not scrape or hotlink those.

## Local development

Requires Node 18+.

```bash
# 1. Install dependencies
npm install

# 2. (Re)generate the synthetic dataset — optional, fixtures are already
#    checked in, but this regenerates them deterministically
npm run seed

# 3. Run the API server and the Vite dev server together
npm run dev
```

This starts:
- the Express mock API on `http://localhost:8787`
- the Vite dev server on `http://localhost:5173` (proxies `/api/*` to 8787)

Open `http://localhost:5173`.

### Other scripts

| Command | What it does |
|---|---|
| `npm run dev:api` | API server only |
| `npm run dev:web` | Vite dev server only |
| `npm run build` | Production build of the frontend into `/dist` |
| `npm run start` | Runs the Express server in production mode (serves `/dist` + the API) — this is what Railway runs |
| `npm run seed` | Regenerates all `/data/*.json` fixtures |
| `npm run typecheck` | TypeScript check, no emit |

## Deploying with GitHub + Railway

### 1. Push this repo to GitHub

```bash
git init                       # if not already a repo
git add .
git commit -m "Sentry Signal Cockpit demo"
git branch -M main
git remote add origin https://github.com/<your-org>/<your-repo>.git
git push -u origin main
```

(If this folder lives inside a larger repo, as it does here, push the whole
repo as usual — Railway will be pointed at this subfolder in step 3.)

### 2. Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from
   GitHub repo**.
2. Select the repo you just pushed and authorize Railway's GitHub app if
   prompted.
3. If this app lives in a subdirectory (e.g. `sentry-signal-cockpit/` inside
   a monorepo), open the new service's **Settings → Source** and set the
   **Root Directory** to that subfolder.

### 3. Configure build & start (usually auto-detected)

Railway reads `railway.json` in this folder, which sets:

- **Build command:** `npm ci && npm run build`
- **Start command:** `npm run start`

No environment variables are required — the app has no external
dependencies or secrets. If Railway's Nixpacks build doesn't auto-detect
Node, set the **Builder** to `NIXPACKS` and Node version to 18+ manually in
service settings.

### 4. Expose a public URL

In the service's **Settings → Networking**, click **Generate Domain**. The
Express server reads `process.env.PORT` (Railway sets this automatically),
so no manual port configuration is needed.

### 5. Redeploy on push

Railway auto-deploys on every push to the connected branch. To ship a
change: commit, push to GitHub, and Railway rebuilds and redeploys
automatically.

## Regenerating the dataset

The dataset is intentionally large (100 accounts, 100 contacts, 100 leads,
and a proportionate spread of signals/opportunities/cases/utilization/POCs)
so the demo feels like a real book of business rather than a 6-account toy
example. It's fully synthetic and reproducible:

```bash
npm run seed
```

This overwrites everything in `/data/*.json` using a seeded PRNG, so the
output is deterministic across runs unless you edit `data/generate.mjs`.

## Notes for a customer-facing demo

- Swap in Sentry's real brand assets (exact hex codes, logo files, licensed
  type) from the official brand guide and Brandfetch page before showing
  this to Sentry — see the brand system note above.
- See `ARCHITECTURE.md` for exactly where a real Data 360 / Salesforce /
  Slack / LLM integration would plug in to turn this into the production
  system described in the Sentry Workflow Doc.
