import { cn } from "@/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rect" | "circle" | "card";
}

export function Skeleton({
  className,
  variant = "text",
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: "h-4 rounded",
    rect: "rounded-xl",
    circle: "rounded-full",
    card: "rounded-card",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-soft",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}