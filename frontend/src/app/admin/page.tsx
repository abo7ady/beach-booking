'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import api from '@/lib/api';

interface Stats {
  newBookings: number;
  confirmed: number;
  totalActivities: number;
  totalBookings: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bookingsRes, activitiesRes] = await Promise.all([
          api.get('/bookings?limit=1000'),
          api.get('/activities/admin/all?limit=1000'),
        ]);

        const bookings = bookingsRes.data.bookings || [];
        const newB = bookings.filter((b: any) => b.status === 'New').length;
        const confirmed = bookings.filter((b: any) => b.status === 'Confirmed').length;

        setStats({
          newBookings: newB,
          confirmed,
          totalActivities: activitiesRes.data.pagination?.total || 0,
          totalBookings: bookingsRes.data.pagination?.total || 0,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="New Bookings"
            value={stats?.newBookings || 0}
            icon={CalendarCheck}
            color="text-blue-600"
          />
          <StatsCard
            title="Confirmed"
            value={stats?.confirmed || 0}
            icon={CheckCircle}
            color="text-emerald-600"
          />
          <StatsCard
            title="Total Bookings"
            value={stats?.totalBookings || 0}
            icon={TrendingUp}
            color="text-amber-600"
          />
          <StatsCard
            title="Activities"
            value={stats?.totalActivities || 0}
            icon={Activity}
            color="text-primary"
          />
        </div>
      )}
    </div>
  );
}
