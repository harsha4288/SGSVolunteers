"use client";

import { useState, useCallback } from 'react';
import { otpService } from '@/lib/auth/otp-service';
import { profileLinkingService } from '@/lib/auth/profile-linking-service';

export type OTPFlowState = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error';

export interface OTPAuthState {
  state: OTPFlowState;
  email: string;
  error: string | null;
  canResend: boolean;
  resendCooldown: number;
}

export interface OTPAuthActions {
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (token: string) => Promise<boolean>;
  resendOTP: () => Promise<void>;
  reset: () => void;
}

export function useOTPAuth(): OTPAuthState & OTPAuthActions {
  const [state, setState] = useState<OTPFlowState>('idle');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);

  const startResendCooldown = useCallback(() => {
    setCanResend(false);
    setResendCooldown(60);
    
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const sendOTP = useCallback(async (emailAddress: string) => {
    setState('sending');
    setError(null);
    setEmail(emailAddress);

    const result = await otpService.sendOTP(emailAddress);
    
    if (result.success) {
      setState('sent');
      startResendCooldown();
    } else {
      setState('error');
      setError(result.error || 'Failed to send verification code');
    }
  }, [startResendCooldown]);

  const verifyOTP = useCallback(async (token: string): Promise<boolean> => {
    setState('verifying');
    setError(null);

    const result = await otpService.verifyOTP(email, token);
    
    if (result.success && result.user) {
      // Link user to profile
      const linkResult = await profileLinkingService.linkUserToProfile(result.user);
      
      if (linkResult.success) {
        setState('verified');
        return true;
      } else {
        setState('error');
        setError(linkResult.error || 'Failed to link user profile');
        return false;
      }
    } else {
      setState('error');
      setError(result.error || 'Verification failed');
      return false;
    }
  }, [email]);

  const resendOTP = useCallback(async () => {
    if (!canResend || !email) return;
    
    setState('sending');
    setError(null);

    const result = await otpService.sendOTP(email);
    
    if (result.success) {
      setState('sent');
      startResendCooldown();
    } else {
      setState('error');
      setError(result.error || 'Failed to resend verification code');
    }
  }, [email, canResend, startResendCooldown]);

  const reset = useCallback(() => {
    setState('idle');
    setEmail('');
    setError(null);
    setCanResend(true);
    setResendCooldown(0);
  }, []);

  return {
    state,
    email,
    error,
    canResend,
    resendCooldown,
    sendOTP,
    verifyOTP,
    resendOTP,
    reset
  };
}