'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMyBookings } from '@/hooks/useBookings';
import { useFavorites } from '@/hooks/useFavorites';
import BookingCard from '@/components/booking/BookingCard';
import ActivityGrid from '@/components/activity/ActivityGrid';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { User, Send, Camera, Ghost, MessageSquare, Phone, Save } from 'lucide-react';

type Tab = 'bookings' | 'favorites' | 'settings';

export default function ProfilePage() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { updateUser } = useAuthStore();
  const { bookings, isLoading: bookingsLoading } = useMyBookings();
  const { favorites, isLoading: favsLoading } = useFavorites();
  const [activeTab, setActiveTab] = useState<Tab>('bookings');

  // Settings form
  const [name, setName] = useState(user?.name || '');
  const [telegram, setTelegram] = useState(user?.telegram || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [snapchat, setSnapchat] = useState(user?.snapchat || '');
  const [messenger, setMessenger] = useState(user?.messenger || '');
  const [preferredContact, setPreferredContact] = useState(user?.preferredContact || 'whatsapp');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!isAuthenticated) openAuthModal('login');
  }, [isAuthenticated, openAuthModal]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setTelegram(user.telegram || '');
      setInstagram(user.instagram || '');
      setSnapchat(user.snapchat || '');
      setMessenger(user.messenger || '');
      setPreferredContact(user.preferredContact || 'whatsapp');
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await api.put('/profile', {
        name, telegram, instagram, snapchat, messenger, preferredContact
      });
      updateUser(res.data.user);
      setSaveMsg('Profile saved!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'bookings', label: 'My Bookings' },
    { key: 'favorites', label: 'Favorites' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{user?.name || 'My Profile'}</h1>
          <p className="text-sm text-muted-foreground">{user?.phone}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === key
                ? 'text-foreground border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookingsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No bookings yet.
            </div>
          ) : (
            bookings.map((b) => <BookingCard key={b._id} booking={b} />)
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <ActivityGrid activities={favorites} isLoading={favsLoading} />
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Preferred Contact Method</h3>
            <p className="text-xs text-muted-foreground -mt-2">
              Let the admin know the best way to reach you.
            </p>
            <select
              value={preferredContact}
              onChange={(e) => setPreferredContact(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="instagram">Instagram</option>
              <option value="snapchat">Snapchat</option>
              <option value="messenger">Messenger</option>
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Social Handles</h3>
            <p className="text-xs text-muted-foreground -mt-2">
              Add your handles so the admin can contact you easily.
            </p>

            {/* WhatsApp (auto from phone) */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Phone className="w-4 h-4 text-emerald-600" />
              </div>
              <input
                type="text"
                value={user?.phone || ''}
                disabled
                className="flex-1 h-10 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground"
              />
            </div>

            {/* Telegram */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                <Send className="w-4 h-4 text-sky-600" />
              </div>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="Telegram username"
                className="flex-1 h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Camera className="w-4 h-4 text-purple-600" />
              </div>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="Instagram username"
                className="flex-1 h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Snapchat */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <Ghost className="w-4 h-4 text-yellow-600" />
              </div>
              <input
                type="text"
                value={snapchat}
                onChange={(e) => setSnapchat(e.target.value)}
                placeholder="Snapchat username"
                className="flex-1 h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Messenger */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <input
                type="text"
                value={messenger}
                onChange={(e) => setMessenger(e.target.value)}
                placeholder="Messenger username"
                className="flex-1 h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 h-10 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 btn-press flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saveMsg && (
              <span className="text-sm text-success font-medium animate-fade-in">
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
