import { useAccounts, useCases } from "../lib/api";
import type { DrawerTarget } from "../lib/types";
import { PriorityPill, LoadingState, EmptyState } from "../components/Badges";

interface Props {
  selectedAccountId: string | null;
  openDrawer: (t: DrawerTarget) => void;
}

export default function Cases({ selectedAccountId, openDrawer }: Props) {
  const { data: cases, isLoading } = useCases();
  const { data: accounts } = useAccounts();

  if (isLoading || !cases || !accounts) return <LoadingState label="Pulling support queue…" />;

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;
  const rows = cases
    .filter((c) => !selectedAccountId || c.accountId === selectedAccountId)
    .sort((a, b) => b.daysPastSla - a.daysPastSla || a.priority.localeCompare(b.priority));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Support Cases</h1>
        <p className="mt-0.5 text-xs text-paper/40">
          Open queue ordered by SLA breach — support friction is an account signal, not a separate silo.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No open cases for this account" hint="A quiet queue is a signal too — pair it with usage trends before assuming health." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wider text-paper/40">
                <th className="px-4 py-3 font-semibold">Case</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Account</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 text-right font-semibold">Days past SLA</th>
                <th className="px-4 py-3 font-semibold">Escalation owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openDrawer({ kind: "case", supportCase: c })}
                  className="cursor-pointer border-b border-hairline/60 transition last:border-0 hover:bg-ink-800/60"
                >
                  <td className="px-4 py-3 font-mono text-xs text-violet-soft">{c.id}</td>
                  <td className="px-4 py-3">{c.subject}</td>
                  <td className="px-4 py-3 text-xs text-paper/60">{accountName(c.accountId)}</td>
                  <td className="px-4 py-3"><PriorityPill priority={c.priority} /></td>
                  <td className={`px-4 py-3 text-right font-semibold ${c.daysPastSla > 0 ? "text-flare-pink" : "text-paper/50"}`}>
                    {c.daysPastSla > 0 ? `+${c.daysPastSla}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-paper/60">{c.escalationOwner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
