"use client";

import { useState, useEffect, useCallback } from "react";
import { Transaction, BudgetRowWithCategory } from "@/types";
import { formatCurrency, formatDate } from "@/lib/formatters";
import CurrencyInput from "@/components/ui/CurrencyInput";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allRows, setAllRows] = useState<BudgetRowWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));

  const [newTx, setNewTx] = useState({
    merchant: "",
    amount: 0,
    description: "",
    date: now.toISOString().split("T")[0],
    budgetRowId: "",
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const monthYear = `${filterYear}-${filterMonth}`;
      const monthRes = await fetch(`/api/months/${monthYear}`);
      if (!monthRes.ok) {
        setTransactions([]);
        setLoading(false);
        return;
      }
      const monthData = await monthRes.json();

      let url = `/api/transactions?budgetMonthId=${monthData.budgetMonth.id}`;
      if (filterSource) url += `&source=${filterSource}`;
      if (filterUnassigned) url += `&unassigned=true`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const data = await res.json();
      setTransactions(data);
      setAllRows(monthData.budgetRows);
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear, filterSource, filterUnassigned, search]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (txId: number) => {
    if (!confirm("Delete this transaction?")) return;
    await fetch(`/api/transactions?id=${txId}`, { method: "DELETE" });
    fetchTransactions();
  };

  const handleAddTx = async () => {
    if (!newTx.merchant || !newTx.amount) return;
    setSaving(true);
    try {
      const monthYear = `${filterYear}-${filterMonth}`;
      const monthRes = await fetch(`/api/months/${monthYear}`);
      const monthData = await monthRes.json();

      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetMonthId: monthData.budgetMonth.id,
          budgetRowId: newTx.budgetRowId ? parseInt(newTx.budgetRowId) : null,
          merchant: newTx.merchant,
          amount: newTx.amount,
          description: newTx.description,
          transactionDate: new Date(newTx.date).toISOString(),
          source: "MANUAL",
        }),
      });
      setShowAddForm(false);
      setNewTx({ merchant: "", amount: 0, description: "", date: now.toISOString().split("T")[0], budgetRowId: "" });
      fetchTransactions();
    } finally {
      setSaving(false);
    }
  };

  const months = [
    "01","02","03","04","05","06","07","08","09","10","11","12"
  ];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20 md:pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800">Transactions</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span> Add Transaction
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 mb-3">New Transaction</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Merchant *</label>
              <input
                type="text"
                value={newTx.merchant}
                onChange={(e) => setNewTx({ ...newTx, merchant: e.target.value })}
                placeholder="Merchant name"
                className="border border-slate-200 rounded px-2 py-1.5 text-sm w-40"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Amount *</label>
              <CurrencyInput value={newTx.amount} onChange={(v) => setNewTx({ ...newTx, amount: v })} className="w-28" />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={newTx.date}
                onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                className="border border-slate-200 rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Category (optional)</label>
              <select
                value={newTx.budgetRowId}
                onChange={(e) => setNewTx({ ...newTx, budgetRowId: e.target.value })}
                className="border border-slate-200 rounded px-2 py-1.5 text-sm w-44"
              >
                <option value="">Unassigned</option>
                {allRows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.category.name} → {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Description</label>
              <input
                type="text"
                value={newTx.description}
                onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                placeholder="Optional note"
                className="border border-slate-200 rounded px-2 py-1.5 text-sm w-36"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddTx}
                disabled={saving}
                className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Add"}
              </button>
              <button onClick={() => setShowAddForm(false)} className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Month</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1.5 text-sm"
          >
            {months.map((m, i) => (
              <option key={m} value={m}>{monthNames[i]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Year</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1.5 text-sm"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Source</label>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1.5 text-sm"
          >
            <option value="">All Sources</option>
            <option value="MANUAL">Manual</option>
            <option value="CHASE_EMAIL">Chase Email</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Merchant or description..."
            className="border border-slate-200 rounded px-2 py-1.5 text-sm w-48"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer pb-1">
          <input
            type="checkbox"
            checked={filterUnassigned}
            onChange={(e) => setFilterUnassigned(e.target.checked)}
            className="rounded"
          />
          Unassigned only
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Merchant</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Description</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Source</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(tx.transactionDate)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{tx.merchant}</td>
                    <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">
                      {tx.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={tx.budgetRowId ? String(tx.budgetRowId) : ""}
                        onChange={async (e) => {
                          setSaving(true);
                          await fetch("/api/transactions/assign", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              transactionId: tx.id,
                              budgetRowId: e.target.value ? parseInt(e.target.value) : null,
                            }),
                          });
                          setSaving(false);
                          fetchTransactions();
                        }}
                        className={`border rounded px-1.5 py-1 text-xs w-44 ${
                          tx.budgetRowId
                            ? "border-slate-200 text-slate-700 bg-white"
                            : "border-yellow-300 text-yellow-700 bg-yellow-50"
                        }`}
                      >
                        <option value="">— Unassigned —</option>
                        {allRows.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.category.name} → {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">
                      {formatCurrency(typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount)}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tx.source === "CHASE_EMAIL" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                        {tx.source === "CHASE_EMAIL" ? "Chase" : "Manual"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
