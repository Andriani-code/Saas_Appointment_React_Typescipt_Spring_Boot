import { ReactNode } from "react";
import { cn } from "@/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  delay?: number;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  delay = 0,
  loading = false,
}: StatCardProps) {
  const trendUp = trend !== undefined && trend >= 0;

  return (
      <div
      className="card p-2 sm:p-3 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="w-6 h-6 rounded bg-soft flex items-center justify-center text-text">
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-[8px] font-medium px-1 py-0.5 rounded",
              trendUp ? "bg-soft text-text" : "bg-soft text-text",
            )}
          >
            {trendUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <p className="text-[8px] sm:text-[10px] text-muted mb-0.5 truncate">{title}</p>
      {loading ? (
        <div className="h-4 w-8 rounded bg-soft animate-pulse" />
      ) : (
        <p className="text-sm sm:text-lg font-display font-bold text-text">
          {value}
        </p>
      )}
    </div>
  );
}
