import { getStatusColor, formatPercent } from "@/lib/formatters";
import clsx from "clsx";

interface StatusBadgeProps {
  percentUsed: number;
  showPercent?: boolean;
  size?: "sm" | "md";
}

export default function StatusBadge({
  percentUsed,
  showPercent = true,
  size = "sm",
}: StatusBadgeProps) {
  const colors = getStatusColor(percentUsed);

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-medium",
        colors.badge,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      )}
    >
      {showPercent ? formatPercent(percentUsed, 0) : percentUsed >= 100 ? "Over" : percentUsed >= 90 ? "Critical" : percentUsed >= 75 ? "Warning" : "OK"}
    </span>
  );
}
