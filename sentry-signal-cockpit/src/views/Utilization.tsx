import { useMemo, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useAccounts, useUtilization } from "../lib/api";
import type { DrawerTarget, UtilizationRow } from "../lib/types";
import { LoadingState, EmptyState, TrendArrow } from "../components/Badges";

interface Props {
  selectedAccountId: string | null;
  openDrawer: (t: DrawerTarget) => void;
}

function barColor(pct: number) {
  if (pct >= 100) return "bg-flare-pink";
  if (pct >= 85) return "bg-flare-orange";
  return "bg-violet-brand";
}

function Sparkline({ row }: { row: UtilizationRow }) {
  // 90d → 30d, oldest first, so the line reads left-to-right in time
  const data = [
    { v: row.trend90 },
    { v: row.trend60 },
    { v: row.trend30 }
  ];
  return (
    <div className="h-6 w-16">
      <ResponsiveContainer>
        <LineChart data={data}>
          <Line dataKey="v" stroke="#9e86ff" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Utilization({ selectedAccountId, openDrawer }: Props) {
  const [mode, setMode] = useState<"quota" | "seats">("quota");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: rows, isLoading } = useUtilization();
  const { data: accounts } = useAccounts();

  const ranked = useMemo(() => {
    if (!rows) return [];
    const byAccount = new Map<string, UtilizationRow[]>();
    for (const r of rows) {
      if (selectedAccountId && r.accountId !== selectedAccountId) continue;
      byAccount.set(r.accountId, [...(byAccount.get(r.accountId) ?? []), r]);
    }
    return [...byAccount.entries()]
      .map(([accountId, modules]) => ({
        accountId,
        modules,
        headline:
          mode === "quota"
            ? Math.max(...modules.map((m) => m.quotaUsagePct))
            : Math.round(modules.reduce((s, m) => s + m.seatsActivePct, 0) / modules.length)
      }))
      .sort((a, b) => b.headline - a.headline);
  }, [rows, selectedAccountId, mode]);

  if (isLoading || !rows || !accounts) return <LoadingState label="Crunching quota consumption…" />;

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Customer Utilization</h1>
          <p className="mt-0.5 text-xs text-paper/40">
            Stack-ranked by {mode === "quota" ? "peak quota consumption" : "seat activity"} — expand a row for the module breakdown.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          {(
            [
              ["quota", "% of quota consumed"],
              ["seats", "Seats active"]
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`pill transition ${
                mode === key
                  ? "bg-violet-brand text-white"
                  : "border border-hairline bg-ink-800 text-paper/60 hover:text-paper"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {ranked.length === 0 ? (
        <EmptyState title="No utilization data for this account" hint="Only accounts with active projects report quota consumption in the demo dataset." />
      ) : (
        <div className="card divide-y divide-hairline/60">
          {ranked.slice(0, 25).map(({ accountId, modules, headline }) => {
            const isOpen = expanded === accountId;
            return (
              <div key={accountId}>
                <button
                  onClick={() => setExpanded(isOpen ? null : accountId)}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-ink-800/60"
                >
                  <span className="w-44 shrink-0 truncate text-sm font-medium">{accountName(accountId)}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className={`h-full rounded-full ${barColor(headline)}`}
                      style={{ width: `${Math.min(headline, 100)}%` }}
                    />
                  </div>
                  <span className={`w-14 shrink-0 text-right text-sm font-semibold ${headline >= 100 ? "text-flare-pink" : "text-paper/80"}`}>
                    {headline}%
                  </span>
                  <span className="w-4 text-xs text-paper/40">{isOpen ? "▾" : "▸"}</span>
                </button>

                {isOpen && (
                  <div className="bg-ink-950/50 px-4 pb-3 pt-1">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider text-paper/35">
                          <th className="py-1.5 font-semibold">Module</th>
                          <th className="py-1.5 font-semibold">{mode === "quota" ? "Quota used" : "Seats active"}</th>
                          <th className="py-1.5 font-semibold">30/60/90d</th>
                          <th className="py-1.5 font-semibold">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modules.map((m) => {
                          const val = mode === "quota" ? m.quotaUsagePct : m.seatsActivePct;
                          return (
                            <tr key={m.module} className="border-t border-hairline/40">
                              <td className="py-1.5 text-paper/70">{m.module === "SessionReplay" ? "Session Replay" : m.module}</td>
                              <td className={`py-1.5 font-semibold ${val >= 100 ? "text-flare-pink" : "text-paper/85"}`}>{val}%</td>
                              <td className="py-1.5"><Sparkline row={m} /></td>
                              <td className="py-1.5"><TrendArrow now={m.trend30} prev={m.trend60} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <button
                      onClick={() => openDrawer({ kind: "account", accountId })}
                      className="mt-2 text-xs font-semibold text-violet-soft hover:text-violet-brand"
                    >
                      Open account detail →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
