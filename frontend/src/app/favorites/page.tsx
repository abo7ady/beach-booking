'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import ActivityGrid from '@/components/activity/ActivityGrid';
import BookingModal from '@/components/booking/BookingModal';
import { Activity } from '@/types';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FavoritesPage() {
  const { isAuthenticated, requireAuth, openAuthModal } = useAuth();
  const { favorites, isLoading } = useFavorites();
  const [bookingActivity, setBookingActivity] = useState<Activity | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('login');
    }
  }, [isAuthenticated, openAuthModal]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <p className="text-muted-foreground">Please log in to view favorites.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-6 h-6 text-rose-500" />
        <h1 className="text-2xl font-bold text-foreground">My Favorites</h1>
      </div>

      {!isLoading && favorites.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">💕</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No favorites yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Tap the heart icon on activities to save them here
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors btn-press"
          >
            Explore Activities
          </button>
        </div>
      ) : (
        <ActivityGrid
          activities={favorites}
          isLoading={isLoading}
          onBook={(a) => requireAuth(() => setBookingActivity(a))}
        />
      )}

      {bookingActivity && (
        <BookingModal
          activity={bookingActivity}
          onClose={() => setBookingActivity(null)}
          onSuccess={() => setBookingActivity(null)}
        />
      )}
    </div>
  );
}
