'use client';

import { useAuthStore } from '@/store/authStore';
import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const { user, token, openAuthModal, logout: storeLogout, setAuth } = useAuthStore();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // If store is already hydrated, set checking to false
    if (useAuthStore.persist.hasHydrated()) {
      setIsCheckingAuth(false);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => {
        setIsCheckingAuth(false);
      });
      return () => unsub();
    }
  }, []);

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
