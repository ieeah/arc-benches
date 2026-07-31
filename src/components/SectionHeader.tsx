import type { ReactNode } from 'react';

export const SectionHeader = ({
  title,
  leading,
  actions,
}: {
  title: string;
  leading?: ReactNode;
  actions?: ReactNode;
}) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-3 min-w-0">
      {leading}
      <h1 className="text-2xl font-bold truncate">{title}</h1>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
