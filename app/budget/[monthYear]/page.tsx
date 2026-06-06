"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { BudgetRowWithCategory, BudgetCategory, Transaction } from "@/types";
import { formatCurrency, formatMonthYear, getStatusColor } from "@/lib/formatters";
import StatusBadge from "@/components/ui/StatusBadge";
import CurrencyInput from "@/components/ui/CurrencyInput";
import clsx from "clsx";

interface CategoryGroup {
  category: BudgetCategory;
  rows: BudgetRowWithCategory[];
  totalBudget: number;
  totalActual: number;
}

interface PageData {
  budgetMonth: { id: number; month: number; year: number };
  budgetRows: BudgetRowWithCategory[];
  transactions: Transaction[];
}

export default function BudgetDetailPage({ params }: { params: Promise<{ monthYear: string }> }) {
  const { monthYear } = use(params);
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ budgetAmount: number; notes: string }>({ budgetAmount: 0, notes: "" });
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showAddTx, setShowAddTx] = useState<number | null>(null);
  const [newTx, setNewTx] = useState({ merchant: "", amount: 0, description: "", date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/months/${monthYear}`);
      if (!res.ok) throw new Error("Month not found");
      const d = await res.json();
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [monthYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const groupByCategory = (rows: BudgetRowWithCategory[]): CategoryGroup[] => {
    const map = new Map<number, CategoryGroup>();
    for (const row of rows) {
      const cat = row.category;
      if (!map.has(cat.id)) {
        map.set(cat.id, { category: cat, rows: [], totalBudget: 0, totalActual: 0 });
      }
      const entry = map.get(cat.id)!;
      entry.rows.push(row);
      entry.totalBudget += typeof row.budgetAmount === "string" ? parseFloat(row.budgetAmount) : row.budgetAmount;
      entry.totalActual += typeof row.actualAmount === "string" ? parseFloat(row.actualAmount) : row.actualAmount;
    }
    return Array.from(map.values()).sort((a, b) => a.category.sortOrder - b.category.sortOrder);
  };

  const handleEditStart = (row: BudgetRowWithCategory) => {
    setEditingRow(row.id);
    setEditValues({
      budgetAmount: typeof row.budgetAmount === "string" ? parseFloat(row.budgetAmount) : row.budgetAmount,
      notes: row.notes || "",
    });
  };

  const handleEditSave = async (rowId: number) => {
    setSaving(true);
    try {
      await fetch("/api/budget-rows", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rowId, budgetAmount: editValues.budgetAmount, notes: editValues.notes }),
      });
      setEditingRow(null);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleAddTransaction = async (rowId: number) => {
    if (!data || !newTx.merchant || !newTx.amount) return;
    setSaving(true);
    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetMonthId: data.budgetMonth.id,
          budgetRowId: rowId,
          merchant: newTx.merchant,
          amount: newTx.amount,
          description: newTx.description,
          transactionDate: new Date(newTx.date).toISOString(),
          source: "MANUAL",
        }),
      });
      setShowAddTx(null);
      setNewTx({ merchant: "", amount: 0, description: "", date: new Date().toISOString().split("T")[0] });
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const toggleRow = (rowId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>;
  if (!data) return null;

  const { budgetMonth, budgetRows, transactions } = data;
  const categories = groupByCategory(budgetRows);

  const getTxForRow = (rowId: number) => transactions.filter((t) => t.budgetRowId === rowId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/" className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-slate-800">
          Budget Detail — {formatMonthYear(budgetMonth.month, budgetMonth.year)}
        </h1>
      </div>

      {categories.map((catGroup) => (
        <div key={catGroup.category.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Category header */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{catGroup.category.icon}</span>
              <span className="font-semibold text-slate-800">{catGroup.category.name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>Budget: <span className="font-medium text-slate-700">{formatCurrency(catGroup.totalBudget)}</span></span>
              <span>Actual: <span className="font-medium text-slate-700">{formatCurrency(catGroup.totalActual)}</span></span>
              <StatusBadge
                percentUsed={catGroup.totalBudget > 0 ? (catGroup.totalActual / catGroup.totalBudget) * 100 : 0}
              />
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {catGroup.rows.map((row) => {
              const budget = typeof row.budgetAmount === "string" ? parseFloat(row.budgetAmount) : row.budgetAmount;
              const actual = typeof row.actualAmount === "string" ? parseFloat(row.actualAmount) : row.actualAmount;
              const remaining = budget - actual;
              const percent = budget > 0 ? (actual / budget) * 100 : 0;
              const colors = getStatusColor(percent);
              const rowTxs = getTxForRow(row.id);
              const isExpanded = expandedRows.has(row.id);
              const isEditing = editingRow === row.id;

              return (
                <div key={row.id}>
                  <div className={clsx("px-5 py-3 hover:bg-slate-50", percent >= 90 && "bg-red-50/40")}>
                    {isEditing ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-slate-700 flex-1 min-w-[120px]">{row.label}</span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">Budget:</label>
                          <CurrencyInput
                            value={editValues.budgetAmount}
                            onChange={(v) => setEditValues((prev) => ({ ...prev, budgetAmount: v }))}
                            className="w-28"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Notes..."
                          value={editValues.notes}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, notes: e.target.value }))}
                          className="border border-slate-200 rounded px-2 py-1.5 text-sm flex-1 min-w-[120px]"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(row.id)}
                            disabled={saving}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            {saving ? "..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingRow(null)}
                            className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700 truncate">{row.label}</span>
                            {row.notes && (
                              <span className="text-xs text-slate-400 truncate hidden sm:inline">— {row.notes}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-right flex-shrink-0">
                          <div className="hidden sm:block">
                            <div className="text-xs text-slate-400">Budget</div>
                            <div className="text-slate-700">{formatCurrency(budget)}</div>
                          </div>
                          <div className="hidden sm:block">
                            <div className="text-xs text-slate-400">Actual</div>
                            <div className="text-slate-700">{formatCurrency(actual)}</div>
                          </div>
                          <div className="hidden sm:block">
                            <div className="text-xs text-slate-400">Remaining</div>
                            <div className={colors.text}>{formatCurrency(remaining)}</div>
                          </div>
                          <StatusBadge percentUsed={percent} />
                          {rowTxs.length > 0 && (
                            <button
                              onClick={() => toggleRow(row.id)}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              {rowTxs.length} tx
                              <svg className={clsx("w-3 h-3 transition-transform", isExpanded && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => setShowAddTx(showAddTx === row.id ? null : row.id)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            + Add
                          </button>
                          <button
                            onClick={() => handleEditStart(row)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add transaction form */}
                  {showAddTx === row.id && (
                    <div className="px-5 py-3 bg-blue-50 border-t border-blue-100 flex flex-wrap gap-3 items-end">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Merchant</label>
                        <input
                          type="text"
                          value={newTx.merchant}
                          onChange={(e) => setNewTx({ ...newTx, merchant: e.target.value })}
                          placeholder="Merchant name"
                          className="border border-slate-200 rounded px-2 py-1.5 text-sm w-36"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Amount</label>
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddTransaction(row.id)}
                          disabled={saving}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving ? "..." : "Add"}
                        </button>
                        <button
                          onClick={() => setShowAddTx(null)}
                          className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Transactions list */}
                  {isExpanded && rowTxs.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50">
                      {rowTxs.map((tx) => (
                        <div key={tx.id} className="px-8 py-2 flex items-center justify-between text-sm border-b border-slate-100 last:border-0">
                          <div>
                            <span className="text-slate-700 font-medium">{tx.merchant}</span>
                            {tx.description && <span className="text-slate-400 ml-2 text-xs">{tx.description}</span>}
                            <span className="text-slate-400 ml-2 text-xs">
                              {new Date(tx.transactionDate).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="font-medium text-slate-700">
                            {formatCurrency(typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
