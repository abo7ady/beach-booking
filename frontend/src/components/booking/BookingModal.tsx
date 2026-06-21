'use client';

import { useState } from 'react';
import { X, ChevronLeft, Calendar, Check } from 'lucide-react';
import { Activity } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import api from '@/lib/api';

interface BookingModalProps {
  activity: Activity;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({ activity, onClose, onSuccess }: BookingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [numberOfPersons, setNumberOfPersons] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/bookings', {
        activityId: activity._id,
        desiredDate: selectedDate,
        numberOfPersons,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-md animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            {step === 1 ? 'Select Date' : 'Confirm Booking'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose your preferred date for <strong>{activity.title}</strong>
              </p>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1.5">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={minDate}
                      className="w-full h-10 rounded-md border border-input bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                </div>

                <div className="w-32">
                  <label className="block text-sm font-medium mb-1.5">Persons</label>
                  <div className="flex items-center h-10 border border-input rounded-md overflow-hidden bg-white">
                    <button
                      onClick={() => setNumberOfPersons(Math.max(1, numberOfPersons - 1))}
                      className="px-3 h-full hover:bg-muted text-foreground transition-colors"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center text-sm font-medium">
                      {numberOfPersons}
                    </div>
                    <button
                      onClick={() => setNumberOfPersons(numberOfPersons + 1)}
                      className="px-3 h-full hover:bg-muted text-foreground transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-sm">
                <span className="font-semibold">Total Price:</span>
                <span className="text-lg font-bold text-primary">
                  ${activity.price * numberOfPersons}
                </span>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!selectedDate}
                className="w-full h-10 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 btn-press"
              >
                Continue →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
                Change details
              </button>

              {/* Summary Card */}
              <div className="rounded-lg border border-border p-4 space-y-3 bg-accent/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Activity</span>
                  <span className="font-medium">{activity.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Persons</span>
                  <span className="font-medium">{numberOfPersons}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-sm">
                  <span className="font-semibold">Total Price</span>
                  <span className="font-semibold text-primary">
                    ${activity.price * numberOfPersons}
                  </span>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full h-10 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 btn-press"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Booking...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    Confirm Booking
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
