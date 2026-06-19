'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import ActivityGrid from '@/components/activity/ActivityGrid';
import BookingModal from '@/components/booking/BookingModal';
import { Activity } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popularity');
  const [page, setPage] = useState(1);
  const [bookingActivity, setBookingActivity] = useState<Activity | null>(null);

  const { activities, pagination, isLoading } = useActivities({
    page,
    search: search || undefined,
    sort,
  });

  const { requireAuth } = useAuth();

  const handleBook = (activity: Activity) => {
    requireAuth(() => setBookingActivity(activity));
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
          Discover Beach <span className="text-primary">Adventures</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Book unforgettable beach activities, water sports, and coastal experiences. 
          Your next adventure starts here.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search activities..."
            className="w-full h-10 rounded-md border border-input bg-white pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="h-10 rounded-md border border-input bg-white px-3 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="popularity">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Activity Grid */}
      <ActivityGrid
        activities={activities}
        isLoading={isLoading}
        onBook={handleBook}
      />

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-12">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-md border border-border text-sm font-medium disabled:opacity-50 hover:bg-accent transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
            className="px-4 py-2 rounded-md border border-border text-sm font-medium disabled:opacity-50 hover:bg-accent transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Booking Modal */}
      {bookingActivity && (
        <BookingModal
          activity={bookingActivity}
          onClose={() => setBookingActivity(null)}
          onSuccess={() => {
            setBookingActivity(null);
          }}
        />
      )}
    </div>
  );
}
