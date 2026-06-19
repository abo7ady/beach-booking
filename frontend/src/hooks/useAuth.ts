'use client';

import { useAuthStore } from '@/store/authStore';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const { user, token, openAuthModal, logout: storeLogout, setAuth } = useAuthStore();
  const router = useRouter();

  const logout = useCallback(() => {
    storeLogout();
    router.push('/');
  }, [storeLogout, router]);

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (isAuthenticated) {
        callback();
      } else {
        openAuthModal('login');
      }
    },
    [isAuthenticated, openAuthModal]
  );

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    requireAuth,
    openAuthModal,
    logout,
    setAuth,
  };
};
