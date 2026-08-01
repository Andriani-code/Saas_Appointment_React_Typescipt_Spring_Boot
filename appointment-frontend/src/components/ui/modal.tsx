type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const Modal = ({ open, onClose, children }: ModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-background p-6 rounded-2xl w-full max-w-md">
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};