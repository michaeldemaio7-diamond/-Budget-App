"use client";

import { useState } from "react";
import { Income, IncomeSource } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { calculatePaychecksForMonth } from "@/lib/paychecks";
import CurrencyInput from "@/components/ui/CurrencyInput";

interface IncomeSummaryProps {
  incomes: Income[];
  month: number;
  year: number;
  onRefresh: () => void;
}

const SOURCE_LABELS: Record<IncomeSource, string> = {
  WIFE_SALARY: "Wife Salary",
  JOB1_SALARY: "Job 1 (Primary)",
  JOB2_SALARY: "Job 2 (Secondary)",
  COMMISSION: "Commission",
  OTHER: "Other",
};

export default function IncomeSummary({ incomes, month, year, onRefresh }: IncomeSummaryProps) {
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionValue, setCommissionValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showAddPaycheck, setShowAddPaycheck] = useState(false);
  const [newPaycheck, setNewPaycheck] = useState({ source: "WIFE_SALARY" as IncomeSource, amount: 0, date: "" });

  // Calculate expected from paycheck logic
  const paychecks = calculatePaychecksForMonth(year, month);
  const expectedBySource: Record<string, number> = {};
  for (const pc of paychecks) {
    expectedBySource[pc.source] = (expectedBySource[pc.source] || 0) + pc.amount;
  }

  // Sum received by source
  const receivedBySource: Record<string, number> = {};
  for (const inc of incomes) {
    const src = inc.source;
    const amt = typeof inc.amount === "string" ? parseFloat(inc.amount) : inc.amount;
    receivedBySource[src] = (receivedBySource[src] || 0) + amt;
  }

  const commissionIncome = incomes.find((i) => i.source === "COMMISSION");

  const sources: IncomeSource[] = ["WIFE_SALARY", "JOB1_SALARY", "JOB2_SALARY", "COMMISSION", "OTHER"];

  const rows = sources.map((source) => ({
    source,
    label: SOURCE_LABELS[source],
    expected: expectedBySource[source] || 0,
    received: receivedBySource[source] || 0,
  }));

  const totalExpected = rows.reduce((s, r) => s + r.expected, 0);
  const totalReceived = rows.reduce((s, r) => s + r.received, 0);

  const handleCommissionEdit = () => {
    const current = typeof commissionIncome?.amount === "string"
      ? parseFloat(commissionIncome.amount)
      : commissionIncome?.amount || 0;
    setCommissionValue(current);
    setEditingCommission(true);
  };

  const handleCommissionSave = async () => {
    setSaving(true);
    try {
      if (commissionIncome) {
        await fetch(`/api/income`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: commissionIncome.id, amount: commissionValue }),
        });
      } else {
        // Need to create one
        const monthRes = await fetch(`/api/months/${year}-${String(month).padStart(2, "0")}`);
        const monthData = await monthRes.json();
        await fetch(`/api/income`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            budgetMonthId: monthData.budgetMonth.id,
            source: "COMMISSION",
            amount: commissionValue,
            label: "Commission",
            isManual: true,
          }),
        });
      }
      setEditingCommission(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleAddPaycheck = async () => {
    setSaving(true);
    try {
      const monthRes = await fetch(`/api/months/${year}-${String(month).padStart(2, "0")}`);
      const monthData = await monthRes.json();
      await fetch(`/api/income`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetMonthId: monthData.budgetMonth.id,
          source: newPaycheck.source,
          amount: newPaycheck.amount,
          paycheckDate: newPaycheck.date ? new Date(newPaycheck.date).toISOString() : null,
          label: `${SOURCE_LABELS[newPaycheck.source]} - Manual`,
          isManual: true,
        }),
      });
      setShowAddPaycheck(false);
      setNewPaycheck({ source: "WIFE_SALARY", amount: 0, date: "" });
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Income Summary</h3>
        <button
          onClick={() => setShowAddPaycheck(!showAddPaycheck)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <span>+</span> Add Paycheck
        </button>
      </div>

      {showAddPaycheck && (
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Source</label>
            <select
              value={newPaycheck.source}
              onChange={(e) => setNewPaycheck({ ...newPaycheck, source: e.target.value as IncomeSource })}
              className="border border-slate-200 rounded px-2 py-1.5 text-sm"
            >
              {sources.filter(s => s !== "COMMISSION" && s !== "OTHER").map(s => (
                <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Amount (Net)</label>
            <CurrencyInput
              value={newPaycheck.amount}
              onChange={(v) => setNewPaycheck({ ...newPaycheck, amount: v })}
              className="w-32"
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
            <button
              onClick={handleAddPaycheck}
              disabled={saving}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setShowAddPaycheck(false)}
              className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3 text-left">Source</th>
              <th className="px-5 py-3 text-right">Expected</th>
              <th className="px-5 py-3 text-right">Received</th>
              <th className="px-5 py-3 text-right">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const variance = row.received - row.expected;
              const isCommission = row.source === "COMMISSION";
              return (
                <tr key={row.source} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-sm font-medium text-slate-700">{row.label}</td>
                  <td className="px-5 py-3 text-sm text-right text-slate-600">
                    {row.expected > 0 ? formatCurrency(row.expected) : "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-right">
                    {isCommission && editingCommission ? (
                      <div className="flex items-center justify-end gap-2">
                        <CurrencyInput
                          value={commissionValue}
                          onChange={setCommissionValue}
                          className="w-28"
                        />
                        <button
                          onClick={handleCommissionSave}
                          disabled={saving}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving ? "..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingCommission(false)}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span
                        className={isCommission ? "cursor-pointer hover:underline text-blue-600" : "text-slate-700"}
                        onClick={isCommission ? handleCommissionEdit : undefined}
                        title={isCommission ? "Click to edit" : undefined}
                      >
                        {row.received > 0 ? formatCurrency(row.received) : isCommission ? <span className="text-slate-400 italic text-xs">Click to enter</span> : "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-right">
                    {row.expected > 0 || row.received > 0 ? (
                      <span className={variance >= 0 ? "text-green-600" : "text-red-500"}>
                        {formatCurrency(variance, { showSign: true })}
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold border-t border-slate-200">
              <td className="px-5 py-3 text-sm text-slate-800">Total Income</td>
              <td className="px-5 py-3 text-sm text-right text-slate-800">{formatCurrency(totalExpected)}</td>
              <td className="px-5 py-3 text-sm text-right text-slate-800">{formatCurrency(totalReceived)}</td>
              <td className="px-5 py-3 text-sm text-right">
                <span className={(totalReceived - totalExpected) >= 0 ? "text-green-600" : "text-red-500"}>
                  {formatCurrency(totalReceived - totalExpected, { showSign: true })}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
