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
      className="card p-3 sm:p-4 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-md bg-soft flex items-center justify-center text-text">
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
              trendUp ? "bg-soft text-text" : "bg-soft text-text",
            )}
          >
            {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <p className="text-[10px] sm:text-xs text-muted mb-1 truncate">{title}</p>
      {loading ? (
        <div className="h-6 w-12 rounded bg-soft animate-pulse" />
      ) : (
        <p className="text-xl sm:text-2xl font-display font-bold text-text">
          {value}
        </p>
      )}
    </div>
  );
}
