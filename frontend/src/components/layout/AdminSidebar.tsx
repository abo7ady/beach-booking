'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Waves, CalendarCheck, LogOut, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/activities', icon: Waves, label: 'Activities' },
  { href: '/admin/bookings', icon: CalendarCheck, label: 'Bookings' },
  { href: '/admin/users', icon: Users, label: 'Users' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <aside className="w-[250px] min-h-screen border-r border-border bg-muted/50 px-4 py-6 sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="py-2 px-3 mb-6">
        <div className="flex items-center gap-2 px-6 py-6 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Waves className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Top<span className="text-primary">Guide Admin</span>
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="space-y-1 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-destructive transition-colors mt-auto"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </aside>
  );
}
