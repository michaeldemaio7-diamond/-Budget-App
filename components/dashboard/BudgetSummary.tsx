"use client";

import { useState } from "react";
import Link from "next/link";
import { BudgetRowWithCategory } from "@/types";
import { formatCurrency, toMonthYearString } from "@/lib/formatters";
import clsx from "clsx";

interface BudgetSummaryProps {
  rows: BudgetRowWithCategory[];
  month: number;
  year: number;
  onBudgetUpdate?: () => void;
}

interface GroupedSection {
  name: string;
  icon?: string | null;
  sortOrder: number;
  rows: BudgetRowWithCategory[];
  totalBudget: number;
  totalActual: number;
}

function groupBySection(rows: BudgetRowWithCategory[]): GroupedSection[] {
  const map = new Map<number, GroupedSection>();
  for (const row of rows) {
    const cat = row.category;
    if (!map.has(cat.id)) {
      map.set(cat.id, {
        name: cat.name,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        rows: [],
        totalBudget: 0,
        totalActual: 0,
      });
    }
    const entry = map.get(cat.id)!;
    entry.rows.push(row);
    entry.totalBudget += parseFloat(String(row.budgetAmount));
    entry.totalActual += parseFloat(String(row.actualAmount));
  }
  return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

function statusColor(budget: number, actual: number) {
  if (budget <= 0) return { bar: "bg-slate-200", text: "text-slate-500" };
  const pct = (actual / budget) * 100;
  if (pct >= 100) return { bar: "bg-red-500", text: "text-red-600" };
  if (pct >= 90) return { bar: "bg-red-400", text: "text-red-500" };
  if (pct >= 75) return { bar: "bg-yellow-400", text: "text-yellow-600" };
  return { bar: "bg-green-400", text: "text-green-600" };
}

function EditableAmount({ row, onSaved }: { row: BudgetRowWithCategory; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(parseFloat(String(row.budgetAmount)).toFixed(2));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const num = parseFloat(value);
    if (isNaN(num)) { setEditing(false); return; }
    setSaving(true);
    await fetch(`/api/budget-rows`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, budgetAmount: num }),
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
          className="w-24 text-right border border-blue-400 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        {saving && <span className="text-xs text-slate-400">...</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => { setValue(parseFloat(String(row.budgetAmount)).toFixed(2)); setEditing(true); }}
      className="text-sm text-right text-slate-700 hover:text-blue-600 hover:underline decoration-dashed underline-offset-2 cursor-text group"
      title="Click to edit"
    >
      {formatCurrency(parseFloat(String(row.budgetAmount)))}
      <span className="ml-1 opacity-0 group-hover:opacity-100 text-xs text-blue-400">✏</span>
    </button>
  );
}

export default function BudgetSummary({ rows, month, year, onBudgetUpdate }: BudgetSummaryProps) {
  const sections = groupBySection(rows);
  const monthYear = toMonthYearString(month, year);

  const grandBudget = sections.reduce((s, c) => s + c.totalBudget, 0);
  const grandActual = sections.reduce((s, c) => s + c.totalActual, 0);
  const grandRemaining = grandBudget - grandActual;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Budget vs Actual</h3>
        <Link href={`/budget/${monthYear}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Detail →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-right">Budgeted</th>
              <th className="px-4 py-3 text-right">Actual</th>
              <th className="px-4 py-3 text-right">Remaining</th>
              <th className="px-3 py-3 text-center w-20">Fixed</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const sectionRemaining = section.totalBudget - section.totalActual;
              const sectionPct = section.totalBudget > 0 ? (section.totalActual / section.totalBudget) * 100 : 0;
              const sectionColors = statusColor(section.totalBudget, section.totalActual);

              return (
                <>
                  {/* Section header row */}
                  <tr key={`section-${section.name}`} className="bg-slate-100 border-t border-slate-200">
                    <td colSpan={5} className="px-5 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 text-xs uppercase tracking-wide">
                          {section.icon} {section.name}
                        </span>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Budget: <span className="font-medium text-slate-700">{formatCurrency(section.totalBudget)}</span></span>
                          <span>Actual: <span className="font-medium text-slate-700">{formatCurrency(section.totalActual)}</span></span>
                          <span className={clsx("font-medium", sectionColors.text)}>
                            {sectionRemaining >= 0 ? "Left: " : "Over: "}
                            {formatCurrency(Math.abs(sectionRemaining))}
                          </span>
                          {/* mini progress bar */}
                          <div className="hidden sm:flex w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={clsx("h-full rounded-full", sectionColors.bar)}
                              style={{ width: `${Math.min(sectionPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Individual rows */}
                  {section.rows.map((row) => {
                    const budget = parseFloat(String(row.budgetAmount));
                    const actual = parseFloat(String(row.actualAmount));
                    const remaining = budget - actual;
                    const colors = statusColor(budget, actual);

                    return (
                      <tr key={row.id} className="border-t border-slate-50 hover:bg-slate-50/60">
                        <td className="px-5 py-2.5 pl-8 text-slate-600">{row.label}</td>
                        <td className="px-4 py-2.5 text-right">
                          {row.isFixed ? (
                            <span className="text-slate-500">{formatCurrency(budget)}</span>
                          ) : (
                            <EditableAmount row={row} onSaved={onBudgetUpdate ?? (() => {})} />
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency(actual)}</td>
                        <td className={clsx("px-4 py-2.5 text-right font-medium", colors.text)}>
                          {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {row.isFixed ? (
                            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Fixed</span>
                          ) : (
                            <span className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">Variable</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
              <td className="px-5 py-3 text-slate-800">Total</td>
              <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(grandBudget)}</td>
              <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(grandActual)}</td>
              <td className={clsx("px-4 py-3 text-right font-semibold", grandRemaining >= 0 ? "text-green-600" : "text-red-500")}>
                {grandRemaining >= 0 ? formatCurrency(grandRemaining) : `-${formatCurrency(Math.abs(grandRemaining))}`}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
