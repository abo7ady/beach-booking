'use client';

import { useState } from 'react';
import { useAdminBookings } from '@/hooks/useBookings';
import { Booking, User as UserType, Activity } from '@/types';
import { formatDate } from '@/lib/utils';
import StatusDropdown from '@/components/admin/StatusDropdown';
import ContactGrid from '@/components/admin/ContactGrid';

export default function AdminBookingsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const { bookings, pagination, isLoading, mutate } = useAdminBookings(page, statusFilter || undefined);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Booking Queue</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-md border border-input text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">User</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Activity</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Date</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Contact</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking: Booking) => {
                  const user = booking.user as UserType;
                  const activity = booking.activity as Activity;
                  return (
                    <tr key={booking._id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{user?.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {activity?.title || 'Activity'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(booking.desiredDate)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusDropdown
                          bookingId={booking._id}
                          currentStatus={booking.status}
                          onUpdate={() => mutate()}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {user && <ContactGrid user={user} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {bookings.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No bookings found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-md border border-border text-sm disabled:opacity-50 hover:bg-accent transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
            className="px-4 py-2 rounded-md border border-border text-sm disabled:opacity-50 hover:bg-accent transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
