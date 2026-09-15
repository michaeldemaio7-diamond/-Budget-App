import type { Account } from "../lib/types";

export type ViewKey = "signals" | "opportunities" | "utilization" | "cases";

const navItems: { key: ViewKey; label: string; icon: string }[] = [
  { key: "signals", label: "Top Signals", icon: "◉" },
  { key: "opportunities", label: "Top Opportunities", icon: "◆" },
  { key: "utilization", label: "Utilization", icon: "▥" },
  { key: "cases", label: "Cases", icon: "◎" }
];

interface Props {
  view: ViewKey;
  onNavigate: (v: ViewKey) => void;
  accounts: Account[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
}

export default function Sidebar({ view, onNavigate, accounts, selectedAccountId, onSelectAccount }: Props) {
  // account switcher shows a curated shortlist, like a rep's pinned book of business
  const shortlist = accounts.slice(0, 10);
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-hairline bg-ink-950 max-lg:w-16">
      <div className="flex items-center gap-2.5 px-4 py-5 max-lg:justify-center max-lg:px-0">
        {/* Placeholder logo mark — swap for Sentry's official asset (see README) */}
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-violet-brand font-bold text-white">
          S
        </div>
        <div className="max-lg:hidden">
          <div className="text-sm font-bold leading-tight">Signal Cockpit</div>
          <div className="text-[10px] uppercase tracking-widest text-paper/40">Headless 360 · Demo</div>
        </div>
      </div>

      <nav className="mt-2 flex flex-col gap-0.5 px-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`flex items-center gap-2.5 rounded-card px-3 py-2 text-left text-sm transition max-lg:justify-center max-lg:px-0 ${
              view === item.key
                ? "bg-violet-brand/15 font-semibold text-violet-soft"
                : "text-paper/60 hover:bg-ink-800 hover:text-paper"
            }`}
            title={item.label}
          >
            <span className="text-xs">{item.icon}</span>
            <span className="max-lg:hidden">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-6 px-4 max-lg:hidden">
        <div className="section-title mb-2">Account focus</div>
        <select
          value={selectedAccountId ?? ""}
          onChange={(e) => onSelectAccount(e.target.value || null)}
          className="w-full rounded-card border border-hairline bg-ink-800 px-2 py-1.5 text-xs text-paper focus:border-violet-brand focus:outline-none"
        >
          <option value="">All accounts</option>
          {shortlist.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-auto px-4 py-4 text-[10px] leading-relaxed text-paper/30 max-lg:hidden">
        Demo prototype · all data synthetic.
        <br />
        Not connected to Salesforce, Data&nbsp;360, Slack, or any live system.
        <div className="mt-3 border-t border-hairline pt-3 text-paper/25">
          Built by Michael DeMaio · scaffolded with Claude Code
        </div>
      </div>
    </aside>
  );
}
