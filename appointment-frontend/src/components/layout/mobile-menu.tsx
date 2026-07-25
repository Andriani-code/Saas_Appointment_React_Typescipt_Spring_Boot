export const MobileMenu = ({ open }: { open: boolean }) => {
  return (
    <div
      className={`fixed inset-0 bg-black/40 z-50 transition ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white w-64 h-full p-6">
        Menu
      </div>
    </div>
  );
};