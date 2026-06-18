import { Database } from "lucide-react";
import { IconButton } from "./IconButton";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Page title bar. Universal elements keep a fixed position on every page:
 * theme toggle is always rightmost, the Database button (when present) always
 * sits right next to it. Tab-specific `actions` are added to their left.
 * `leading` renders before the title (e.g. a back button).
 */
export const SectionHeader = ({
  title,
  leading,
  actions,
  onOpenDatabase,
}: {
  title: string;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  onOpenDatabase?: () => void;
}) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-3 min-w-0">
      {leading}
      <h1 className="text-2xl font-bold truncate">{title}</h1>
    </div>
    <div className="flex items-center gap-2">
      {actions}
      {onOpenDatabase && (
        <IconButton onClick={onOpenDatabase} title="Database oggetti">
          <Database size={14} className="text-gray-500" />
        </IconButton>
      )}
      <ThemeToggle />
    </div>
  </div>
);
