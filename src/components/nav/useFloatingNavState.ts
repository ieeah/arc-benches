import { useState } from 'react';
import { useAppStore } from '@/store';
import { isSectionActive } from '@/lib/sections';

export type FloatingNavState = {
  activeProfileId: string;
  activeProfileName: string;
  profilesDrawerOpen: boolean;
  setProfilesDrawerOpen: (open: boolean) => void;
  isRaidActive: boolean;
  hasRaidElements: boolean;
  isRaidRunning: boolean;
};

export const useFloatingNavState = (): FloatingNavState => {
  const [profilesDrawerOpen, setProfilesDrawerOpen] = useState(false);

  const activeProfileId = useAppStore(s => s.activeProfileId);
  const activeProfileName = useAppStore(
    s => s.profiles.find(p => p.id === s.activeProfileId)?.name ?? 'Principale'
  );

  // Stato Raid Plan (#117, #102)
  const raidPlan = useAppStore(s => s.raidPlan);
  const enabledSections = useAppStore(s => s.enabledSections);
  const isRaidActive = isSectionActive('raid', { enabledSections });
  const hasRaidElements =
    isRaidActive &&
    ((raidPlan?.actions?.length ?? 0) > 0 || (raidPlan?.items?.length ?? 0) > 0);
  const isRaidRunning = isRaidActive && (raidPlan?.isRaidRunning ?? false);

  return {
    activeProfileId,
    activeProfileName,
    profilesDrawerOpen,
    setProfilesDrawerOpen,
    isRaidActive,
    hasRaidElements,
    isRaidRunning,
  };
};
