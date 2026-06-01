import { Transaction, BudgetRowWithCategory } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface CreditCardSummaryProps {
  transactions: Transaction[];
  rows: BudgetRowWithCategory[];
}

export default function CreditCardSummary({ transactions, rows }: CreditCardSummaryProps) {
  const total = transactions.reduce((s, t) => {
    const amt = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
    return s + amt;
  }, 0);

  // Group by category
  const byCategory: Record<string, { name: string; icon: string; amount: number }> = {};
  for (const tx of transactions) {
    if (tx.budgetRowId) {
      const row = rows.find((r) => r.id === tx.budgetRowId);
      if (row) {
        const catName = row.category.name;
        if (!byCategory[catName]) {
          byCategory[catName] = { name: catName, icon: row.category.icon || "", amount: 0 };
        }
        byCategory[catName].amount += typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
      }
    } else {
      if (!byCategory["Unassigned"]) {
        byCategory["Unassigned"] = { name: "Unassigned", icon: "❓", amount: 0 };
      }
      byCategory["Unassigned"].amount += typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
    }
  }

  const categoryList = Object.values(byCategory).sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">Credit Card Spending</h3>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500">Total Spent This Month</span>
          <span className="text-2xl font-bold text-slate-800">{formatCurrency(total)}</span>
        </div>
        {categoryList.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No transactions recorded yet</p>
        ) : (
          <div className="space-y-2">
            {categoryList.slice(0, 8).map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{cat.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-slate-600">{cat.name}</span>
                    <span className="text-xs font-medium text-slate-700">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: total > 0 ? `${Math.min((cat.amount / total) * 100, 100)}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
