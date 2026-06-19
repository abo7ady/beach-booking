'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoginPage && (!isAuthenticated || !isAdmin)) {
      router.push('/admin/login');
    }
  }, [isMounted, isAuthenticated, isAdmin, isLoginPage, router]);

  // Login page doesn't need the admin layout wrapper
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isMounted) {
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
