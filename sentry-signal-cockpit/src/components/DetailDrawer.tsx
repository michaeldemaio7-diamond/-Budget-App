import { useAccounts, usePocs, useSlackChannel, useTimeline, fmtMoney, timeAgo } from "../lib/api";
import type { DrawerTarget } from "../lib/types";
import { CategoryBadge, SourceTag, StatusPill, PriorityPill } from "./Badges";

const timelineIcons: Record<string, string> = {
  email: "✉", call: "☎", meeting: "▣", case: "◎", usage: "▦", marketing: "✦", slack: "#", notion: "N"
};

function SlackPanel({ channelId, accountName }: { channelId: string | null; accountName: string }) {
  const { data: channel, isLoading } = useSlackChannel(channelId);
  return (
    <section>
      <div className="section-title mb-2">Slack channel</div>
      {/* Light "paper" surface so embedded chat doesn't look muddy on black */}
      <div className="rounded-card bg-paper p-3 text-ink-900 shadow-glass">
        {!channelId ? (
          <p className="py-6 text-center text-xs text-ink-600">
            No Slack channel linked to this account.
          </p>
        ) : isLoading || !channel ? (
          <p className="py-6 text-center text-xs text-ink-600">Loading channel…</p>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-1.5 border-b border-ink-900/10 pb-2 text-xs font-bold">
              <span className="text-violet-brand">#</span>
              deal-{accountName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
              <span className="ml-auto font-normal text-ink-600">mock embed</span>
            </div>
            <div className="flex max-h-56 flex-col gap-2.5 overflow-y-auto">
              {channel.messages.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-deep text-[9px] font-bold text-white">
                    {m.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[11px]">
                      <span className="font-bold">{m.author}</span>{" "}
                      <span className="text-ink-600">{timeAgo(m.timestamp)}</span>
                    </div>
                    <p className="text-xs leading-snug">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function ActivityTimeline({ accountId }: { accountId: string }) {
  const { data: timeline, isLoading } = useTimeline(accountId);
  return (
    <section>
      <div className="section-title mb-2">Activity feed</div>
      {isLoading || !timeline ? (
        <p className="py-4 text-xs text-paper/40">Merging touches across sources…</p>
      ) : timeline.events.length === 0 ? (
        <p className="py-4 text-xs text-paper/40">
          No recorded activity — check the account's external Slack channel or Notion docs (the classic visibility gap).
        </p>
      ) : (
        <ol className="relative flex flex-col gap-3 border-l border-hairline pl-4">
          {timeline.events.map((e, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[23px] grid h-4 w-4 place-items-center rounded-full bg-ink-700 text-[8px] text-violet-soft">
                {timelineIcons[e.type] ?? "•"}
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="pill border border-hairline bg-ink-800 text-paper/60">{e.tag}</span>
                <span className="text-paper/35">{timeAgo(e.timestamp)}</span>
              </div>
              <p className="mt-0.5 text-xs text-paper/80">{e.description}</p>
              <p className="text-[11px] text-paper/40">{e.actor}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

interface Props {
  target: DrawerTarget;
  onClose: () => void;
}

export default function DetailDrawer({ target, onClose }: Props) {
  const { data: accounts } = useAccounts();
  const { data: pocs } = usePocs();

  const accountId =
    target.kind === "signal" ? target.signal.accountId
    : target.kind === "opportunity" ? target.opportunity.accountId
    : target.kind === "case" ? target.supportCase.accountId
    : target.accountId;

  const account = accounts?.find((a) => a.id === accountId);
  const poc =
    target.kind === "opportunity"
      ? pocs?.find((p) => p.opportunityId === target.opportunity.id)
      : pocs?.find((p) => p.accountId === accountId);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto border-l border-hairline bg-ink-900 shadow-drawer">
        <header className="sticky top-0 z-10 border-b border-hairline bg-ink-900/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-paper/40">
                {target.kind === "signal" ? "Signal detail" : target.kind === "opportunity" ? "Opportunity detail" : target.kind === "case" ? "Case detail" : "Account detail"}
              </div>
              <h2 className="mt-0.5 text-base font-bold leading-snug">{account?.name ?? accountId}</h2>
              {account && (
                <p className="mt-0.5 text-[11px] text-paper/45">
                  {account.planTier} · {fmtMoney(account.arr)} ARR · {account.industry} · {account.employeeBand} employees · AE {account.aeOwner}
                </p>
              )}
            </div>
            <button onClick={onClose} className="rounded-card border border-hairline px-2 py-1 text-xs text-paper/60 transition hover:text-paper">
              Esc ✕
            </button>
          </div>

          {target.kind === "signal" && (
            <div className="mt-3 rounded-card border border-violet-brand/30 bg-violet-brand/10 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={target.signal.category} />
                <SourceTag source={target.signal.source} />
              </div>
              <p className="mt-2 text-sm font-medium">{target.signal.headline}</p>
              <p className="mt-1 text-xs leading-relaxed text-paper/60">{target.signal.detail}</p>
              <button className="mt-2.5 rounded-card bg-violet-brand px-3 py-1.5 text-xs font-semibold text-white">
                {target.signal.suggestedAction} →
              </button>
            </div>
          )}

          {target.kind === "opportunity" && (
            <div className="mt-3 rounded-card border border-violet-brand/30 bg-violet-brand/10 p-3">
              <div className="flex items-center gap-2">
                <StatusPill status={target.opportunity.status} />
                <span className="text-xs text-paper/60">{target.opportunity.stage}</span>
                <span className="ml-auto text-sm font-bold text-violet-soft">{fmtMoney(target.opportunity.amount)}</span>
              </div>
              <p className="mt-2 text-sm font-medium">{target.opportunity.name}</p>
              <p className="mt-1 text-xs text-paper/60">
                Close {target.opportunity.closeDate} · Next step: {target.opportunity.nextStep}
              </p>
            </div>
          )}

          {target.kind === "case" && (
            <div className="mt-3 rounded-card border border-flare-pink/30 bg-flare-pink/10 p-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-violet-soft">{target.supportCase.id}</span>
                <PriorityPill priority={target.supportCase.priority} />
                {target.supportCase.daysPastSla > 0 && (
                  <span className="pill border border-flare-pink/50 bg-flare-pink/20 text-flare-pink">
                    {target.supportCase.daysPastSla}d past SLA
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium">{target.supportCase.subject}</p>
              <p className="mt-1 text-xs text-paper/60">Escalation owner: {target.supportCase.escalationOwner}</p>
            </div>
          )}
        </header>

        <div className="flex flex-col gap-6 px-5 py-5">
          <SlackPanel channelId={account?.slackChannelId ?? null} accountName={account?.name ?? "account"} />

          {poc && (
            <section className="rounded-card border border-hairline bg-ink-850 p-3">
              <div className="section-title mb-1.5">POC · lives in Notion today</div>
              <p className="text-xs leading-relaxed text-paper/60">{poc.meddpicNotes}</p>
              <a
                href={poc.notionDocUrl}
                onClick={(e) => e.preventDefault()}
                className="mt-2 inline-block text-xs font-semibold text-violet-soft hover:text-violet-brand"
                title="Mock link — real POC docs live in Notion, not Salesforce"
              >
                Open success-criteria doc in Notion ↗ <span className="text-paper/35">(mock link)</span>
              </a>
            </section>
          )}

          <ActivityTimeline accountId={accountId} />
        </div>
      </aside>
    </>
  );
}
