export default function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-hairline bg-ink-900/95 px-5 backdrop-blur">
      <div className="relative w-full max-w-md">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-paper/30">
          ⌕
        </span>
        <input
          placeholder="Search accounts, signals, opps… (demo stub)"
          className="w-full rounded-card border border-hairline bg-ink-800 py-1.5 pl-8 pr-3 text-sm text-paper placeholder:text-paper/30 focus:border-violet-brand focus:outline-none"
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        />
      </div>
      <div className="ml-auto flex items-center gap-4">
        <button className="relative text-paper/50 transition hover:text-paper" title="Notifications (mock)">
          🔔
          <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-flare-pink px-1 text-[9px] font-bold text-white">
            7
          </span>
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-violet-deep text-xs font-bold text-white">
            JR
          </div>
          <div className="max-md:hidden">
            <div className="text-xs font-semibold leading-tight">Jordan Reyes</div>
            <div className="text-[10px] text-paper/40">Core AE · Demo rep</div>
          </div>
        </div>
      </div>
    </header>
  );
}
