import { useEffect, useState } from "react";
import Sidebar, { type ViewKey } from "./components/Sidebar";
import TopBar from "./components/TopBar";
import TopSignals from "./views/TopSignals";
import TopOpportunities from "./views/TopOpportunities";
import Utilization from "./views/Utilization";
import Cases from "./views/Cases";
import DetailDrawer from "./components/DetailDrawer";
import AgentChat from "./components/AgentChat";
import { useAccounts } from "./lib/api";
import type { DrawerTarget } from "./lib/types";

export default function App() {
  const [view, setView] = useState<ViewKey>("signals");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerTarget | null>(null);
  const { data: accounts } = useAccounts();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const drawerAccountId =
    drawer?.kind === "signal" ? drawer.signal.accountId
    : drawer?.kind === "opportunity" ? drawer.opportunity.accountId
    : drawer?.kind === "case" ? drawer.supportCase.accountId
    : drawer?.kind === "account" ? drawer.accountId
    : null;

  const viewProps = { selectedAccountId, openDrawer: setDrawer };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        view={view}
        onNavigate={setView}
        accounts={accounts ?? []}
        selectedAccountId={selectedAccountId}
        onSelectAccount={setSelectedAccountId}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-6 py-6 max-md:px-4">
          <div className="mx-auto max-w-4xl">
            {view === "signals" && <TopSignals {...viewProps} />}
            {view === "opportunities" && <TopOpportunities {...viewProps} />}
            {view === "utilization" && <Utilization {...viewProps} />}
            {view === "cases" && <Cases {...viewProps} />}
          </div>
        </main>
      </div>

      {drawer && <DetailDrawer target={drawer} onClose={() => setDrawer(null)} />}
      <AgentChat accountId={drawerAccountId ?? selectedAccountId} />
    </div>
  );
}
