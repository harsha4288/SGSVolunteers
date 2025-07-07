"use client";

import { useEffect } from 'react';

// Force dynamic rendering for login page to avoid SSR issues with auth
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Handshake, AlertCircle } from 'lucide-react';
import { useOTPAuth } from '@/hooks/use-otp-auth';
import { useAuthSession } from '@/hooks/use-auth-session';
import { EmailInputForm } from './components/EmailInputForm';
import { OTPVerificationForm } from './components/OTPVerificationForm';
import { AuthLoadingSpinner } from './components/AuthLoadingSpinner';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useAuthSession();
  const {
    state,
    email,
    error,
    canResend,
    resendCooldown,
    sendOTP,
    verifyOTP,
    resendOTP,
    reset
  } = useOTPAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!sessionLoading && user) {
      console.log('Login page: User detected, redirecting to dashboard');
      router.replace('/app/dashboard'); // Use replace instead of push to avoid history issues
    }
  }, [user, sessionLoading, router]);

  // Handle OTP verification success
  const handleVerifyOTP = async (token: string) => {
    const success = await verifyOTP(token);
    if (success) {
      console.log('OTP verification successful, redirecting to dashboard');
      // Don't redirect immediately - let the useEffect handle it after session is established
      // router.replace('/app/dashboard');
    }
  };

  // Show loading while checking session
  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6">
            <AuthLoadingSpinner message="Checking authentication..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't render if user is already authenticated - show loading instead
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6">
            <AuthLoadingSpinner message="Redirecting to dashboard..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Handshake className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Welcome to {process.env.NEXT_PUBLIC_APP_NAME || "VolunteerVerse"}
          </CardTitle>
          <CardDescription className="text-md">
            Enter your email to receive a verification code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {state === 'idle' && (
            <EmailInputForm
              onSubmit={sendOTP}
              loading={false}
              error={null}
            />
          )}

          {state === 'sending' && (
            <AuthLoadingSpinner message="Sending verification code..." />
          )}

          {(state === 'sent' || state === 'verifying') && (
            <OTPVerificationForm
              email={email}
              onVerify={handleVerifyOTP}
              onResend={resendOTP}
              onBack={reset}
              loading={state === 'verifying'}
              error={null}
              canResend={canResend}
              resendCooldown={resendCooldown}
            />
          )}

          {state === 'verified' && (
            <AuthLoadingSpinner message="Authentication successful! Redirecting..." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
