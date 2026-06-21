'use client';

import { useAuthStore } from '@/store/authStore';
import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export const useAuth = () => {
  const { user, token, openAuthModal, logout: storeLogout, setAuth, updateUser } = useAuthStore();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const syncProfile = async () => {
      // Wait for Zustand to hydrate from localStorage
      if (!useAuthStore.persist.hasHydrated()) {
        await new Promise<void>((resolve) => {
          const unsub = useAuthStore.persist.onFinishHydration(() => {
            unsub();
            resolve();
          });
        });
      }

      // After hydration, if we have a token, re-fetch the profile to stay in sync
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        try {
          const res = await api.get('/profile');
          if (res.data.user) {
            updateUser(res.data.user);
          }
        } catch {
          // Token might be expired/invalid — don't crash, let normal auth flow handle it
        }
      }

      setIsCheckingAuth(false);
    };

    syncProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  const logout = useCallback(() => {
    storeLogout();
    router.push('/');
  }, [storeLogout, router]);

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (isCheckingAuth) return; // Do nothing if still hydrating/checking
      if (isAuthenticated) {
        callback();
      } else {
        openAuthModal('login');
      }
    },
    [isAuthenticated, isCheckingAuth, openAuthModal]
  );

  return {
    user,
    token,
    isAuthenticated,
    isCheckingAuth,
    isLoading: isCheckingAuth,
    isAdmin,
    requireAuth,
    openAuthModal,
    logout,
    setAuth,
  };
};
