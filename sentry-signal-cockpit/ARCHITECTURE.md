# Architecture — demo state vs. real integration

This app is a **fully self-contained demo**: every data source is a static
JSON fixture in `/data`, served by a thin Express API in `/server`. Nothing
here talks to a real system. This doc maps each mocked piece to where a real
integration would plug in, so this demo can evolve into the desired-state
architecture described in the Sentry Workflow Doc (Product/Funding/Marketing/
Social signals → Data 360 Golden Record Hub → Lead Prioritization Dashboard/
Agent → Slack).

## Data layer

| Demo today | Real integration later |
|---|---|
| `/data/accounts.json`, `contacts.json`, `leads.json`, `opportunities.json` | Salesforce objects (Account, Contact, Lead, Opportunity), read via Salesforce REST/Bulk API or synced into a **Data 360 Golden Record Hub** |
| `/data/signals.json` | Output of a signal-unification pipeline: BigQuery product-usage rollups + Slack/Discord activity + support cases + Marketo engagement + ZoomInfo funding/firmographic + AEO/AI-search survey responses, normalized into one signal schema and ranked (today: Sentry pushes rudimentary product-signal fields from BigQuery into Salesforce CTA records — this schema generalizes that into a cross-source model) |
| `/data/utilization.json` | Live quota-consumption rollup from Sentry's BigQuery usage pipeline (same source powering today's `_admin` customer usage panel — see the quota categories: Errors, Transactions, Spans, Session Replay, Crons) |
| `/data/cases.json` | Support case system (e.g. Zendesk/Salesforce Service Cloud) queried by account |
| `/data/slackMessages.json` | Slack Web API (`conversations.history`) against the real per-account deal-room channel referenced by `Account.slackChannelId` |
| `/data/activityTimeline.json` | A merged read across Salesforce Activity History, email/calendar (e.g. Gmail/Outlook API), support case events, and product usage-spike events — exactly the cross-source merge Jason flagged as currently split between Salesforce and Slack/Notion |
| `/data/pocs.json` | Real POC documentation lives in **Notion today, not Salesforce** (per direct customer context) — `notionDocUrl` is a stub for what would be a real Notion API lookup or a Notion↔Salesforce sync (previously existed via Zapier, cut for cost) |

## API layer (`/server/index.js`)

The route shape is intentionally already what a real backend would expose —
swapping the *implementation* of each handler (not its contract) is enough
to go from mock to real:

- `GET /api/accounts`, `/api/signals`, `/api/opportunities`, etc. — swap the
  `readFileSync(...)` fixture read for a query against the Data 360 Golden
  Record Hub (or directly against Salesforce for a faster interim step).
- `GET /api/slack/:channelId` — swap for a live Slack Web API call scoped to
  that channel, with a real bot token.
- `GET /api/timeline/:accountId` — swap for the merged-activity query
  described above.
- `POST /api/agent` — swap the canned keyword-matched stub for a real
  LLM/agent endpoint (e.g. Claude via the Anthropic API) with tool access to
  the Golden Record Hub, so it can answer "why was this flagged", pull real
  last-touch data, and draft real follow-ups. The request/response shape
  (`{ question, accountId } → { answer }`) is already agent-endpoint-shaped.

## Signal categories → source mapping

The six signal categories in this demo (`Upsell`, `EngagementGap`,
`AccountIssue`, `Community`, `Funding`, `AEOIntent`) map to Jason Montgomery's
10 target signals and the workflow doc's signal sources:

- **Upsell / EngagementGap** ← Product usage (BigQuery quota rollups)
- **AccountIssue** ← Support cases + declining engagement patterns
- **Community** ← Slack/Discord community activity
- **Funding** ← ZoomInfo firmographic/technographic + funding data
- **AEOIntent** ← the homepage "how did you hear about us" survey — flagged
  explicitly in the UI as **self-reported only, no tracking pixel**, since
  Sentry has no ad cookies at scale and this is currently the *only* signal
  for AI-search/AEO intent. This is a deliberate data-model gap the demo
  surfaces rather than hides.

## Known data-model wrinkles this demo deliberately encodes

- **A contact can belong to multiple accounts** — `contacts.json` has
  `orgMembershipIds` as an array; some contacts intentionally span 2-3
  accounts to demonstrate the self-serve-to-sales-assist org-membership
  overlap Jason called out.
- **Notion vs. Salesforce activity bifurcation** — POC documentation and a
  meaningful share of rep activity live in Slack/Notion, not Salesforce.
  `pocs.json` and the activity timeline both surface this rather than
  assuming everything already lives in the CRM.
- **AEO intent is thin by design** — see above.

## Auth / security posture (demo)

There is no authentication, no API keys, and no outbound network calls in
this repo. Every "external" surface (Slack panel, agent chat, funding data)
is a local fixture or a canned stub response. When wiring in real
integrations, standard concerns apply: OAuth for Slack, service-account or
managed-identity auth for the Golden Record Hub, and normal LLM-provider API
key management (env vars via Railway's variable store, never committed).
