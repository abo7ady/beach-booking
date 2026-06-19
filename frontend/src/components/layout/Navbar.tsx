'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Heart, User, Menu, X, Waves, LogOut, MessageCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, openAuthModal, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  if (pathname?.startsWith('/admin/login')) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">
            Beach<span className="text-primary">Booking</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {!isAdmin && (
            <Link
              href="/"
              className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Explore
            </Link>
          )}

          {isAuthenticated && (
            <>
              {!isAdmin && (
                <>
                  <Link
                    href="/favorites"
                    className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1.5"
                  >
                    <Heart className="w-4 h-4" />
                    Favorites
                  </Link>
                  <Link
                    href="/dashboard"
                    className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    My Bookings
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-2 rounded-md text-sm font-medium text-primary hover:text-primary-hover hover:bg-accent transition-colors"
                >
                  Admin Panel
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right Section */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <NotificationBell />
              {!isAdmin && (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span>{user?.name || 'Profile'}</span>
                </Link>
              )}
              <a
                href="https://wa.me/201064866584"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline' }) + ' mr-2 flex items-center gap-2 whitespace-nowrap'}
              >
                <MessageCircle className="w-4 h-4" />
                Contact Us
              </a>
              <button
                onClick={logout}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/201064866584"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline' }) + ' mr-2 flex items-center gap-2 whitespace-nowrap'}
              >
                <MessageCircle className="w-4 h-4" />
                Contact Us
              </a>
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors btn-press"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-accent transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-border shadow-lg animate-slide-up">
          <div className="px-4 py-4 space-y-1">
            {!isAdmin && (
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Explore
              </Link>
            )}
            {isAuthenticated && (
              <>
                {!isAdmin && (
                  <>
                    <Link
                      href="/favorites"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      Favorites
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      My Bookings
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 rounded-md text-sm font-medium text-primary hover:bg-accent transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                {!isAdmin && (
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    Profile
                  </Link>
                )}
                <a
                  href="https://wa.me/201064866584"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline' }) + ' w-full justify-center mb-2 flex items-center gap-2 whitespace-nowrap'}
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact Us
                </a>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-red-50 transition-colors"
                >
                  Log Out
                </button>
              </>
            )}
            {!isAuthenticated && (
              <div className="pt-2 border-t border-border space-y-2">
                <a
                  href="https://wa.me/201064866584"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline' }) + ' w-full justify-center flex items-center gap-2 whitespace-nowrap'}
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact Us
                </a>
                <button
                  onClick={() => { openAuthModal('login'); setMobileOpen(false); }}
                  className="w-full px-4 py-2.5 rounded-md text-sm font-medium text-foreground border border-border hover:bg-accent transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => { openAuthModal('register'); setMobileOpen(false); }}
                  className="w-full px-4 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
