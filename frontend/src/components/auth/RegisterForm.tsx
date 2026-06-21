'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { PhoneInput } from '@/components/ui/phone-input';
import OtpStep from './OtpStep';

export default function RegisterForm() {
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  const getStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-destructive' };
    if (score <= 3) return { level: 2, label: 'Fair', color: 'bg-warning' };
    return { level: 3, label: 'Strong', color: 'bg-success' };
  };

  const strength = getStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) return setError('Name is required');
    if (!email.trim()) return setError('Email address is required');
    if (!whatsappNumber.trim() || whatsappNumber.trim().length < 10)
      return setError('Please enter a valid phone number');
    if (!password || password.length < 8)
      return setError('Password must be at least 8 characters');

    setLoading(true);
    try {
      await api.post('/auth/register', {
        email: email.toLowerCase(),
        password,
        name: name.trim(),
        whatsappNumber: whatsappNumber.trim(),
      });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setOtpError('');
    try {
      const res = await api.post('/auth/register/verify', {
        email: email.toLowerCase(),
        otp,
      });
      setAuth(res.data.token, res.data.user);
      window.location.href = '/';
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
      await api.post('/auth/register', {
        email: email.toLowerCase(),
        password,
        name: name.trim(),
        whatsappNumber: whatsappNumber.trim(),
      });
    } catch {
      // Silently fail resend
    }
  };

  if (step === 'otp') {
    return (
      <OtpStep
        email={email}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onBack={() => setStep('form')}
        error={otpError}
        attemptsLeft={attemptsLeft}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          required
          className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {/* WhatsApp Number Input */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          WhatsApp Number
        </label>
        <PhoneInput
          value={whatsappNumber}
          onChange={(v) => setWhatsappNumber(v)}
          placeholder="Enter WhatsApp number"
          defaultCountry="EG"
        />
        <span className="text-xs text-muted-foreground mt-1.5 block">
          Please provide a valid WhatsApp number so we can securely confirm your registration and send your booking updates.
        </span>
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        {/* Strength Bar */}
        {password && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    i <= strength.level ? strength.color : 'bg-muted'
                  } transition-colors`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{strength.label}</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 btn-press"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}
