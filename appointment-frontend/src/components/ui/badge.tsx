type BadgeProps = {
  variant?: "success" | "error" | "warning" | "info";
  children: React.ReactNode;
};

export const Badge = ({ variant = "info", children }: BadgeProps) => {
  const variants = {
    success: "bg-accent/10 text-accent",
    error: "bg-accent/10 text-accent",
    warning: "bg-accent/10 text-accent",
    info: "bg-primary/10 text-primary",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-lg ${variants[variant]}`}>
      {children}
    </span>
  );
};