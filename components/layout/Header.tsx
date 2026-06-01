"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "Monthly Dashboard",
  "/transactions": "Transactions",
  "/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();

  let title = "Budget App";
  if (pathname.startsWith("/budget/")) {
    title = "Budget Detail";
  } else {
    title = pageTitles[pathname] || "Budget App";
  }

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">Family Budget</span>
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          FB
        </div>
      </div>
    </header>
  );
}
