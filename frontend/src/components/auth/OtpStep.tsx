'use client';

import { useState, useEffect } from 'react';

interface OtpStepProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  error?: string;
  attemptsLeft?: number;
}

export default function OtpStep({
  email,
  onVerify,
  onResend,
  onBack,
  error: propError,
  attemptsLeft,
}: OtpStepProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState(propError || '');

  useEffect(() => {
    setError(propError || '');
  }, [propError]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6 || isNaN(Number(otp))) {
      return setError('Please enter a valid 6-digit code');
    }

    setLoading(true);
    try {
      await onVerify(otp);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendLoading(true);
    try {
      await onResend();
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-foreground">Verification Required</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 6-digit code"
            className="w-full h-12 text-center text-xl font-bold tracking-[8px] rounded-md border border-input bg-white px-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Didn't receive the code? Please check your{' '}
            <span className="font-semibold text-amber-600">spam</span> or{' '}
            <span className="font-semibold text-amber-600">junk folder</span>.
          </p>
        </div>

        {attemptsLeft !== undefined && attemptsLeft < 3 && (
          <p className="text-xs text-warning text-center">
            {attemptsLeft} verification attempts remaining.
          </p>
        )}

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full h-10 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 btn-press"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="flex items-center justify-between text-xs mt-4">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground underline"
        >
          Edit email
        </button>
        <button
          onClick={handleResend}
          disabled={resendLoading || resendCooldown > 0}
          className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {resendCooldown > 0
            ? `Resend code in ${resendCooldown}s`
            : 'Resend code'}
        </button>
      </div>
    </div>
  );
}
