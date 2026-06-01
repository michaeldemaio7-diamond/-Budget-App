"use client";

import { formatMonthYear, prevMonth, nextMonth, toMonthYearString } from "@/lib/formatters";
import { useRouter } from "next/navigation";

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange?: (month: number, year: number) => void;
  basePath?: string; // if set, navigates to basePath/YYYY-MM on change
}

export default function MonthSelector({ month, year, onChange, basePath }: MonthSelectorProps) {
  const router = useRouter();

  const handlePrev = () => {
    const prev = prevMonth(month, year);
    if (basePath) {
      router.push(`${basePath}/${toMonthYearString(prev.month, prev.year)}`);
    }
    onChange?.(prev.month, prev.year);
  };

  const handleNext = () => {
    const next = nextMonth(month, year);
    if (basePath) {
      router.push(`${basePath}/${toMonthYearString(next.month, next.year)}`);
    }
    onChange?.(next.month, next.year);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePrev}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
        aria-label="Previous month"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 className="text-xl font-bold text-slate-800 min-w-[160px] text-center">
        {formatMonthYear(month, year)}
      </h2>
      <button
        onClick={handleNext}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
        aria-label="Next month"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
