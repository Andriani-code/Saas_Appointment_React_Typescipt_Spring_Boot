export const Toast = ({ message }: { message: string }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-text text-white px-4 py-2 rounded-xl shadow-lg">
      {message}
    </div>
  );
};