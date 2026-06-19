'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface OtpStepProps {
  phone: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack?: () => void;
  error?: string;
  attemptsLeft?: number;
}

export default function OtpStep({
  phone,
  onVerify,
  onResend,
  onBack,
  error,
  attemptsLeft,
}: OtpStepProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState(180);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatCountdown = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit on 6th digit
    if (index === 5 && value) {
      const otp = newDigits.join('');
      if (otp.length === 6) {
        handleVerify(otp);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = [...digits];
    pasted.split('').forEach((d, i) => {
      newDigits[i] = d;
    });
    setDigits(newDigits);
    if (pasted.length === 6) {
      handleVerify(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleVerify = async (otp: string) => {
    setLoading(true);
    try {
      await onVerify(otp);
    } catch {
      setDigits(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await onResend();
      setCountdown(180);
      setDigits(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">Enter the code</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Sent to {phone}{' '}
          {onBack && (
            <button
              onClick={onBack}
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              ✏️ Change
            </button>
          )}
        </p>
      </div>

      {/* OTP Boxes */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            className="w-10 h-12 text-center text-lg font-semibold rounded-md border border-input bg-white focus:ring-2 focus:ring-ring focus:outline-none transition-all disabled:opacity-50"
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-center text-sm text-destructive">
          {error}
          {attemptsLeft !== undefined && ` ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} left.`}
        </p>
      )}

      {/* Countdown / Resend */}
      <div className="text-center">
        {countdown > 0 ? (
          <p className="text-sm text-muted-foreground">
            Resend code in {formatCountdown(countdown)}
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-primary hover:underline font-medium disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={() => handleVerify(digits.join(''))}
        disabled={loading || digits.join('').length < 6}
        className="w-full h-10 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-press"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying...
          </span>
        ) : (
          'Verify Code'
        )}
      </button>
    </div>
  );
}
