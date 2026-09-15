/**
 * Mock API for the Sentry Signal Cockpit DEMO.
 * Serves local JSON fixtures only — no external services, credentials, or
 * network calls. In production mode it also serves the built Vite app.
 *
 * The route layer is deliberately thin so a real Data 360 / Salesforce /
 * Slack / agent backend can be swapped in behind the same endpoints
 * (see ARCHITECTURE.md).
 */
import express from "express";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DATA = join(ROOT, "data");
const load = (name) => JSON.parse(readFileSync(join(DATA, `${name}.json`), "utf8"));

const app = express();
app.use(express.json());

const collections = [
  "accounts", "contacts", "leads", "signals", "opportunities",
  "utilization", "cases", "pocs"
];
for (const name of collections) {
  app.get(`/api/${name}`, (req, res) => {
    let rows = load(name);
    const { accountId } = req.query;
    if (accountId && rows.length && rows[0].accountId !== undefined) {
      rows = rows.filter((r) => r.accountId === accountId);
    }
    res.json(rows);
  });
}

app.get("/api/slack/:channelId", (req, res) => {
  const channel = load("slackMessages").find((c) => c.channelId === req.params.channelId);
  res.json(channel ?? null);
});

app.get("/api/timeline/:accountId", (req, res) => {
  const timeline = load("activityTimeline").find((t) => t.accountId === req.params.accountId);
  res.json(timeline ?? { accountId: req.params.accountId, events: [] });
});

/**
 * Ask-anything agent — STUB. Canned keyword-matched answers so the demo is
 * fully offline. Replace the body of this handler with a call to a real
 * LLM/agent endpoint later; the request/response shape is already what a
 * real integration would use: { question, accountId? } → { answer }.
 */
app.post("/api/agent", (req, res) => {
  const question = String(req.body?.question ?? "").toLowerCase();
  const accountId = req.body?.accountId ?? null;
  const accounts = load("accounts");
  const account = accounts.find((a) => a.id === accountId);
  const name = account?.name ?? "this account";

  let answer;
  if (question.includes("flag") || question.includes("why")) {
    const signal = load("signals").find((s) => s.accountId === accountId) ?? load("signals")[0];
    answer = `This was flagged because: ${signal.headline}. ${signal.detail} Suggested play: ${signal.suggestedAction}.`;
  } else if (question.includes("last") || question.includes("discussed") || question.includes("recent")) {
    const timeline = load("activityTimeline").find((t) => t.accountId === (accountId ?? "acc-001"));
    const ev = timeline?.events?.[0];
    answer = ev
      ? `The most recent touch with ${name} was ${new Date(ev.timestamp).toLocaleDateString()}: ${ev.description} (${ev.actor}).`
      : `I don't have any recorded activity for ${name} yet — its real activity may live in an external Slack channel or Notion doc that isn't synced.`;
  } else if (question.includes("draft") || question.includes("follow")) {
    answer = `Draft follow-up for ${name}:\n\n"Hi — noticed your span usage is pacing well ahead of quota this cycle. Rather than let overages stack up, want to grab 20 minutes this week to look at a plan that fits the new volume? I can bring the usage breakdown."\n\n(Edit freely — this is a canned demo draft.)`;
  } else if (question.includes("poc")) {
    const poc = load("pocs").find((p) => p.accountId === accountId) ?? load("pocs")[0];
    answer = `The active POC (${poc.id}) is in stage "${poc.stage}". MEDDPIC notes: ${poc.meddpicNotes}. Full success-criteria doc lives in Notion: ${poc.notionDocUrl} (POC docs are not in Salesforce today).`;
  } else {
    answer = `I'm a stubbed demo agent with canned answers. Try: "Why is this flagged?", "What's the last thing we discussed with this account?", "Draft a follow-up message", or "What's the POC status?" — in production this endpoint would call a real LLM/agent over the Data 360 golden record.`;
  }
  res.json({ answer });
});

// Serve the built SPA in production (Railway runs `npm run build` then `npm start`).
const DIST = join(ROOT, "dist");
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) return res.status(404).json({ error: "not found" });
    res.sendFile(join(DIST, "index.html"));
  });
}

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`Signal Cockpit mock API on :${port}`));
