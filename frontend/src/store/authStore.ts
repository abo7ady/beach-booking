import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthModalOpen: false,
      authModalTab: 'login',

      setAuth: (token, user) => set({ token, user, isAuthModalOpen: false }),

      logout: () => set({ user: null, token: null }),

      openAuthModal: (tab = 'login') =>
        set({ isAuthModalOpen: true, authModalTab: tab }),

      closeAuthModal: () => set({ isAuthModalOpen: false }),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'beach-booking-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
