'use client';

import api from '@/lib/api';

interface StatusDropdownProps {
  bookingId: string;
  currentStatus: string;
  onUpdate: () => void;
}

const statuses = ['New', 'Contacted', 'Confirmed', 'Cancelled'];

export default function StatusDropdown({ bookingId, currentStatus, onUpdate }: StatusDropdownProps) {
  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;

    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      onUpdate();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getSelectColor = () => {
    switch (currentStatus) {
      case 'New': return 'border-blue-300 bg-blue-50';
      case 'Contacted': return 'border-amber-300 bg-amber-50';
      case 'Confirmed': return 'border-emerald-300 bg-emerald-50';
      case 'Cancelled': return 'border-zinc-300 bg-zinc-50';
      default: return 'border-border bg-white';
    }
  };

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      className={`h-8 px-2 rounded-md border text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${getSelectColor()}`}
    >
      {statuses.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
