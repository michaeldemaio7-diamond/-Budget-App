/**
 * Format a number as USD currency
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: { showSign?: boolean } = {}
): string {
  if (amount === null || amount === undefined) return "$0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "$0.00";

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(num));

  if (options.showSign) {
    if (num > 0) return `+${formatted}`;
    if (num < 0) return `-${formatted}`;
  }

  if (num < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Format a number as a percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a date as "Month YYYY" (e.g., "June 2026")
 */
export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Format a date as "MMM D" (e.g., "Jun 2")
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format a date as "MM/DD/YYYY"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US");
}

/**
 * Get color class based on percentage used
 */
export function getStatusColor(percentUsed: number): {
  text: string;
  bg: string;
  badge: string;
} {
  if (percentUsed >= 100) {
    return {
      text: "text-red-600",
      bg: "bg-red-50",
      badge: "bg-red-100 text-red-700",
    };
  }
  if (percentUsed >= 90) {
    return {
      text: "text-red-500",
      bg: "bg-red-50",
      badge: "bg-red-100 text-red-600",
    };
  }
  if (percentUsed >= 75) {
    return {
      text: "text-yellow-600",
      bg: "bg-yellow-50",
      badge: "bg-yellow-100 text-yellow-700",
    };
  }
  return {
    text: "text-green-600",
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-700",
  };
}

/**
 * Convert monthYear string "YYYY-MM" to { month, year }
 */
export function parseMonthYear(monthYear: string): { month: number; year: number } {
  const [yearStr, monthStr] = monthYear.split("-");
  return { year: parseInt(yearStr), month: parseInt(monthStr) };
}

/**
 * Convert { month, year } to "YYYY-MM" string
 */
export function toMonthYearString(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Get previous month
 */
export function prevMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

/**
 * Get next month
 */
export function nextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 12) return { month: 1, year: year + 1 };
  return { month: month + 1, year };
}
