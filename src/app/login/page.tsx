'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SITE_CONFIG } from '@/lib/constants';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, AlertCircle, LogIn } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';

export default function LoginPage() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const LogoIcon = SITE_CONFIG.logo;

  useEffect(() => {
    // Initialize Supabase client
    // console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    // console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    setSupabase(createClient());
  }, []);

  const handleMagicLinkSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    if (!supabase) {
      setError("Supabase client not initialized. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (otpError) {
        setError(otpError.message);
      } else {
        setInfoMessage("Check your email for a magic link to sign in!");
        setEmail(''); 
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <LogoIcon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">{SITE_CONFIG.name}</CardTitle>
          <CardDescription>Welcome! Please sign in with your email to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {infoMessage && (
            <Alert variant="default">
              <LogIn className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>{infoMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  disabled={!supabase || loading}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={!supabase || loading}>
              {loading ? 'Sending Link...' : 'Sign In with Email Link'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          <p>Enter your email address above and we'll send you a magic link to sign in. No password required.</p>
        </CardFooter>
      </Card>
    </div>
  );
}

