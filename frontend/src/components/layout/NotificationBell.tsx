'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  targetUrl?: string;
  createdAt: string;
}

const fetcher = (url: string) => api.get(url).then((r) => r.data.notifications);

export default function NotificationBell() {
  const router = useRouter();
  const { data: notifications, mutate } = useSWR<Notification[]>(
    '/notifications',
    fetcher,
    { refreshInterval: 30000 }
  );
  const [open, setOpen] = useState(false);

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  // ── Toggle read/unread for a single notification ─────────
  const toggleRead = (id: string) => {
    const target = notifications?.find((n) => n._id === id);
    if (!target) return;
    mutate(
      notifications?.map((n) =>
        n._id === id ? { ...n, isRead: !n.isRead } : n
      ),
      false
    );
    api.put(`/notifications/${id}/toggle`).then(() => mutate());
  };

  // ── Mark all as read ─────────────────────────────────────
  const markAllAsRead = () => {
    mutate(
      notifications?.map((n) => ({ ...n, isRead: true })),
      false
    );
    api.put('/notifications/mark-all-read').then(() => mutate());
  };

  // ── Click a notification row → mark read + navigate ──────
  const handleRowClick = (notif: Notification) => {
    if (!notif.isRead) {
      mutate(
        notifications?.map((n) =>
          n._id === notif._id ? { ...n, isRead: true } : n
        ),
        false
      );
      api.put(`/notifications/${notif._id}/read`).then(() => mutate());
    }
    setOpen(false);
    if (notif.targetUrl) {
      setTimeout(() => router.push(notif.targetUrl!), 60);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* ── Trigger ─────────────────────────────────────── */}
      <PopoverTrigger className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      {/* ── Content ─────────────────────────────────────── */}
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span
              role="button"
              onMouseDown={(e) => { e.preventDefault(); markAllAsRead(); }}
              className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer select-none"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </span>
          )}
        </div>

        {/* List */}
        <div className="max-h-[320px] overflow-y-auto">
          {!notifications ? (
            <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  role="button"
                  tabIndex={0}
                  onMouseDown={(e) => { e.preventDefault(); handleRowClick(notif); }}
                  className={`px-4 py-3 flex items-start gap-3 cursor-pointer select-none transition-colors hover:bg-muted ${
                    !notif.isRead ? 'bg-sky-50/60' : ''
                  }`}
                >
                  {/* Read/Unread dot */}
                  <div className="pt-1.5 shrink-0">
                    <span
                      role="button"
                      title={notif.isRead ? 'Mark unread' : 'Mark read'}
                      onMouseDown={(e) => {
                        e.preventDefault();
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

                  {/* Text */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p
                      className={`text-sm leading-snug ${
                        !notif.isRead
                          ? 'font-semibold text-foreground'
                          : 'font-medium text-muted-foreground'
                      }`}
                    >
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {formatDate(notif.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5">
          <div
            role="button"
            tabIndex={0}
            onMouseDown={(e) => {
              e.preventDefault();
              setOpen(false);
              setTimeout(() => router.push('/notifications'), 60);
            }}
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer select-none"
          >
            <ExternalLink className="w-3 h-3" />
            View all notifications
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
