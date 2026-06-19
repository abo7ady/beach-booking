'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordFlow from './ForgotPasswordFlow';

export default function AuthModal() {
  const { isAuthModalOpen, authModalTab, closeAuthModal } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(authModalTab);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    setActiveTab(authModalTab);
    setShowForgotPassword(false);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={closeAuthModal}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-sm animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          {showForgotPassword ? (
            <ForgotPasswordFlow
              onBack={() => setShowForgotPassword(false)}
            />
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-border mb-6">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'login'
                      ? 'text-foreground border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'register'
                      ? 'text-foreground border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Forms */}
              {activeTab === 'login' ? (
                <LoginForm
                  onForgotPassword={() => setShowForgotPassword(true)}
                />
              ) : (
                <RegisterForm />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
