/** Round 32px icon button used across all headers — universal elements share this exact look. */
export const IconButton = ({ onClick, title, children }: {
  onClick: () => void; title?: string; children: React.ReactNode;
}) => (
  <button onClick={onClick} title={title}
    className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full transition-colors shrink-0">
    {children}
  </button>
);
