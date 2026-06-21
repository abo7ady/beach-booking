'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginForm({
  onForgotPassword,
}: {
  onForgotPassword: () => void;
}) {
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Email address is required');
    if (!password) return setError('Password is required');

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: email.toLowerCase(), password });
      setAuth(res.data.token, res.data.user);
      window.location.href = '/';
    } catch (err: any) {
      if (err.response) {
        // Server responded with an error (wrong password, etc.)
        setError(err.response.data?.error || 'Login failed. Please try again.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your connection.');
      } else {
        // Network error — backend is down or unreachable
        setError('Cannot connect to server. Please make sure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Enter your password"
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
            Logging in...
          </span>
        ) : (
          'Log In'
        )}
      </button>

      {/* Forgot Password */}
      <button
        type="button"
        onClick={onForgotPassword}
        className="w-full text-center text-sm text-primary hover:underline"
      >
        Forgot password?
      </button>
    </form>
  );
}
