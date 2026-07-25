
interface TabsProps {
  tabs: string[];
  active: string;
  setActive: (tab: string) => void;
}
export const Tabs = ({ tabs, active, setActive }: TabsProps) => {
  return (
    <div className="flex gap-2 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`px-4 py-2 ${
            active === tab
              ? "border-b-2 border-primary text-primary"
              : "text-text-secondary"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};