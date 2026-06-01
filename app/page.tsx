"use client";

import { useState, useEffect, useCallback } from "react";
import MonthSelector from "@/components/ui/MonthSelector";
import IncomeSummary from "@/components/dashboard/IncomeSummary";
import BudgetSummary from "@/components/dashboard/BudgetSummary";
import SavingsCard from "@/components/dashboard/SavingsCard";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import CreditCardSummary from "@/components/dashboard/CreditCardSummary";
import SpendingPieChart from "@/components/charts/SpendingPieChart";
import BudgetBarChart from "@/components/charts/BudgetBarChart";
import { Income, BudgetRowWithCategory, Transaction, Settings } from "@/types";
import { toMonthYearString } from "@/lib/formatters";

interface MonthData {
  budgetMonth: { id: number; month: number; year: number };
  incomes: Income[];
  budgetRows: BudgetRowWithCategory[];
  transactions: Transaction[];
  settings: Settings;
}

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const monthYear = toMonthYearString(month, year);
      const res = await fetch(`/api/months/${monthYear}`);
      if (!res.ok) {
        if (res.status === 404) {
          const createRes = await fetch("/api/months", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ month, year }),
          });
          if (createRes.ok) {
            const refetch = await fetch(`/api/months/${monthYear}`);
            const d = await refetch.json();
            setData(d);
          }
        } else {
          throw new Error("Failed to load month data");
        }
      } else {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  // Auto-sync Gmail if tokens are set and last sync was >24h ago
  const autoSyncGmail = useCallback(async (settings: Settings) => {
    if (!settings.gmailToken1 && !settings.gmailToken2) return;
    if (settings.lastGmailSync) {
      const lastSync = new Date(settings.lastGmailSync);
      const hoursSince = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) return;
    }
    // Sync both accounts silently in background
    const sinceDate = new Date(year, month - 1, 1).toISOString();
    if (settings.gmailToken1) {
      fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: 1, sinceDate }),
      });
    }
    if (settings.gmailToken2) {
      fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: 2, sinceDate }),
      });
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (data?.settings) autoSyncGmail(data.settings);
  }, [data?.settings, autoSyncGmail]);

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  const handleSyncGmail = async () => {
    setSyncing(true);
    setSyncMsg(null);
    const sinceDate = new Date(year, month - 1, 1).toISOString();
    try {
      const results = await Promise.all([
        fetch("/api/gmail/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account: 1, sinceDate }),
        }).then((r) => r.json()),
        fetch("/api/gmail/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account: 2, sinceDate }),
        }).then((r) => r.json()),
      ]);
      const totalCreated = results.reduce((s, r) => s + (r.created || 0), 0);
      const errors = results.filter((r) => r.error).map((r) => r.error);
      if (errors.length > 0) {
        setSyncMsg(`⚠️ ${errors[0]}`);
      } else {
        setSyncMsg(`✓ Synced — ${totalCreated} new transaction${totalCreated !== 1 ? "s" : ""} imported`);
        if (totalCreated > 0) fetchData();
      }
    } catch {
      setSyncMsg("⚠️ Sync failed — check your Gmail connection in Settings");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 6000);
    }
  };

  const totalIncome = data?.incomes.reduce((s, i) => {
    return s + parseFloat(String(i.amount));
  }, 0) || 0;

  const totalExpenses = data?.budgetRows.reduce((s, r) => {
    return s + parseFloat(String(r.actualAmount));
  }, 0) || 0;

  const gmailConnected = !!(data?.settings?.gmailToken1 || data?.settings?.gmailToken2);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <MonthSelector month={month} year={year} onChange={handleMonthChange} />
        <div className="flex items-center gap-3">
          {gmailConnected && (
            <button
              onClick={handleSyncGmail}
              disabled={syncing}
              className="flex items-center gap-1.5 text-sm bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 px-3 py-1.5 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              <svg className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? "Syncing..." : "Sync Gmail"}
            </button>
          )}
          <button
            onClick={fetchData}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            Refresh
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className={`text-sm rounded-lg px-4 py-2.5 border ${syncMsg.startsWith("✓") ? "bg-green-50 border-green-200 text-green-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
          {syncMsg}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 text-sm">Loading...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          <SavingsCard totalIncome={totalIncome} totalExpenses={totalExpenses} />

          <IncomeSummary
            incomes={data.incomes}
            month={month}
            year={year}
            settings={data.settings}
            onRefresh={fetchData}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendingPieChart rows={data.budgetRows} />
            <BudgetBarChart rows={data.budgetRows} />
          </div>

          <BudgetSummary rows={data.budgetRows} month={month} year={year} onBudgetUpdate={fetchData} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CreditCardSummary transactions={data.transactions} rows={data.budgetRows} />
            <RecentTransactions transactions={data.transactions} />
          </div>
        </>
      )}
    </div>
  );
}
