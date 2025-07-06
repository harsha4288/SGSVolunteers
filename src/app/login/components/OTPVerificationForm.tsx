"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Loader2, RefreshCw, ArrowLeft } from 'lucide-react';

interface OTPVerificationFormProps {
  email: string;
  onVerify: (token: string) => void;
  onResend: () => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
  canResend?: boolean;
  resendCooldown?: number;
}

export function OTPVerificationForm({
  email,
  onVerify,
  onResend,
  onBack,
  loading = false,
  error,
  canResend = true,
  resendCooldown = 0
}: OTPVerificationFormProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isComplete = otp.every(digit => digit !== '');
  const otpString = otp.join('');

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (paste.length === 6) {
      const newOtp = paste.split('');
      setOtp(newOtp);
      setValidationError(null);
      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isComplete) {
      setValidationError('Please enter all 6 digits');
      return;
    }

    setValidationError(null);
    onVerify(otpString);
  };

  const handleResend = () => {
    if (canResend) {
      onResend();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We've sent a 6-digit verification code to
        </p>
        <p className="text-sm font-medium">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Verification Code
          </Label>
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-12 text-center text-lg font-mono"
                disabled={loading}
                autoComplete="one-time-code"
              />
            ))}
          </div>
          {(validationError || error) && (
            <p className="text-sm text-destructive text-center">
              {validationError || error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !isComplete}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleResend}
          disabled={!canResend || loading}
          className="w-full"
        >
          {!canResend ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend in {resendCooldown}s
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend Code
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={loading}
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Email
        </Button>
      </div>
    </div>
  );
}