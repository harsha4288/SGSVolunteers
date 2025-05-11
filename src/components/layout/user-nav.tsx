"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserIcon, LogOut, Settings, LogIn, UserMinus } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import type { Database } from '@/lib/types/supabase';

export function UserNav() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedEmail, setImpersonatedEmail] = useState<string | null>(null);
  const [impersonatedDisplayName, setImpersonatedDisplayName] = useState<string | null>(null);
  const [impersonatedProfileId, setImpersonatedProfileId] = useState<string | null>(null);


  useEffect(() => {
    const impersonatedId = localStorage.getItem('impersonatedProfileId');
    const impEmail = localStorage.getItem('impersonatedEmail');
    const impDisplayName = localStorage.getItem('impersonatedDisplayName');

    if (impersonatedId && impEmail) {
      setIsImpersonating(true);
      setImpersonatedProfileId(impersonatedId);
      setImpersonatedEmail(impEmail);
      setImpersonatedDisplayName(impDisplayName || impEmail.split('@')[0]);
    } else {
      setIsImpersonating(false);
    }

    const supabaseInstance = createClient();
    setSupabase(supabaseInstance);

    const fetchUser = async () => {
      const { data: { session } } = await supabaseInstance.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    fetchUser();

    const { data: authListener } = supabaseInstance.auth.onAuthStateChange(
      (_event, session) => {
        // Only update user if not impersonating, or if SIGNED_OUT event occurs
        if (!localStorage.getItem('impersonatedProfileId') || _event === 'SIGNED_OUT') {
          setUser(session?.user ?? null);
          setIsImpersonating(false); // Stop impersonation on actual sign out
          if (_event === 'SIGNED_OUT') {
            localStorage.removeItem('impersonatedProfileId');
            localStorage.removeItem('impersonatedEmail');
            localStorage.removeItem('impersonatedDisplayName');
            localStorage.removeItem('impersonatedAuthUserId');
            router.push('/login');
          }
        }
      }
    );
    
    // Listen to storage changes to reflect impersonation status dynamically
    const handleStorageChange = () => {
        const impId = localStorage.getItem('impersonatedProfileId');
        const impEmail = localStorage.getItem('impersonatedEmail');
        const impDisplayName = localStorage.getItem('impersonatedDisplayName');
        if (impId && impEmail) {
            setIsImpersonating(true);
            setImpersonatedProfileId(impId);
            setImpersonatedEmail(impEmail);
            setImpersonatedDisplayName(impDisplayName || impEmail.split('@')[0]);
        } else {
            setIsImpersonating(false);
        }
    };
    window.addEventListener('storage', handleStorageChange);


    return () => {
      authListener?.subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  const handleLogout = async () => {
    if (isImpersonating) { // Should not happen if UI is correct, but as a safeguard
      stopImpersonation();
      return;
    }
    if (!supabase) return;
    await supabase.auth.signOut();
    // Auth listener should handle redirect and state update
  };

  const stopImpersonation = () => {
    localStorage.removeItem('impersonatedProfileId');
    localStorage.removeItem('impersonatedEmail');
    localStorage.removeItem('impersonatedDisplayName');
    localStorage.removeItem('impersonatedAuthUserId');
    setIsImpersonating(false);
    setImpersonatedEmail(null);
    setImpersonatedDisplayName(null);
    setImpersonatedProfileId(null);
    // router.push('/login'); // Or refresh current page to reflect actual auth state
    window.location.reload(); // Force reload to re-evaluate auth state cleanly
  };

  if (loading && !isImpersonating) { // Only show loading if not immediately showing impersonated user
    return (
      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
        <Avatar className="h-9 w-9">
          <AvatarFallback>...</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  if (isImpersonating && impersonatedEmail) {
    const initial = impersonatedDisplayName?.charAt(0).toUpperCase() || impersonatedEmail.charAt(0).toUpperCase() || <UserIcon/>;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-accent">
            <Avatar className="h-9 w-9">
              <AvatarImage src={`https://picsum.photos/seed/${impersonatedProfileId}/100/100`} alt={impersonatedDisplayName || "User"} data-ai-hint="person avatar" />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-xs text-accent">Impersonating</p>
              <p className="text-sm font-medium leading-none">{impersonatedDisplayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {impersonatedEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={stopImpersonation} className="text-destructive focus:text-destructive focus:bg-destructive/10">
            <UserMinus className="mr-2 h-4 w-4" />
            <span>Stop Impersonating</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (!user) {
    return (
      <Link href="/login" passHref>
        <Button variant="outline">
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </Button>
      </Link>
    );
  }

  // Regular logged-in user display
  const userEmail = user.email || "No email";
  const userNameInitial = user.email?.charAt(0).toUpperCase() || <UserIcon/>;
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.user_metadata?.avatar_url || `https://picsum.photos/seed/${user.id}/100/100`} alt={displayName} data-ai-hint="person avatar" />
            <AvatarFallback>{userNameInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/app/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
