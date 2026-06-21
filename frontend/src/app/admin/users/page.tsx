'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ContactGrid from '@/components/admin/ContactGrid';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
};

interface UserData {
  _id: string;
  name: string;
  email: string;
  whatsappNumber: string;
  createdAt: string;
  isActive: boolean;
  role: string;
  isEmailVerified: boolean;
  profilePicture?: string;
  telegram?: string;
  instagram?: string;
  snapchat?: string;
  messenger?: string;
  preferredContact?: string;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleStatus = async (userId: string) => {
    try {
      const res = await api.patch(`/users/${userId}/status`);
      showToast(res.data.message, 'success');
      // Update local state
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: res.data.user.isActive } : u));
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update user status', 'error');
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground animate-pulse">Loading users...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[200] px-4 py-3 rounded-md shadow-lg bg-background text-foreground animate-slide-up flex items-center gap-3 border ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage registered users.</p>
        </div>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Join Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => {
                const isSelf = currentUser?._id === u._id || u.email === 'admin@beachbooking.com';
                
                return (
                  <tr key={u._id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={u.profilePicture} alt={u.name} />
                          <AvatarFallback className="text-[10px]">{getInitials(u.name || '')}</AvatarFallback>
                        </Avatar>
                        <span>{u.name || <span className="text-muted-foreground italic">No Name</span>}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{u.email}</span>
                        {u.isEmailVerified ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                            Pending OTP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-500">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <ContactGrid user={u as any} />
                        {isSelf ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                            Admin (You)
                          </span>
                        ) : (
                          <Button
                            variant={u.isActive ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => toggleStatus(u._id)}
                            className="h-8 px-3 text-xs w-[100px]"
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
