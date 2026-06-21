'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMyBookings } from '@/hooks/useBookings';
import BookingCard from '@/components/booking/BookingCard';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
};

export default function DashboardPage() {
  const { user, isAuthenticated, isCheckingAuth, openAuthModal } = useAuth();
  const router = useRouter();
  const { bookings, isLoading } = useMyBookings();

  useEffect(() => {
    if (isCheckingAuth) return;
    if (!isAuthenticated) {
      openAuthModal('login');
    }
  }, [isAuthenticated, isCheckingAuth, openAuthModal]);

  if (isCheckingAuth) return null;

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <p className="text-muted-foreground">Please log in to view your bookings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="w-16 h-16">
          <AvatarImage src={user?.profilePicture} alt={user?.name} />
          <AvatarFallback className="text-lg">{getInitials(user?.name || '')}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name || 'Explorer'}!</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here are your beach bookings and activities.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No bookings yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Explore our catalog and book your first adventure!
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors btn-press"
          >
            Explore Activities
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard key={booking._id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
