"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/formatters";
import clsx from "clsx";

interface SavingsRow {
  id: number;
  month: number;
  year: number;
  actualSavingsEOM: string | number;
  cumulativeSavings: string | number;
  notes: string | null;
}

interface ProjectedMap {
  [key: string]: number; // "YYYY-M" => net savings amount
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toNum(v: string | number) {
  return typeof v === "string" ? parseFloat(v) : v;
}

function InlineNumber({
  value,
  rowId,
  field,
  onSaved,
}: {
  value: number;
  rowId: number;
  field: "actualSavingsEOM" | "cumulativeSavings";
  onSaved: (id: number, field: string, val: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toFixed(2));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const num = parseFloat(draft);
    if (isNaN(num)) { setEditing(false); return; }
    setSaving(true);
    await fetch("/api/savings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rowId, [field]: num }),
    });
    setSaving(false);
    setEditing(false);
    onSaved(rowId, field, num);
  };

  if (editing) {
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="text-slate-400 text-xs">$</span>
        <input
          autoFocus
          type="number"
          step="0.01"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          onBlur={save}
          className="w-24 text-center border border-blue-400 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        {saving && <span className="text-xs text-slate-400">...</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value.toFixed(2)); setEditing(true); }}
      className="text-sm text-center hover:underline decoration-dashed underline-offset-2 cursor-text group block w-full text-slate-700 hover:text-blue-600"
      title="Click to edit"
    >
      {formatCurrency(value)}
      <span className="ml-1 opacity-0 group-hover:opacity-100 text-xs text-blue-400">✏</span>
    </button>
  );
}

function InlineNotes({
  value,
  rowId,
  onSaved,
}: {
  value: string | null;
  rowId: number;
  onSaved: (id: number, notes: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch("/api/savings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rowId, notes: draft }),
    });
    setSaving(false);
    setEditing(false);
    onSaved(rowId, draft);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          onBlur={save}
          placeholder="Add note..."
          className="w-full border border-blue-400 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        {saving && <span className="text-xs text-slate-400">...</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value ?? ""); setEditing(true); }}
      className="text-sm text-left w-full text-slate-500 hover:text-slate-800 cursor-text group"
      title="Click to add note"
    >
      {value || <span className="italic text-slate-300 group-hover:text-slate-400">Add note...</span>}
    </button>
  );
}

export default function SavingsPage() {
  const [rows, setRows] = useState<SavingsRow[]>([]);
  const [projected, setProjected] = useState<ProjectedMap>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const savingsRes = await fetch("/api/savings");
      const savingsData: SavingsRow[] = await savingsRes.json();
      setRows(savingsData);

      // Fetch projected net savings for each month from budget data
      const projMap: ProjectedMap = {};
      await Promise.all(
        savingsData.map(async (row) => {
          const monthStr = String(row.month).padStart(2, "0");
          const res = await fetch(`/api/months/${row.year}-${monthStr}`);
          if (!res.ok) return;
          const data = await res.json();
          const totalIncome: number = (data.incomes ?? []).reduce(
            (s: number, inc: { amount: string | number }) => s + toNum(inc.amount),
            0
          );
          const totalExpenses: number = (data.budgetRows ?? []).reduce(
            (s: number, r: { budgetAmount: string | number }) => s + toNum(r.budgetAmount),
            0
          );
          projMap[`${row.year}-${row.month}`] = totalIncome - totalExpenses;
        })
      );
      setProjected(projMap);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleNumSaved = (id: number, field: string, val: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleNotesSaved = (id: number, notes: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, notes } : r)));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Savings Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">Projected vs actual savings by end of month · Ally account</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Month</th>
                  <th className="px-4 py-3 text-center">App Projected<br />Savings by EOM</th>
                  <th className="px-4 py-3 text-center">Actual<br />Savings EOM</th>
                  <th className="px-4 py-3 text-center">Delta</th>
                  <th className="px-4 py-3 text-center">Cumulative Savings<br />over Emergency</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const projKey = `${row.year}-${row.month}`;
                  const proj = projected[projKey] ?? 0;
                  const actual = toNum(row.actualSavingsEOM);
                  const cumulative = toNum(row.cumulativeSavings);
                  const delta = actual - proj;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-medium text-slate-700">
                        {MONTH_NAMES[row.month - 1]} {row.year}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {proj !== 0 ? (
                          <span className={proj >= 0 ? "text-green-600" : "text-red-500"}>
                            {formatCurrency(proj)}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs italic">No data</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <InlineNumber value={actual} rowId={row.id} field="actualSavingsEOM" onSaved={handleNumSaved} />
                      </td>
                      <td className={clsx("px-4 py-3 text-center font-medium", delta >= 0 ? "text-green-600" : "text-red-500")}>
                        {actual === 0 && proj === 0 ? "—" : (delta >= 0 ? "+" : "") + formatCurrency(delta)}
                      </td>
                      <td className="px-4 py-3">
                        <InlineNumber value={cumulative} rowId={row.id} field="cumulativeSavings" onSaved={handleNumSaved} />
                      </td>
                      <td className="px-4 py-3 min-w-[180px]">
                        <InlineNotes value={row.notes} rowId={row.id} onSaved={handleNotesSaved} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
