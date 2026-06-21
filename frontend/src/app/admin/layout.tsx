'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isCheckingAuth } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isCheckingAuth && (!isAuthenticated || !isAdmin)) {
      router.push('/');
    }
  }, [isMounted, isCheckingAuth, isAuthenticated, isAdmin, router]);

  if (!isMounted || isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center -mt-16 pt-16">
        <div className="animate-pulse text-muted-foreground">Checking authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="flex min-h-screen -mt-16 pt-16">
      <AdminSidebar />
      <div className="flex-1 p-8 bg-muted/20">{children}</div>
    </div>
  );
}
