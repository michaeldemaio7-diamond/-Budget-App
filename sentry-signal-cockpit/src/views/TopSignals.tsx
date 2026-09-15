import { useState } from "react";
import { useAccounts, useSignals, timeAgo } from "../lib/api";
import type { DrawerTarget, Signal, SignalCategory } from "../lib/types";
import { CategoryBadge, SourceTag, LoadingState, EmptyState } from "../components/Badges";

const filterChips: { key: string; label: string; categories: SignalCategory[] | null }[] = [
  { key: "all", label: "All", categories: null },
  { key: "upsell", label: "Upsell", categories: ["Upsell"] },
  { key: "engagement", label: "Engagement", categories: ["EngagementGap"] },
  { key: "risk", label: "Risk", categories: ["AccountIssue"] },
  { key: "community", label: "Community", categories: ["Community"] },
  { key: "intent", label: "Intent", categories: ["Funding", "AEOIntent"] }
];

interface Props {
  selectedAccountId: string | null;
  openDrawer: (t: DrawerTarget) => void;
}

export default function TopSignals({ selectedAccountId, openDrawer }: Props) {
  const [filter, setFilter] = useState("all");
  const { data: signals, isLoading } = useSignals();
  const { data: accounts } = useAccounts();

  if (isLoading || !signals || !accounts) return <LoadingState label="Ranking cross-source signals…" />;

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;
  const chip = filterChips.find((c) => c.key === filter)!;
  const rows = signals
    .filter((s) => !chip.categories || chip.categories.includes(s.category))
    .filter((s) => !selectedAccountId || s.accountId === selectedAccountId)
    .slice(0, 30);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Top Signals</h1>
        <p className="mt-0.5 text-xs text-paper/40">
          Ranked cross-source feed — product usage, Slack, Discord, support, marketing, funding, and AEO/AI-search intent in one place.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterChips.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`pill transition ${
              filter === c.key
                ? "bg-violet-brand text-white"
                : "border border-hairline bg-ink-800 text-paper/60 hover:text-paper"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No signals match this filter"
          hint="Try widening the filter or switching back to all accounts — the feed re-ranks as new source data lands."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((signal: Signal) => (
            <button
              key={signal.id}
              onClick={() => openDrawer({ kind: "signal", signal })}
              className="card group px-4 py-3.5 text-left transition hover:border-violet-brand/50"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{accountName(signal.accountId)}</span>
                <CategoryBadge category={signal.category} />
                {signal.selfReportedOnly && (
                  <span className="pill border border-amber-300/40 bg-amber-300/10 text-amber-200">
                    Self-reported only — no tracking pixel
                  </span>
                )}
                <span className="ml-auto text-[11px] text-paper/35">{timeAgo(signal.createdAt)}</span>
              </div>
              <p className="mt-1.5 text-sm text-paper/85">{signal.headline}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <span
                  className="rounded-card bg-violet-brand/90 px-3 py-1 text-xs font-semibold text-white transition group-hover:bg-violet-brand"
                >
                  {signal.suggestedAction} →
                </span>
                <SourceTag source={signal.source} />
                <span className="ml-auto text-[11px] text-paper/30">rank {signal.priority}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
