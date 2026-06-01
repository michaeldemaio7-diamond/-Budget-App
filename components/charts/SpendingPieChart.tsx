"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BudgetRowWithCategory } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface SpendingPieChartProps {
  rows: BudgetRowWithCategory[];
}

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6366f1",
];

interface ChartDataItem {
  name: string;
  value: number;
  icon: string;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataItem; value: number }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-slate-800">{data.payload.icon} {data.payload.name}</p>
        <p className="text-blue-600 font-bold">{formatCurrency(data.value)}</p>
      </div>
    );
  }
  return null;
};

export default function SpendingPieChart({ rows }: SpendingPieChartProps) {
  // Group by category
  const byCategory: Record<string, { name: string; icon: string; value: number }> = {};
  for (const row of rows) {
    const actual = typeof row.actualAmount === "string" ? parseFloat(row.actualAmount) : row.actualAmount;
    if (actual <= 0) continue;
    const cat = row.category.name;
    if (!byCategory[cat]) {
      byCategory[cat] = { name: cat, icon: row.category.icon || "", value: 0 };
    }
    byCategory[cat].value += actual;
  }

  const data = Object.values(byCategory).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Spending by Category</h3>
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          No spending data yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-800 mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
