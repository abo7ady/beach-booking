'use client';

import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import OtpStep from './OtpStep';

type Step = 'email' | 'otp' | 'newPassword';

export default function ForgotPasswordFlow({ onBack }: { onBack: () => void }) {
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  // Step 1: Request password reset OTP
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Email address is required');

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.toLowerCase() });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify reset OTP
  const handleVerifyOtp = async (otp: string) => {
    setOtpError('');
    try {
      const res = await api.post('/auth/reset-password/verify', {
        email: email.toLowerCase(),
        otp,
      });
      setResetToken(res.data.resetToken);
      setStep('newPassword');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid code.';
      const left = err.response?.data?.attemptsLeft;
      setOtpError(msg);
      if (left !== undefined) setAttemptsLeft(left);
      throw err;
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post('/auth/forgot-password', { email: email.toLowerCase() });
    } catch {
      // Silently handle
    }
  };

  // Step 3: Set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 8)
      return setError('Password must be at least 8 characters');
    if (newPassword !== confirmPassword)
      return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: email.toLowerCase(),
        resetToken,
        newPassword,
      });
      setAuth(res.data.token, res.data.user);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={step === 'email' ? onBack : () => setStep('email')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {step === 'email' ? 'Back to login' : 'Start over'}
      </button>

      {step === 'email' && (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div className="text-center mb-2">
            <h3 className="text-lg font-semibold text-foreground">Reset Password</h3>
            <p className="text-sm text-muted-foreground">
              Enter your email address to receive a reset code
            </p>
          </div>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
              className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 btn-press"
          >
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <OtpStep
          email={email}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          onBack={() => setStep('email')}
          error={otpError}
          attemptsLeft={attemptsLeft}
        />
      )}

      {step === 'newPassword' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="text-center mb-2">
            <h3 className="text-lg font-semibold text-foreground">New Password</h3>
            <p className="text-sm text-muted-foreground">
              Choose a strong password for your account
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full h-10 rounded-md border border-input bg-white px-3 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 btn-press"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
}
