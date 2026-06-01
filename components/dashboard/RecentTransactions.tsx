import Link from "next/link";
import { Transaction } from "@/types";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 10);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Recent Transactions</h3>
        <Link href="/transactions" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All →
        </Link>
      </div>
      {recent.length === 0 ? (
        <div className="px-5 py-8 text-center text-slate-400 text-sm">
          No transactions yet for this month
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {recent.map((tx) => (
            <div key={tx.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{tx.merchant}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(tx.transactionDate)}
                    {tx.budgetRow && <span className="ml-2 text-blue-500">{tx.budgetRow.label}</span>}
                    {!tx.budgetRow && <span className="ml-2 text-yellow-500">Unassigned</span>}
                  </p>
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-800 ml-4">
                {formatCurrency(typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
