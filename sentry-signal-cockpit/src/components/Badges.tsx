import type { SignalCategory, SignalSource } from "../lib/types";

export const categoryMeta: Record<SignalCategory, { label: string; className: string }> = {
  Upsell: { label: "Upsell", className: "bg-violet-brand/20 text-violet-soft border border-violet-brand/40" },
  EngagementGap: { label: "Engagement Gap", className: "bg-flare-orange/15 text-flare-orange border border-flare-orange/40" },
  AccountIssue: { label: "Account Issue", className: "bg-flare-pink/15 text-flare-pink border border-flare-pink/40" },
  Community: { label: "Community", className: "bg-emerald-400/10 text-emerald-300 border border-emerald-400/30" },
  Funding: { label: "Funding", className: "bg-sky-400/10 text-sky-300 border border-sky-400/30" },
  AEOIntent: { label: "AEO Intent", className: "bg-amber-300/10 text-amber-200 border border-amber-300/30" }
};

export function CategoryBadge({ category }: { category: SignalCategory }) {
  const meta = categoryMeta[category];
  return <span className={`pill ${meta.className}`}>{meta.label}</span>;
}

const sourceMeta: Record<SignalSource, { icon: string; label: string }> = {
  "Product-BigQuery": { icon: "▦", label: "Product · BigQuery" },
  Slack: { icon: "#", label: "Slack" },
  Discord: { icon: "◗", label: "Discord" },
  SupportCase: { icon: "◎", label: "Support Case" },
  Marketing: { icon: "✉", label: "Marketing" },
  ZoomInfo: { icon: "◆", label: "ZoomInfo Funding" },
  AEOSurvey: { icon: "✦", label: "AEO / AI-search survey" }
};

export function SourceTag({ source }: { source: SignalSource }) {
  const meta = sourceMeta[source];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] text-paper/50"
      title={meta.label}
    >
      <span className="grid h-5 w-5 place-items-center rounded bg-ink-700 text-[10px] text-violet-soft">
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}

export function StatusPill({ status }: { status: "On track" | "Needs push" | "At risk" }) {
  const cls =
    status === "On track"
      ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/30"
      : status === "Needs push"
        ? "bg-flare-orange/15 text-flare-orange border border-flare-orange/40"
        : "bg-flare-pink/15 text-flare-pink border border-flare-pink/40";
  return <span className={`pill ${cls}`}>{status}</span>;
}

export function PriorityPill({ priority }: { priority: "P1" | "P2" | "P3" | "P4" }) {
  const cls =
    priority === "P1"
      ? "bg-flare-pink/20 text-flare-pink border border-flare-pink/50"
      : priority === "P2"
        ? "bg-flare-orange/15 text-flare-orange border border-flare-orange/40"
        : "bg-ink-700 text-paper/60 border border-hairline";
  return <span className={`pill ${cls}`}>{priority}</span>;
}

export function TrendArrow({ now, prev }: { now: number; prev: number }) {
  const delta = now - prev;
  if (Math.abs(delta) < 2) return <span className="text-paper/40 text-xs">→ flat</span>;
  return delta > 0 ? (
    <span className="text-flare-orange text-xs">▲ +{delta}pt</span>
  ) : (
    <span className="text-emerald-300 text-xs">▼ {delta}pt</span>
  );
}

export function LoadingState({ label = "Loading signals…" }: { label?: string }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-16 text-paper/50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-brand border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 py-16 text-center">
      <span className="text-2xl text-violet-deep">◍</span>
      <p className="text-sm font-medium text-paper/70">{title}</p>
      {hint && <p className="max-w-sm text-xs text-paper/40">{hint}</p>}
    </div>
  );
}
