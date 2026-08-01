type BadgeProps = {
  variant?: "success" | "error" | "warning" | "info";
  children: React.ReactNode;
};

export const Badge = ({ variant = "info", children }: BadgeProps) => {
  const variants = {
    success: "bg-success/15 text-success-300",
    error: "bg-danger/15 text-danger-300",
    warning: "bg-warning/15 text-warning-300",
    info: "bg-primary/15 text-primary-300",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-lg ${variants[variant]}`}>
      {children}
    </span>
  );
};