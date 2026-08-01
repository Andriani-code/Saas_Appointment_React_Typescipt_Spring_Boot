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
      className="card p-4 sm:p-5 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-soft flex items-center justify-center text-text">
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md",
              trendUp ? "bg-soft text-text" : "bg-soft text-text",
            )}
          >
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <p className="text-xs sm:text-sm text-muted mb-1 truncate">{title}</p>
      {loading ? (
        <div className="h-8 w-16 rounded-lg bg-soft animate-pulse" />
      ) : (
        <p className="text-2xl sm:text-3xl font-display font-bold text-text">
          {value}
        </p>
      )}
    </div>
  );
}
