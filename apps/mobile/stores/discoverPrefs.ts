import { create } from 'zustand';

export const GENDER_TO_API: Record<string, string> = {
  '男性': 'MALE',
  '女性': 'FEMALE',
  '多元性別': 'OTHER',
};

interface DiscoverPrefsState {
  radius: number;
  showMore: boolean;
  genderFilter: string[];
  roleFilter: 'OWNER' | 'LOVER' | null;
  setRadius: (radius: number) => void;
  setShowMore: (v: boolean) => void;
  setGenderFilter: (g: string[]) => void;
  toggleGender: (g: string) => void;
  setRoleFilter: (r: 'OWNER' | 'LOVER' | null) => void;
  getGenderParam: () => string | undefined;
  getRoleParam: () => string | undefined;
}

export const useDiscoverPrefs = create<DiscoverPrefsState>((set, get) => ({
  radius: 50,
  showMore: true,
  genderFilter: ['男性', '女性', '多元性別'],
  roleFilter: null,
  setRadius: (radius) => set({ radius }),
  setShowMore: (showMore) => set({ showMore }),
  setGenderFilter: (genderFilter) => set({ genderFilter }),
  toggleGender: (g) =>
    set((s) => ({
      genderFilter: s.genderFilter.includes(g)
        ? s.genderFilter.filter((x) => x !== g)
        : [...s.genderFilter, g],
    })),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  getGenderParam: () => {
    const { genderFilter } = get();
    if (genderFilter.length === 0 || genderFilter.length === 3) return undefined;
    return genderFilter.map((g) => GENDER_TO_API[g]).filter(Boolean).join(',');
  },
  getRoleParam: () => {
    const { roleFilter } = get();
    return roleFilter ?? undefined;
  },
}));
