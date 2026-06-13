export const TabButton = ({ active, onClick, icon: Icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size: number }>;
  label: string;
}) => (
  <button onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-3 transition-colors ${active ? 'text-blue-500' : 'text-gray-500'}`}>
    <Icon size={24} />
    <span className="text-xs mt-1">{label}</span>
  </button>
);
