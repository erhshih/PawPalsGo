import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { UserRole } from '@pawpals/shared';

const ACCESS_TOKEN_KEY = 'access_token';
const USER_ROLE_KEY = 'user_role';
const USER_ID_KEY = 'user_id';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  role: UserRole | null;
  isLoading: boolean;
  setTokens: (token: string, userId: string, role: UserRole) => Promise<void>;
  clearTokens: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userId: null,
  role: null,
  isLoading: true,

  setTokens: async (token, userId, role) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
      SecureStore.setItemAsync(USER_ID_KEY, userId),
      SecureStore.setItemAsync(USER_ROLE_KEY, role),
    ]);
    set({ accessToken: token, userId, role });
  },

  clearTokens: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_ID_KEY),
      SecureStore.deleteItemAsync(USER_ROLE_KEY),
    ]);
    set({ accessToken: null, userId: null, role: null });
  },

  loadFromStorage: async () => {
    try {
      const [token, userId, role] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(USER_ID_KEY),
        SecureStore.getItemAsync(USER_ROLE_KEY),
      ]);
      set({
        accessToken: token,
        userId,
        role: role as UserRole | null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
