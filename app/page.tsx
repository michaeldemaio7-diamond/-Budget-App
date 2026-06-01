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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const monthYear = toMonthYearString(month, year);
      const res = await fetch(`/api/months/${monthYear}`);
      if (!res.ok) {
        if (res.status === 404) {
          // Month doesn't exist yet, try to create it
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  const totalIncome = data?.incomes.reduce((s, i) => {
    return s + (typeof i.amount === "string" ? parseFloat(i.amount) : i.amount);
  }, 0) || 0;

  const totalExpenses = data?.budgetRows.reduce((s, r) => {
    return s + (typeof r.actualAmount === "string" ? parseFloat(r.actualAmount) : r.actualAmount);
  }, 0) || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Month selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <MonthSelector month={month} year={year} onChange={handleMonthChange} />
        <button
          onClick={fetchData}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

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
          {/* Savings overview */}
          <SavingsCard totalIncome={totalIncome} totalExpenses={totalExpenses} />

          {/* Income summary */}
          <IncomeSummary
            incomes={data.incomes}
            month={month}
            year={year}
            onRefresh={fetchData}
          />

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendingPieChart rows={data.budgetRows} />
            <BudgetBarChart rows={data.budgetRows} />
          </div>

          {/* Budget summary */}
          <BudgetSummary rows={data.budgetRows} month={month} year={year} />

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CreditCardSummary transactions={data.transactions} rows={data.budgetRows} />
            <RecentTransactions transactions={data.transactions} />
          </div>
        </>
      )}
    </div>
  );
}
