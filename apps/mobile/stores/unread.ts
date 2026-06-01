import { create } from 'zustand';

interface UnreadStore {
  perMatch: Record<string, number>;
  setAll: (entries: { matchId: string; count: number }[]) => void;
  increment: (matchId: string) => void;
  clear: (matchId: string) => void;
}

export const useUnreadStore = create<UnreadStore>((set) => ({
  perMatch: {},
  setAll: (entries) =>
    set({
      perMatch: Object.fromEntries(entries.map(({ matchId, count }) => [matchId, count])),
    }),
  increment: (matchId) =>
    set((s) => ({ perMatch: { ...s.perMatch, [matchId]: (s.perMatch[matchId] ?? 0) + 1 } })),
  clear: (matchId) =>
    set((s) => ({ perMatch: { ...s.perMatch, [matchId]: 0 } })),
}));
