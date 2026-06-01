import { create } from 'zustand';

interface WalletState {
  balance: number;
  setBalance: (balance: number) => void;
  addBalance: (amount: number) => void;
  deductBalance: (amount: number) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 30,
  setBalance: (balance) => set({ balance }),
  addBalance: (amount) => set((s) => ({ balance: s.balance + amount })),
  deductBalance: (amount) => set((s) => ({ balance: Math.max(0, s.balance - amount) })),
}));
