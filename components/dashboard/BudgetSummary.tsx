"use client";

import Link from "next/link";
import { BudgetRowWithCategory, CategorySummary } from "@/types";
import { formatCurrency, formatPercent, getStatusColor, toMonthYearString } from "@/lib/formatters";
import StatusBadge from "@/components/ui/StatusBadge";
import clsx from "clsx";

interface BudgetSummaryProps {
  rows: BudgetRowWithCategory[];
  month: number;
  year: number;
}

function groupByCategory(rows: BudgetRowWithCategory[]): CategorySummary[] {
  const map = new Map<number, CategorySummary>();
  for (const row of rows) {
    const cat = row.category;
    if (!map.has(cat.id)) {
      map.set(cat.id, {
        category: cat,
        rows: [],
        totalBudget: 0,
        totalActual: 0,
        totalRemaining: 0,
        percentUsed: 0,
      });
    }
    const entry = map.get(cat.id)!;
    entry.rows.push(row);
    entry.totalBudget += typeof row.budgetAmount === "string" ? parseFloat(row.budgetAmount) : row.budgetAmount;
    entry.totalActual += typeof row.actualAmount === "string" ? parseFloat(row.actualAmount) : row.actualAmount;
  }
  for (const entry of map.values()) {
    entry.totalRemaining = entry.totalBudget - entry.totalActual;
    entry.percentUsed = entry.totalBudget > 0 ? (entry.totalActual / entry.totalBudget) * 100 : 0;
  }
  return Array.from(map.values()).sort((a, b) => a.category.sortOrder - b.category.sortOrder);
}

export default function BudgetSummary({ rows, month, year }: BudgetSummaryProps) {
  const categories = groupByCategory(rows);
  const monthYear = toMonthYearString(month, year);

  const grandTotalBudget = categories.reduce((s, c) => s + c.totalBudget, 0);
  const grandTotalActual = categories.reduce((s, c) => s + c.totalActual, 0);
  const grandTotalRemaining = grandTotalBudget - grandTotalActual;
  const grandPercent = grandTotalBudget > 0 ? (grandTotalActual / grandTotalBudget) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Budget vs Actual</h3>
        <Link
          href={`/budget/${monthYear}`}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Detail →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3 text-left">Category</th>
              <th className="px-5 py-3 text-right">Budgeted</th>
              <th className="px-5 py-3 text-right">Actual</th>
              <th className="px-5 py-3 text-right">Remaining</th>
              <th className="px-5 py-3 text-right">% Used</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((cat) => {
              const colors = getStatusColor(cat.percentUsed);
              return (
                <tr key={cat.category.id} className={clsx("hover:bg-slate-50", cat.percentUsed >= 90 && "bg-red-50/30")}>
                  <td className="px-5 py-3 text-sm font-medium text-slate-700">
                    <span className="mr-2">{cat.category.icon}</span>
                    {cat.category.name}
                  </td>
                  <td className="px-5 py-3 text-sm text-right text-slate-600">
                    {formatCurrency(cat.totalBudget)}
                  </td>
                  <td className="px-5 py-3 text-sm text-right text-slate-700">
                    {formatCurrency(cat.totalActual)}
                  </td>
                  <td className={clsx("px-5 py-3 text-sm text-right font-medium", colors.text)}>
                    {formatCurrency(cat.totalRemaining)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden sm:flex w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={clsx(
                            "h-full rounded-full transition-all",
                            cat.percentUsed >= 100 ? "bg-red-500" :
                            cat.percentUsed >= 90 ? "bg-red-400" :
                            cat.percentUsed >= 75 ? "bg-yellow-400" : "bg-green-400"
                          )}
                          style={{ width: `${Math.min(cat.percentUsed, 100)}%` }}
                        />
                      </div>
                      <StatusBadge percentUsed={cat.percentUsed} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold border-t border-slate-200">
              <td className="px-5 py-3 text-sm text-slate-800">Total</td>
              <td className="px-5 py-3 text-sm text-right text-slate-800">{formatCurrency(grandTotalBudget)}</td>
              <td className="px-5 py-3 text-sm text-right text-slate-800">{formatCurrency(grandTotalActual)}</td>
              <td className={clsx("px-5 py-3 text-sm text-right font-semibold", grandTotalRemaining >= 0 ? "text-green-600" : "text-red-500")}>
                {formatCurrency(grandTotalRemaining)}
              </td>
              <td className="px-5 py-3 text-right">
                <StatusBadge percentUsed={grandPercent} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
