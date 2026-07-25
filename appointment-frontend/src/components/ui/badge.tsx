type BadgeProps = {
  variant?: "success" | "error" | "warning" | "info";
  children: React.ReactNode;
};

export const Badge = ({ variant = "info", children }: BadgeProps) => {
  const variants = {
    success: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
    warning: "bg-yellow-100 text-yellow-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-lg ${variants[variant]}`}>
      {children}
    </span>
  );
};