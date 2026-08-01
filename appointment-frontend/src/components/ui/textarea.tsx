export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return (
    <textarea
      {...props}
      className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
    />
  );
};