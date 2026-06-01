import { formatCurrency } from "@/lib/formatters";
import clsx from "clsx";

interface SavingsCardProps {
  totalIncome: number;
  totalExpenses: number;
}

export default function SavingsCard({ totalIncome, totalExpenses }: SavingsCardProps) {
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  const isPositive = netSavings >= 0;

  return (
    <div className={clsx(
      "rounded-xl shadow-sm border overflow-hidden",
      isPositive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
    )}>
      <div className="px-5 py-4 border-b border-opacity-50 border-green-200">
        <h3 className="font-semibold text-slate-800">Monthly Savings</h3>
      </div>
      <div className="px-5 py-6">
        <div className="flex items-end gap-6 flex-wrap">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Net Savings</p>
            <p className={clsx(
              "text-4xl font-bold",
              isPositive ? "text-green-700" : "text-red-600"
            )}>
              {formatCurrency(netSavings)}
            </p>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Income</p>
              <p className="text-xl font-semibold text-slate-700">{formatCurrency(totalIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Expenses</p>
              <p className="text-xl font-semibold text-slate-700">{formatCurrency(totalExpenses)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Savings Rate</p>
              <p className={clsx(
                "text-xl font-semibold",
                savingsRate >= 20 ? "text-green-600" : savingsRate >= 10 ? "text-yellow-600" : "text-red-500"
              )}>
                {savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
