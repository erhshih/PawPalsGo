'use client';
import { create } from 'zustand';
import { UserRole } from '@pawpals/shared';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  role: UserRole | null;
  setTokens: (token: string, userId: string, role: UserRole) => void;
  clearTokens: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userId: null,
  role: null,

  setTokens: (token, userId, role) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_id', userId);
    localStorage.setItem('user_role', role);
    set({ accessToken: token, userId, role });
  },

  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    set({ accessToken: null, userId: null, role: null });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('access_token');
    const userId = localStorage.getItem('user_id');
    const role = localStorage.getItem('user_role') as UserRole | null;
    set({ accessToken: token, userId, role });
  },
}));
