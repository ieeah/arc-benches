import { createContext, useContext, useState, useEffect, type ReactNode, type Ref } from 'react';

export type DockPrimaryAction = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export type DockSecondaryAction = {
  id: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
  buttonRef?: Ref<HTMLButtonElement>;
};

export type FloatingNavDockConfig = {
  primary?: DockPrimaryAction;
  secondary?: DockSecondaryAction[];
};

type FloatingNavDockContextValue = {
  dock: FloatingNavDockConfig | null;
  setDock: (dock: FloatingNavDockConfig | null) => void;
};

const FloatingNavDockContext = createContext<FloatingNavDockContextValue>({
  dock: null,
  setDock: () => {},
});

export const FloatingNavDockProvider = ({ children }: { children: ReactNode }) => {
  const [dock, setDock] = useState<FloatingNavDockConfig | null>(null);
  return (
    <FloatingNavDockContext.Provider value={{ dock, setDock }}>
      {children}
    </FloatingNavDockContext.Provider>
  );
};

export const useFloatingNavDock = () => useContext(FloatingNavDockContext).dock;

export const useSetFloatingNavDock = (config: FloatingNavDockConfig | null) => {
  const { setDock } = useContext(FloatingNavDockContext);

  useEffect(() => {
    setDock(config);
    return () => setDock(null);
  }, [config, setDock]);
};
