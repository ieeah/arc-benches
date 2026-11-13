export type PersonalityProfile = {
  id: string;
  name: string;
  tagline: string;
  matrix: {
    pvp: number;
    pve: number;
    social: number;
  };
  biography: string;
  behavioral_rules: string[];
  winning_condition: string;
  recommended_loadout: {
    weapons: string;
    gadgets: string;
    playstyle_note: string;
  };
};
