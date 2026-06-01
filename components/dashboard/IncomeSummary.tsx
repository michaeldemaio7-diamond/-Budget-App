"use client";

import { useState } from "react";
import { Income, IncomeSource, Settings } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { calculatePaychecksForMonth } from "@/lib/paychecks";

interface IncomeSummaryProps {
  incomes: Income[];
  month: number;
  year: number;
  settings: Settings;
  onRefresh: () => void;
}

const SOURCE_LABELS: Record<IncomeSource, string> = {
  WIFE_SALARY: "Wife Salary",
  JOB1_SALARY: "Job 1",
  JOB2_SALARY: "Job 2",
  COMMISSION: "Commission",
  OTHER: "Other",
};

function EditableIncome({ income, onSaved }: { income: Income; onSaved: () => void }) {
  const current = parseFloat(String(income.amount));
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current.toFixed(2));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const num = parseFloat(value);
    if (isNaN(num)) { setEditing(false); return; }
    setSaving(true);
    await fetch("/api/income", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: income.id, amount: num }),
    });
    setSaving(false);
    setEditing(false);
    onSaved();
  };

  if (editing) {
    return (
      <div className="flex items-center justify-end gap-1">
        <span className="text-slate-400 text-xs">$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          onBlur={save}
          autoFocus
          className="w-28 text-right border border-blue-400 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        {saving && <span className="text-xs text-slate-400">...</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => { setValue(current.toFixed(2)); setEditing(true); }}
      className="text-sm text-right text-slate-700 hover:text-blue-600 hover:underline decoration-dashed underline-offset-2 cursor-text group w-full text-right block"
      title="Click to edit"
    >
      {current > 0 ? formatCurrency(current) : <span className="text-slate-400 italic text-xs">Click to enter</span>}
      <span className="ml-1 opacity-0 group-hover:opacity-100 text-xs text-blue-400">✏</span>
    </button>
  );
}

export default function IncomeSummary({ incomes, month, year, settings, onRefresh }: IncomeSummaryProps) {
  const [showAddPaycheck, setShowAddPaycheck] = useState(false);
  const [newPaycheck, setNewPaycheck] = useState({ source: "WIFE_SALARY" as IncomeSource, amount: "", date: "" });
  const [saving, setSaving] = useState(false);

  // Calculate expected paychecks for this month using actual net amounts
  const paychecks = calculatePaychecksForMonth(year, month, {
    wifeNetPaycheck: parseFloat(String(settings.wifeNetPaycheck ?? 7600)),
    job1NetPaycheck: parseFloat(String(settings.job1NetPaycheck ?? 3400)),
    job2NetPaycheck: parseFloat(String(settings.job2NetPaycheck ?? 2200)),
    wifeFirstPayDate: settings.wifeFirstPayDate,
    job1FirstPayDate: settings.job1FirstPayDate,
  });

  // Group incomes by source for display
  const salarySources: IncomeSource[] = ["WIFE_SALARY", "JOB1_SALARY", "JOB2_SALARY"];

  // For each salary source: expected = sum of calculated paychecks, received = sum of income records
  const sourceRows = salarySources.map((source) => {
    const expected = paychecks.filter((p) => p.source === source).reduce((s, p) => s + p.amount, 0);
    const sourceIncomes = incomes.filter((i) => i.source === source);
    const received = sourceIncomes.reduce((s, i) => s + parseFloat(String(i.amount)), 0);
    const paycheckCount = paychecks.filter((p) => p.source === source).length;
    return { source, label: SOURCE_LABELS[source], expected, received, sourceIncomes, paycheckCount };
  });

  const commissionIncomes = incomes.filter((i) => i.source === "COMMISSION");
  const commissionTotal = commissionIncomes.reduce((s, i) => s + parseFloat(String(i.amount)), 0);

  const totalExpected = sourceRows.reduce((s, r) => s + r.expected, 0);
  const totalReceived = sourceRows.reduce((s, r) => s + r.received, 0) + commissionTotal;

  const handleAddPaycheck = async () => {
    const amt = parseFloat(newPaycheck.amount);
    if (isNaN(amt) || amt <= 0) return;
    setSaving(true);
    try {
      const monthYear = `${year}-${String(month).padStart(2, "0")}`;
      const monthRes = await fetch(`/api/months/${monthYear}`);
      const monthData = await monthRes.json();
      await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetMonthId: monthData.budgetMonth.id,
          source: newPaycheck.source,
          amount: amt,
          paycheckDate: newPaycheck.date ? new Date(newPaycheck.date).toISOString() : null,
          label: `${SOURCE_LABELS[newPaycheck.source]} — Manual`,
          isManual: true,
        }),
      });
      setShowAddPaycheck(false);
      setNewPaycheck({ source: "WIFE_SALARY", amount: "", date: "" });
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Income</h3>
        <button
          onClick={() => setShowAddPaycheck(!showAddPaycheck)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add Paycheck
        </button>
      </div>

      {showAddPaycheck && (
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Source</label>
            <select
              value={newPaycheck.source}
              onChange={(e) => setNewPaycheck({ ...newPaycheck, source: e.target.value as IncomeSource })}
              className="border border-slate-200 rounded px-2 py-1.5 text-sm bg-white"
            >
              {(["WIFE_SALARY", "JOB1_SALARY", "JOB2_SALARY", "COMMISSION"] as IncomeSource[]).map((s) => (
                <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Net Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={newPaycheck.amount}
              onChange={(e) => setNewPaycheck({ ...newPaycheck, amount: e.target.value })}
              className="border border-slate-200 rounded px-2 py-1.5 text-sm w-32"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={newPaycheck.date}
              onChange={(e) => setNewPaycheck({ ...newPaycheck, date: e.target.value })}
              className="border border-slate-200 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddPaycheck} disabled={saving}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setShowAddPaycheck(false)}
              className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm hover:bg-slate-300">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-right">Expected</th>
              <th className="px-4 py-3 text-right">Received <span className="normal-case font-normal text-blue-400">(click to edit)</span></th>
              <th className="px-4 py-3 text-right">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sourceRows.map((row) => {
              const variance = row.received - row.expected;
              return (
                <tr key={row.source} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {row.label}
                    <span className="ml-1.5 text-xs text-slate-400 font-normal">
                      ({row.paycheckCount} check{row.paycheckCount !== 1 ? "s" : ""})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(row.expected)}</td>
                  <td className="px-4 py-3 text-right">
                    {row.sourceIncomes.length > 0 ? (
                      <div className="space-y-1">
                        {row.sourceIncomes.map((inc) => (
                          <EditableIncome key={inc.id} income={inc} onSaved={onRefresh} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">No entries yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {row.received > 0 ? (
                      <span className={variance >= 0 ? "text-green-600" : "text-red-500"}>
                        {variance >= 0 ? "+" : ""}{formatCurrency(variance)}
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}

            {/* Commission row */}
            <tr className="hover:bg-slate-50 border-t border-slate-100">
              <td className="px-5 py-3 font-medium text-slate-700">
                Commission
                <span className="ml-1.5 text-xs text-slate-400 font-normal">(variable)</span>
              </td>
              <td className="px-4 py-3 text-right text-slate-400">—</td>
              <td className="px-4 py-3 text-right">
                {commissionIncomes.length > 0 ? (
                  <div className="space-y-1">
                    {commissionIncomes.map((inc) => (
                      <EditableIncome key={inc.id} income={inc} onSaved={onRefresh} />
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-xs">No entries yet</span>
                )}
              </td>
              <td className="px-4 py-3 text-right text-slate-400">—</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
              <td className="px-5 py-3 text-slate-800">Total Income</td>
              <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(totalExpected)}</td>
              <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(totalReceived)}</td>
              <td className="px-4 py-3 text-right">
                <span className={(totalReceived - totalExpected) >= 0 ? "text-green-600" : "text-red-500"}>
                  {(totalReceived - totalExpected) >= 0 ? "+" : ""}{formatCurrency(totalReceived - totalExpected)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
