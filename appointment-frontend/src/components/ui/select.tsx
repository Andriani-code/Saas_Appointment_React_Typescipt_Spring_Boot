type SelectProps = {
  options: { label: string; value: string }[];
};

export const Select = ({ options }: SelectProps) => {
  return (
    <select className="w-full px-4 py-2 rounded-xl border border-border bg-white focus:ring-2 focus:ring-primary">
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};