type CardProps = {
  children: React.ReactNode;
  clickable?: boolean;
};

export const Card = ({ children, clickable }: CardProps) => {
  return (
    <div
      className={`bg-surface border border-border rounded-2xl p-4 shadow-sm transition
      ${clickable ? "hover:shadow-md hover:scale-[1.01] cursor-pointer" : ""}`}
    >
      {children}
    </div>
  );
};