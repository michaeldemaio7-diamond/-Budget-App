/**
 * Seed generator for the Sentry Signal Cockpit DEMO.
 *
 * Everything produced here is synthetic/fictional. No real Sentry customers,
 * Salesforce data, or third-party data of any kind is used or fetched.
 * The generator is deterministic (seeded PRNG) so the dataset is regenerable:
 *
 *   npm run seed   →  rewrites all data/*.json fixtures
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = dirname(fileURLToPath(import.meta.url));
const NOW = new Date("2026-09-15T17:00:00Z").getTime();
const DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------- PRNG
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260915);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const chance = (p) => rand() < p;
const isoDaysAgo = (days) => new Date(NOW - days * DAY).toISOString();

// ---------------------------------------------------------------- name pools (fictional)
const namePrefix = [
  "Lumen", "Vertex", "Quill", "Harbor", "Nimbus", "Atlas", "Forge", "Pulse",
  "Cinder", "Drift", "Ember", "Vault", "Crest", "Orbit", "Beacon", "Ridge",
  "Sable", "Tidal", "Glacier", "Copper", "Argon", "Basalt", "Cobalt", "Dune",
  "Echo", "Fable", "Grove", "Helix", "Iris", "Juniper", "Kestrel", "Larch",
  "Meridian", "Northwind", "Onyx", "Pinnacle", "Quarry", "Rowan", "Summit", "Thistle"
];
const nameSuffix = [
  "Labs", "Systems", "Health", "Robotics", "Analytics", "Commerce", "Bank",
  "Games", "Media", "Logistics", "Grid", "Cloud", "Security", "Pay", "Works",
  "AI", "Data", "Mobility", "Studio", "Networks", "Bio", "Finance", "Retail", "Energy"
];
const industries = [
  "Fintech", "Healthtech", "Gaming", "E-commerce", "Developer Tools", "Media & Streaming",
  "Logistics", "Insurance", "Ed-tech", "Cybersecurity", "Travel", "Real Estate", "AI/ML Platforms"
];
const employeeBands = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const planTiers = ["Developer", "Team", "Business", "Enterprise"];
const csms = ["Priya Natarajan", "Marcus Bell", "Elena Vostrikova", "Sam Okafor"];
const aes = ["Jordan Reyes", "Casey Lindqvist", "Aviva Stern", "Tom Whitaker", "Dana Kim"];
const firstNames = [
  "Ava", "Noah", "Mia", "Liam", "Zoe", "Ethan", "Ines", "Ravi", "Yuki", "Omar",
  "Freya", "Diego", "Nia", "Felix", "Lena", "Kai", "Tara", "Hugo", "Sofia", "Jonas",
  "Maya", "Aiden", "Clara", "Rohan", "Elsa", "Marco", "Ida", "Dev", "Nora", "Silas"
];
const lastNames = [
  "Calloway", "Ferreira", "Osei", "Lindgren", "Takeda", "Marchetti", "Novak", "Iyer",
  "Beaumont", "Kowalski", "Ashford", "Duarte", "Ekwueme", "Halvorsen", "Petrov",
  "Sandoval", "Whitfield", "Nakagawa", "Oyelaran", "Vance", "Brennan", "Castellanos"
];
const contactRoles = [
  "Champion", "Economic Buyer", "Technical Evaluator", "User", "Executive Sponsor", "Influencer"
];
const titles = [
  "VP Engineering", "CTO", "Head of Platform", "Staff Engineer", "Engineering Manager",
  "Director of DevOps", "SRE Lead", "Head of Product", "CIO", "Principal Engineer"
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ---------------------------------------------------------------- accounts (100)
const accounts = [];
const usedNames = new Set();
while (accounts.length < 100) {
  const name = `${pick(namePrefix)} ${pick(nameSuffix)}`;
  if (usedNames.has(name)) continue;
  usedNames.add(name);
  const i = accounts.length + 1;
  const id = `acc-${String(i).padStart(3, "0")}`;
  const tier = pick(planTiers);
  const arrBase = { Developer: [3, 20], Team: [10, 60], Business: [40, 250], Enterprise: [120, 1400] }[tier];
  accounts.push({
    id,
    name,
    slug: slugify(name),
    arr: int(arrBase[0], arrBase[1]) * 1000,
    planTier: tier,
    csmOwner: pick(csms),
    aeOwner: pick(aes),
    slackChannelId: chance(0.6) ? `C${String(1000 + i)}${slugify(name).slice(0, 4).toUpperCase()}` : null,
    discordHandle: chance(0.35) ? `@${slugify(name)}-community` : null,
    industry: pick(industries),
    employeeBand: pick(employeeBands),
    joinedAt: isoDaysAgo(int(90, 2600))
  });
}
// Hand-tune a few accounts the demo narrative leans on.
Object.assign(accounts[0], { name: "Lumenpath Health", slug: "lumenpath-health", planTier: "Business", arr: 148000, industry: "Healthtech", employeeBand: "51-200", slackChannelId: "C1001LUME" });
Object.assign(accounts[1], { name: "Vertex Grid", slug: "vertex-grid", planTier: "Enterprise", arr: 620000, industry: "Energy", employeeBand: "1000+", slackChannelId: "C1002VERT" });
Object.assign(accounts[2], { name: "Quillstack AI", slug: "quillstack-ai", planTier: "Team", arr: 54000, industry: "AI/ML Platforms", employeeBand: "51-200", slackChannelId: "C1003QUIL", discordHandle: "@quillstack-community" });
Object.assign(accounts[3], { name: "Harborline Pay", slug: "harborline-pay", planTier: "Enterprise", arr: 890000, industry: "Fintech", employeeBand: "1000+", slackChannelId: "C1004HARB" });
Object.assign(accounts[4], { name: "Nimbus Games", slug: "nimbus-games", planTier: "Business", arr: 210000, industry: "Gaming", employeeBand: "201-1000", slackChannelId: "C1005NIMB", discordHandle: "@nimbus-players" });
Object.assign(accounts[5], { name: "Atlas Mobility", slug: "atlas-mobility", planTier: "Business", arr: 175000, industry: "Logistics", employeeBand: "201-1000", slackChannelId: null });
Object.assign(accounts[6], { name: "Forgeline Robotics", slug: "forgeline-robotics", planTier: "Developer", arr: 18000, industry: "Developer Tools", employeeBand: "11-50", slackChannelId: null });
Object.assign(accounts[7], { name: "Pulsewire Media", slug: "pulsewire-media", planTier: "Team", arr: 62000, industry: "Media & Streaming", employeeBand: "51-200", slackChannelId: "C1008PULS" });

// ---------------------------------------------------------------- contacts (100)
const contacts = [];
for (let i = 1; i <= 100; i++) {
  const account = accounts[int(0, 99)];
  const first = pick(firstNames);
  const last = pick(lastNames);
  const memberships = [account.id];
  // Demonstrate Jason's "a member can be part of multiple orgs" wrinkle.
  if (i % 9 === 0) {
    const extra = accounts[int(0, 99)];
    if (extra.id !== account.id) memberships.push(extra.id);
    if (i % 27 === 0) {
      const third = accounts[int(0, 99)];
      if (!memberships.includes(third.id)) memberships.push(third.id);
    }
  }
  contacts.push({
    id: `con-${String(i).padStart(3, "0")}`,
    accountId: account.id,
    name: `${first} ${last}`,
    title: pick(titles),
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${account.slug}.example.com`,
    role: pick(contactRoles),
    orgMembershipIds: memberships,
    lastActivityDate: isoDaysAgo(int(0, 120))
  });
}

// ---------------------------------------------------------------- leads (100)
const leadSources = ["Inbound", "Self-Serve-PLG", "Enterprise-Outbound", "Marketing-Campaign"];
const leadStatuses = ["New", "Working", "Qualified", "Converted", "Disqualified"];
const leads = [];
for (let i = 1; i <= 100; i++) {
  const first = pick(firstNames);
  const last = pick(lastNames);
  const status = pick(leadStatuses);
  const company = chance(0.25) ? pick(accounts).name : `${pick(namePrefix)}${pick(["ly", "io", "hq", " Co", " Group"])}`;
  leads.push({
    id: `lead-${String(i).padStart(3, "0")}`,
    name: `${first} ${last}`,
    company,
    title: pick(titles),
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${slugify(company)}.example.com`,
    source: pick(leadSources),
    status,
    score: int(5, 98),
    convertedAccountId: status === "Converted" ? pick(accounts).id : null,
    createdAt: isoDaysAgo(int(1, 400))
  });
}

// ---------------------------------------------------------------- signals
// Curated, narrative-bearing signals first (they answer Jason's "signal vs. noise" ask),
// then procedural filler across the wider account base.
const curatedSignals = [
  {
    accountId: "acc-003", category: "Upsell", source: "Product-BigQuery",
    headline: "Span ingestion at 104% of quota with 24 days left in cycle",
    detail: "Quillstack AI is projected to land at 131% of span quota this period (BigQuery usage rollup). PAYG overage spend is up 163% period-over-period. Firmographic profile (58 employees, AI platform, Team plan) matches the self-serve→sales-assist conversion band.",
    suggestedAction: "Open expansion conversation", priority: 98
  },
  {
    accountId: "acc-001", category: "AEOIntent", source: "AEOSurvey",
    headline: "\"Found you via ChatGPT recommendation\" — 3rd AI-search mention this month",
    detail: "Lumenpath Health signups keep citing AI assistants in the homepage \"how did you hear about us\" survey. Self-reported only — no tracking pixel: Sentry has no ad cookies, so AEO/AI-search intent is inferred solely from this survey today.",
    suggestedAction: "Tag account for AEO-intent cohort", priority: 91, selfReportedOnly: true
  },
  {
    accountId: "acc-004", category: "AccountIssue", source: "SupportCase",
    headline: "P1 case open 4 days past SLA during renewal quarter",
    detail: "Harborline Pay's checkout-instrumentation case (CS-1042) has an executive escalation owner assigned and renewal closes Dec 15. Support sentiment and product usage are diverging.",
    suggestedAction: "Escalate to save play", priority: 95
  },
  {
    accountId: "acc-002", category: "EngagementGap", source: "Slack",
    headline: "Top rep activity lives in external Slack — 0 Salesforce touches logged in 30d",
    detail: "Vertex Grid's deal room shows 47 messages in 2 weeks, but no Salesforce activity is logged (Notion-vs-Salesforce bifurcation). The rep with the most real activity has the least recorded activity — handoff quality is unmeasured.",
    suggestedAction: "Sync deal-room highlights to CRM", priority: 88
  },
  {
    accountId: "acc-005", category: "Community", source: "Discord",
    headline: "Community thread on Session Replay hit 60+ reactions",
    detail: "Nimbus Games engineers are actively evangelizing Replay workflows in Discord. Replay is not on their current plan — organic pull is forming outside the sales motion.",
    suggestedAction: "Send Replay trial offer", priority: 84
  },
  {
    accountId: "acc-007", category: "Funding", source: "ZoomInfo",
    headline: "Series B ($42M) announced; headcount +35% QoQ",
    detail: "Forgeline Robotics raised and is hiring platform engineers (firmographic + technographic fit). Currently a $18K Developer-tier account — profile matches the 60-employee → $100K expansion pattern.",
    suggestedAction: "Open expansion conversation", priority: 90
  },
  {
    accountId: "acc-008", category: "EngagementGap", source: "Marketing",
    headline: "Champion went dark: 0 opens across last 6 campaign touches",
    detail: "Pulsewire Media's champion previously opened 80% of emails; engagement stopped 3 weeks before their POC review. Contact also holds memberships in two other orgs — activity may have moved with them.",
    suggestedAction: "Run champion re-engagement play", priority: 82
  },
  {
    accountId: "acc-003", category: "Community", source: "Discord",
    headline: "Quillstack engineer answering other users' questions in #help",
    detail: "A Quillstack AI staff engineer has become a top-5 answerer in community #help this month — strong champion candidate not yet in the CRM.",
    suggestedAction: "Add as Champion contact", priority: 76
  },
  {
    accountId: "acc-006", category: "Upsell", source: "Product-BigQuery",
    headline: "Cron monitoring adoption jumped 0→220 monitors in 3 weeks",
    detail: "Atlas Mobility quietly rolled Crons across 12 services. No Slack channel is linked to this account, so the only visible trace is the BigQuery usage rollup.",
    suggestedAction: "Open expansion conversation", priority: 79
  },
  {
    accountId: "acc-002", category: "Upsell", source: "Product-BigQuery",
    headline: "Errors quota pacing to 118% with enterprise true-up window open",
    detail: "Vertex Grid error volume is compounding ~8% weekly since their marketplace launch. True-up conversation window closes at end of month.",
    suggestedAction: "Schedule true-up review", priority: 86
  },
  {
    accountId: "acc-001", category: "AccountIssue", source: "SupportCase",
    headline: "Two medium cases reopened twice each — silent churn pattern",
    detail: "Lumenpath Health has reopened the same SDK-symbolication cases repeatedly without escalating. Historically this pattern precedes quiet non-renewal in the Business tier.",
    suggestedAction: "Proactive health check call", priority: 74
  },
  {
    accountId: "acc-005", category: "Funding", source: "ZoomInfo",
    headline: "Studio acquired mid-size publisher; entity count will double",
    detail: "Nimbus Games' acquisition adds ~15 new game teams. Multi-org data wrinkle: several of their engineers already appear as members of the acquired org's Sentry account.",
    suggestedAction: "Map combined org structure", priority: 80
  },
  {
    accountId: "acc-008", category: "AEOIntent", source: "AEOSurvey",
    headline: "Two new signups cite \"AI coding assistant suggested Sentry\"",
    detail: "Self-reported only — no tracking pixel. Pulsewire Media's new microsite team arrived via AI-assistant recommendation per the homepage survey; no other intent source can see this today.",
    suggestedAction: "Tag account for AEO-intent cohort", priority: 70, selfReportedOnly: true
  }
];

const signalTemplates = {
  Upsell: [
    ["Transactions pacing to {pct}% of quota", "Usage rollup shows sustained growth across {n} services.", "Open expansion conversation", "Product-BigQuery"],
    ["Seat utilization at {pct}% — team is at capacity", "Active members near licensed seat count for 3 straight weeks.", "Propose seat expansion", "Product-BigQuery"]
  ],
  EngagementGap: [
    ["No product logins from admin users in {n} days", "Instrumentation still reporting, but humans stopped looking at it.", "Run re-engagement play", "Product-BigQuery"],
    ["Slack deal channel silent for {n} days", "Last message was an unanswered question from our side.", "Re-open deal channel with value recap", "Slack"]
  ],
  AccountIssue: [
    ["Case volume up {pct}% month-over-month", "Support load rising while usage is flat — friction, not growth.", "Proactive health check call", "SupportCase"],
    ["NPS-style survey came back {n}/10 from a technical evaluator", "Score arrived mid-evaluation; risk of quiet detractor.", "Escalate to save play", "Marketing"]
  ],
  Community: [
    ["Account engineers joined community Discord ({n} this month)", "Organic community pull forming outside the sales motion.", "Invite to community roundtable", "Discord"],
    ["Public praise for Sentry in community channel", "A named engineer posted a positive workflow write-up.", "Add as Champion contact", "Discord"]
  ],
  Funding: [
    ["New funding round detected (${n}M)", "Firmographic refresh shows hiring across platform roles.", "Open expansion conversation", "ZoomInfo"],
    ["Headcount grew {pct}% QoQ", "Technographic scan shows expanding service footprint.", "Qualify for sales-assist motion", "ZoomInfo"]
  ],
  AEOIntent: [
    ["Signup cited AI assistant in \"how did you hear about us\"", "Self-reported only — no tracking pixel exists for AEO/AI-search intent today.", "Tag account for AEO-intent cohort", "AEOSurvey"]
  ]
};

const signals = curatedSignals.map((s, i) => ({
  id: `sig-${String(i + 1).padStart(3, "0")}`,
  createdAt: isoDaysAgo(int(0, 6)),
  selfReportedOnly: false,
  ...s
}));
let sigN = signals.length;
for (const account of accounts.slice(8, 60)) {
  if (!chance(0.75)) continue;
  const category = pick(Object.keys(signalTemplates));
  const [h, d, action, source] = pick(signalTemplates[category]);
  const fill = (t) => t.replaceAll("{pct}", String(int(55, 140))).replaceAll("{n}", String(int(3, 45)));
  sigN += 1;
  signals.push({
    id: `sig-${String(sigN).padStart(3, "0")}`,
    accountId: account.id,
    category,
    source,
    headline: fill(h),
    detail: fill(d),
    suggestedAction: action,
    priority: int(30, 72),
    selfReportedOnly: category === "AEOIntent",
    createdAt: isoDaysAgo(int(0, 21))
  });
}

// ---------------------------------------------------------------- opportunities
const stages = ["Stage 0 — Initial Lead", "Stage 2 — Qualified / Discovery", "POC", "Technical Validation", "Business Validation", "Negotiation"];
const oppStatuses = ["On track", "Needs push", "At risk"];
const nextSteps = [
  "Schedule mutual action plan review", "SE to confirm technical success criteria",
  "Send command-of-the-message recap", "Book exec alignment call",
  "Confirm MEDDPIC economic buyer", "POC readout scheduled — prep deck",
  "Legal redlines back from customer", "Await security questionnaire response"
];
const curatedOpps = [
  ["acc-003", "Quillstack AI — Team→Business expansion", "Stage 2 — Qualified / Discovery", 96000, 38, "Needs push", "Open expansion conversation off span overage"],
  ["acc-002", "Vertex Grid — enterprise true-up + Replay attach", "Negotiation", 240000, 20, "On track", "Legal redlines back from customer"],
  ["acc-004", "Harborline Pay — renewal + Crons attach", "Business Validation", 910000, 91, "At risk", "Resolve P1 CS-1042 before exec sync"],
  ["acc-007", "Forgeline Robotics — post-Series B upgrade", "Stage 2 — Qualified / Discovery", 88000, 45, "On track", "Send command-of-the-message recap"],
  ["acc-005", "Nimbus Games — Session Replay expansion", "POC", 150000, 60, "On track", "POC readout scheduled — prep deck"],
  ["acc-008", "Pulsewire Media — microsite team new workspace", "Technical Validation", 42000, 33, "Needs push", "Champion re-engagement before validation call"]
];
const opportunities = curatedOpps.map(([accountId, name, stage, amount, closeDays, status, nextStep], i) => ({
  id: `opp-${String(i + 1).padStart(3, "0")}`,
  accountId, name, stage, amount,
  closeDate: new Date(NOW + closeDays * DAY).toISOString().slice(0, 10),
  status, nextStep
}));
let oppN = opportunities.length;
for (const account of accounts.slice(8, 48)) {
  if (!chance(0.45)) continue;
  oppN += 1;
  opportunities.push({
    id: `opp-${String(oppN).padStart(3, "0")}`,
    accountId: account.id,
    name: `${account.name} — ${pick(["expansion", "renewal", "new workspace", "tier upgrade", "multi-year commit"])}`,
    stage: pick(stages),
    amount: int(15, 400) * 1000,
    closeDate: new Date(NOW + int(10, 180) * DAY).toISOString().slice(0, 10),
    status: pick(oppStatuses),
    nextStep: pick(nextSteps)
  });
}

// ---------------------------------------------------------------- utilization
const moduleNames = ["Errors", "Transactions", "Spans", "SessionReplay", "Crons"];
const utilization = [];
for (const account of accounts.slice(0, 40)) {
  for (const module of moduleNames) {
    let base = int(8, 96);
    if (account.id === "acc-003" && module === "Spans") base = 104;
    if (account.id === "acc-002" && module === "Errors") base = 97;
    if (account.id === "acc-004" && module === "Transactions") base = 89;
    const drift = () => Math.max(2, Math.min(130, base + int(-18, 12)));
    utilization.push({
      accountId: account.id,
      module,
      quotaUsagePct: base,
      trend30: base,
      trend60: drift(),
      trend90: drift(),
      seatsActivePct: int(20, 100)
    });
  }
}

// ---------------------------------------------------------------- cases
const caseSubjects = [
  "SDK symbolication failing on release builds", "Checkout instrumentation dropping spans",
  "SSO login loop for new members", "Webhook deliveries delayed >10min",
  "Replay recordings missing network tab", "Quota alert emails not arriving",
  "Cron monitor false-positive alerts", "Dashboard widget timeout on large orgs",
  "Rate-limit 429s during deploy spikes", "Source maps upload intermittently 502s"
];
const escalationOwners = ["T1 Queue", "T2 — Runtime", "T2 — Ingest", "Exec Escalation — VP Support"];
const curatedCases = [
  ["CS-1042", "acc-004", "Checkout instrumentation dropping spans", "P1", 4, "Exec Escalation — VP Support"],
  ["CS-1055", "acc-001", "SDK symbolication failing on release builds", "P2", 2, "T2 — Runtime"],
  ["CS-1058", "acc-001", "Quota alert emails not arriving", "P3", 0, "T1 Queue"],
  ["CS-1049", "acc-002", "Rate-limit 429s during deploy spikes", "P2", 1, "T2 — Ingest"]
];
const cases = curatedCases.map(([id, accountId, subject, priority, daysPastSla, escalationOwner]) => ({
  id, accountId, subject, priority, daysPastSla, escalationOwner,
  status: daysPastSla > 0 ? "Escalated" : "Open"
}));
let caseN = 1060;
for (const account of accounts.slice(4, 40)) {
  if (!chance(0.4)) continue;
  caseN += int(1, 4);
  const priority = pick(["P1", "P2", "P3", "P4"]);
  const daysPastSla = priority === "P1" ? int(0, 5) : priority === "P2" ? int(0, 3) : 0;
  cases.push({
    id: `CS-${caseN}`,
    accountId: account.id,
    subject: pick(caseSubjects),
    priority,
    daysPastSla,
    escalationOwner: daysPastSla > 2 ? "Exec Escalation — VP Support" : pick(escalationOwners),
    status: daysPastSla > 0 ? "Escalated" : pick(["Open", "Open", "Pending Customer"])
  });
}

// ---------------------------------------------------------------- slack messages
const slackAuthors = ["Jordan Reyes (AE)", "Sasha Bloom (SE)", "Priya Natarajan (CSM)"];
const customerMsgs = [
  "Thanks for the quick turnaround on the quota question 🙏",
  "Our platform team wants to see the span sampling config before we scale it up.",
  "Can we get 30 min this week to walk through the readout?",
  "Heads up — big launch on our side next Tuesday, expect traffic spike.",
  "The dashboard the SE built is exactly what our VP asked for.",
  "Still seeing the symbolication issue on the latest release build.",
  "Who owns the security questionnaire on your side?",
  "We got budget sign-off for the expansion 🎉, procurement is next."
];
const internalMsgs = [
  "Shared the POC success criteria doc — link in Notion.",
  "Usage rollup from this morning attached, spans trending +9% WoW.",
  "Booked the exec sync for Thursday, invite sent.",
  "Flagging: support case just got bumped to P1, looping CSM.",
  "Recap posted after the discovery call — MEDDPIC gaps noted."
];
const slackMessages = [];
for (const account of accounts.filter((a) => a.slackChannelId)) {
  const msgs = [];
  const count = int(4, 8);
  for (let m = 0; m < count; m++) {
    const fromCustomer = chance(0.55);
    const contact = contacts.find((c) => c.accountId === account.id);
    msgs.push({
      author: fromCustomer ? `${contact ? contact.name : "Customer Engineer"} (${account.name})` : pick(slackAuthors),
      timestamp: isoDaysAgo(int(0, 14)),
      text: fromCustomer ? pick(customerMsgs) : pick(internalMsgs)
    });
  }
  msgs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  slackMessages.push({ channelId: account.slackChannelId, accountId: account.id, messages: msgs });
}

// ---------------------------------------------------------------- activity timeline
const timelineTemplates = [
  ["email", "Marketing", "Champion opened the launch-week nurture email"],
  ["email", "Sales", "AE sent command-of-the-message recap"],
  ["call", "Sales", "Discovery call — value framework walkthrough"],
  ["meeting", "Sales", "Mutual action plan review with economic buyer"],
  ["meeting", "SE", "Technical deep-dive on tracing setup"],
  ["case", "Support", "Support case opened via in-app widget"],
  ["case", "Support", "Case escalated to T2 after repro confirmed"],
  ["usage", "Product", "Usage spike: error volume +40% day-over-day"],
  ["usage", "Product", "New project created — first spans received"],
  ["marketing", "Marketing", "Registered two engineers for the observability webinar"],
  ["slack", "Slack", "Deal-room thread active: POC scoping questions"],
  ["notion", "Notion", "POC doc updated in Notion (not synced to Salesforce)"]
];
const actors = [...slackAuthors, "Marketo Automation", "BigQuery Rollup", "Support Bot", "Customer team"];
const activityTimeline = [];
for (const account of accounts.slice(0, 40)) {
  const events = [];
  const count = int(6, 10);
  for (let e = 0; e < count; e++) {
    const [type, tag, description] = pick(timelineTemplates);
    events.push({ type, tag, timestamp: isoDaysAgo(int(0, 45)), description, actor: pick(actors) });
  }
  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  activityTimeline.push({ accountId: account.id, events });
}

// ---------------------------------------------------------------- POCs
const pocStages = ["0", "1", "2", "POC", "Validation", "Close"];
const pocs = [];
let pocN = 0;
for (const opp of opportunities.filter((o) => ["POC", "Technical Validation", "Business Validation", "Negotiation"].includes(o.stage)).slice(0, 15)) {
  pocN += 1;
  pocs.push({
    id: `poc-${String(pocN).padStart(3, "0")}`,
    accountId: opp.accountId,
    opportunityId: opp.id,
    stage: pick(pocStages),
    meddpicNotes: "M: exec dashboard visibility · E: VP Eng (confirmed) · D: security review + procurement · D: Dec board planning · P: checkout reliability · I: current tool sunset · C: staff eng champion",
    notionDocUrl: `https://notion.example/sentry-pocs/${opp.id}-success-criteria`
  });
}

// ---------------------------------------------------------------- write files
const files = {
  "accounts.json": accounts,
  "contacts.json": contacts,
  "leads.json": leads,
  "signals.json": signals.sort((a, b) => b.priority - a.priority),
  "opportunities.json": opportunities,
  "utilization.json": utilization,
  "cases.json": cases,
  "slackMessages.json": slackMessages,
  "activityTimeline.json": activityTimeline,
  "pocs.json": pocs
};
mkdirSync(DATA_DIR, { recursive: true });
for (const [file, payload] of Object.entries(files)) {
  writeFileSync(join(DATA_DIR, file), JSON.stringify(payload, null, 2) + "\n");
  console.log(`wrote data/${file} (${payload.length} records)`);
}
console.log("\nAll fixtures are synthetic demo data — regenerate any time with: npm run seed");
