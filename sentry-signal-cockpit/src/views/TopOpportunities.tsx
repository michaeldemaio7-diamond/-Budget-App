import { useState } from "react";
import { useAccounts, useOpportunities, fmtMoney } from "../lib/api";
import type { DrawerTarget } from "../lib/types";
import { StatusPill, LoadingState, EmptyState } from "../components/Badges";

interface Props {
  selectedAccountId: string | null;
  openDrawer: (t: DrawerTarget) => void;
}

export default function TopOpportunities({ selectedAccountId, openDrawer }: Props) {
  const [sortBy, setSortBy] = useState<"amount" | "closeDate">("amount");
  const { data: opps, isLoading } = useOpportunities();
  const { data: accounts } = useAccounts();

  if (isLoading || !opps || !accounts) return <LoadingState label="Loading open pipeline…" />;

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;
  const rows = opps
    .filter((o) => !selectedAccountId || o.accountId === selectedAccountId)
    .sort((a, b) =>
      sortBy === "amount" ? b.amount - a.amount : a.closeDate.localeCompare(b.closeDate)
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Top Opportunities</h1>
          <p className="mt-0.5 text-xs text-paper/40">
            Open pipeline bridging Salesforce stages with the Notion-side POC reality.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-paper/50">
          Sort by
          {(["amount", "closeDate"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`pill transition ${
                sortBy === key
                  ? "bg-violet-brand text-white"
                  : "border border-hairline bg-ink-800 text-paper/60 hover:text-paper"
              }`}
            >
              {key === "amount" ? "Amount" : "Close date"}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No open opportunities for this account" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wider text-paper/40">
                <th className="px-4 py-3 font-semibold">Opportunity</th>
                <th className="px-4 py-3 font-semibold">Stage</th>
                <th className="px-4 py-3 font-semibold">Close</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((opp) => (
                <tr
                  key={opp.id}
                  onClick={() => openDrawer({ kind: "opportunity", opportunity: opp })}
                  className="cursor-pointer border-b border-hairline/60 transition last:border-0 hover:bg-ink-800/60"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{opp.name}</div>
                    <div className="mt-0.5 text-xs text-paper/45">
                      {accountName(opp.accountId)} · Next: {opp.nextStep}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-paper/60">{opp.stage}</td>
                  <td className="px-4 py-3 text-xs text-paper/60">{opp.closeDate}</td>
                  <td className="px-4 py-3 text-right font-semibold text-violet-soft">
                    {fmtMoney(opp.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={opp.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
