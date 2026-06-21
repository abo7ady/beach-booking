'use client';

import { Booking, Activity } from '@/types';
import { formatDate, formatPrice } from '@/lib/utils';
import BookingStatusBadge from './BookingStatusBadge';
import { Calendar, Waves } from 'lucide-react';

interface BookingCardProps {
  booking: Booking;
}

export default function BookingCard({ booking }: BookingCardProps) {
  const activity = booking.activity as Activity;

  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow animate-fade-in">
      <div className="flex gap-4">
        {/* Activity Image */}
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          {activity?.images?.[0] ? (
            <img
              src={activity.images[0]}
              alt={activity.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Waves className="w-6 h-6 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm text-foreground truncate">
              {activity?.title || 'Activity'}
            </h4>
            <BookingStatusBadge status={booking.status} />
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formatDate(booking.desiredDate)}
          </div>
          <p className="text-primary text-sm font-semibold mt-1">
            {booking.numberOfPersons} Person{booking.numberOfPersons !== 1 && 's'} - Total: ${booking.totalPrice || (activity?.price ? activity.price * (booking.numberOfPersons || 1) : 0)}
          </p>
          {booking.adminNote && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              Note: {booking.adminNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
