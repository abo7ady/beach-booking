'use client';

import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import OtpStep from './OtpStep';
import { PhoneInput } from '@/components/ui/phone-input';

type Step = 'phone' | 'otp' | 'newPassword';

export default function ForgotPasswordFlow({ onBack }: { onBack: () => void }) {
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  // Removed fullPhone, phone is correctly formatted

  // Step 1: Send reset OTP
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) return setError('Phone number is required');

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { phone });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP → get reset token
  const handleVerifyOtp = async (otp: string) => {
    setOtpError('');
    try {
      const res = await api.post('/auth/reset-password/verify', {
        phone,
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
      await api.post('/auth/forgot-password', { phone });
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
        phone,
        resetToken,
        newPassword,
      });
      setAuth(res.data.token, res.data.user);
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
        onClick={step === 'phone' ? onBack : () => setStep('phone')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {step === 'phone' ? 'Back to login' : 'Start over'}
      </button>

      {step === 'phone' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="text-center mb-2">
            <h3 className="text-lg font-semibold">Reset Password</h3>
            <p className="text-sm text-muted-foreground">
              Enter your phone number to receive a reset code
            </p>
          </div>
          <div>
            <PhoneInput
              value={phone}
              onChange={(v) => setPhone(v)}
              placeholder="Enter phone number"
              defaultCountry="EG"
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
          phone={phone}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          onBack={() => setStep('phone')}
          error={otpError}
          attemptsLeft={attemptsLeft}
        />
      )}

      {step === 'newPassword' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="text-center mb-2">
            <h3 className="text-lg font-semibold">New Password</h3>
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
