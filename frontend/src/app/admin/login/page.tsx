'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Waves, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function AdminLogin() {
  const { setAuth } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: 'error' | 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { phone, password });
      
      if (res.data.token) {
        // Check that the user is an admin
        if (res.data.user?.role !== 'admin') {
          showToast('Access denied. Admin privileges required.', 'error');
          return;
        }

        // Store auth state in zustand (which also persists to localStorage)
        setAuth(res.data.token, res.data.user);
        
        showToast('Login successful!', 'success');
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 1000);
      }
    } catch (err: any) {
      if (err.response) {
        showToast(err.response.data?.error || 'Invalid credentials. Please try again.', 'error');
      } else if (err.code === 'ECONNABORTED') {
        showToast('Request timed out. Please check your connection.', 'error');
      } else {
        showToast('Cannot connect to server. Please make sure the backend is running.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 relative">
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed bottom-4 right-4 z-[200] px-4 py-3 rounded-md shadow-lg bg-background text-foreground animate-slide-up flex items-center gap-3 border ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}
        >
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-sm border border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-4">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage BeachBooking</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Phone Number</label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              defaultCountry="EG"
              placeholder="Enter phone number"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
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

          <Button 
            type="submit" 
            className="w-full mt-6 btn-press" 
            disabled={loading || !phone || !password}
          >
            {loading ? 'Authenticating...' : 'Log In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
