'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  targetUrl?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const typeBadge: Record<string, { label: string; cls: string }> = {
  register: { label: 'Registration', cls: 'bg-emerald-100 text-emerald-700' },
  booking_new: { label: 'New Booking', cls: 'bg-sky-100 text-sky-700' },
  booking_status: { label: 'Status Update', cls: 'bg-amber-100 text-amber-700' },
  system: { label: 'System', cls: 'bg-zinc-100 text-zinc-700' },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // ── Fetch ────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/notifications/all?page=${page}&limit=20`);
      setNotifications(res.data.notifications);
      setPagination(res.data.pagination);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    fetchData();
  }, [isAuthenticated, page]);

  // ── Actions ──────────────────────────────────────────────
  const toggleRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: !n.isRead } : n))
    );
    await api.put(`/notifications/${id}/toggle`);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await api.put('/notifications/mark-all-read');
  };

  const handleRowClick = async (notif: Notification) => {
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
      api.put(`/notifications/${notif._id}/read`);
    }
    if (notif.targetUrl) {
      router.push(notif.targetUrl);
    }
  };

  // ── Guard ────────────────────────────────────────────────
  if (!isAuthenticated) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          </div>
          {pagination && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {pagination.total}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-[72px] rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            All caught up!
          </h2>
          <p className="text-sm text-muted-foreground">
            New notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card divide-y divide-border">
          {notifications.map((notif) => {
            const badge = typeBadge[notif.type] || typeBadge.system;
            return (
              <div
                key={notif._id}
                onClick={() => handleRowClick(notif)}
                className={`px-4 py-4 flex items-start gap-3.5 transition-colors hover:bg-muted/60 cursor-pointer ${
                  !notif.isRead ? 'bg-sky-50/50' : ''
                }`}
              >
                {/* Read/Unread dot (clickable to toggle) */}
                <div className="pt-1.5 shrink-0">
                  <span
                    role="button"
                    title={notif.isRead ? 'Mark unread' : 'Mark read'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRead(notif._id);
                    }}
                    className={`block w-2.5 h-2.5 rounded-full cursor-pointer transition-colors ${
                      !notif.isRead
                        ? 'bg-sky-500 hover:bg-sky-700'
                        : 'bg-border hover:bg-sky-400'
                    }`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-sm leading-snug ${
                        !notif.isRead
                          ? 'font-semibold text-foreground'
                          : 'font-medium text-foreground/80'
                      }`}
                    >
                      {notif.title}
                    </p>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{notif.message}</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatDate(notif.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
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
            onClick={() => setPage((p) => Math.min(pagination!.pages, p + 1))}
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
