'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Waves } from 'lucide-react';
import api from '@/lib/api';
import { Activity } from '@/types';
import { formatPrice } from '@/lib/utils';
import ActivityForm from '@/components/admin/ActivityForm';

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | undefined>();

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities/admin/all?limit=100');
      setActivities(res.data.activities);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleToggleActive = async (activity: Activity) => {
    try {
      await api.patch(`/activities/${activity._id}`, {
        isActive: !activity.isActive,
      });
      fetchActivities();
    } catch (err) {
      console.error('Failed to toggle active:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this activity? This will also remove any related bookings.')) return;
    try {
      await api.delete(`/activities/${id}/hard`);
      fetchActivities();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Activities</h1>
        <button
          onClick={() => { setEditActivity(undefined); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors btn-press"
        >
          <Plus className="w-4 h-4" />
          Add Activity
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Activity</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Score</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Status</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity._id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {activity.images?.[0] ? (
                          <img src={activity.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Waves className="w-4 h-4 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        {activity.isTrending && (
                          <span className="text-xs text-rose-600">🔥 Trending</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {activity.popularityScore}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      activity.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {activity.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditActivity(activity); setShowForm(true); }}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(activity)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title={activity.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {activity.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(activity._id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-red-50 hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activities.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No activities yet. Click &quot;Add Activity&quot; to get started.
            </div>
          )}
        </div>
      )}

      {showForm && (
        <ActivityForm
          activity={editActivity}
          onClose={() => setShowForm(false)}
          onSuccess={fetchActivities}
        />
      )}
    </div>
  );
}
