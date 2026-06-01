"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BudgetRowWithCategory } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface BudgetBarChartProps {
  rows: BudgetRowWithCategory[];
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-slate-800 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="text-sm">
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const formatYAxis = (value: number) => {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
};

export default function BudgetBarChart({ rows }: BudgetBarChartProps) {
  // Group by category
  const byCategory: Record<string, { name: string; budget: number; actual: number }> = {};
  for (const row of rows) {
    const budget = typeof row.budgetAmount === "string" ? parseFloat(row.budgetAmount) : row.budgetAmount;
    const actual = typeof row.actualAmount === "string" ? parseFloat(row.actualAmount) : row.actualAmount;
    if (budget <= 0 && actual <= 0) continue;
    const cat = row.category.name;
    if (!byCategory[cat]) {
      byCategory[cat] = { name: cat, budget: 0, actual: 0 };
    }
    byCategory[cat].budget += budget;
    byCategory[cat].actual += actual;
  }

  const data = Object.values(byCategory)
    .filter((d) => d.budget > 0 || d.actual > 0)
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 8);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Budget vs Actual by Category</h3>
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          No budget data yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-800 mb-4">Budget vs Actual by Category</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
          />
          <Bar dataKey="budget" name="Budgeted" fill="#93c5fd" radius={[3, 3, 0, 0]} />
          <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
