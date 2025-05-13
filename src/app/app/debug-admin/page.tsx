'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, ServerIcon, Database as DatabaseIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import { checkAdminAccessServer, checkAdminAccessDirect } from './actions';

export default function DebugAdminPage() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [impersonationData, setImpersonationData] = useState<any>(null);
  const [cookies, setCookies] = useState<string>('');
  const [serverCheckResult, setServerCheckResult] = useState<any>(null);
  const [directCheckResult, setDirectCheckResult] = useState<any>(null);
  const [serverCheckLoading, setServerCheckLoading] = useState(false);
  const [directCheckLoading, setDirectCheckLoading] = useState(false);

  useEffect(() => {
    // Initialize Supabase client
    const client = createClient();
    setSupabase(client);

    // Get cookies
    setCookies(document.cookie);

    // Get impersonation data from localStorage
    const impData = {
      profileId: localStorage.getItem('impersonatedProfileId'),
      email: localStorage.getItem('impersonatedEmail'),
      displayName: localStorage.getItem('impersonatedDisplayName'),
      authUserId: localStorage.getItem('impersonatedAuthUserId'),
    };
    setImpersonationData(impData);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const checkAuth = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
          throw new Error(`Auth error: ${authError.message}`);
        }

        setAuthUser(user);

        if (!user) {
          setLoading(false);
          return;
        }

        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          throw new Error(`Profile error: ${profileError.message}`);
        }

        setProfile(profileData);

        if (!profileData) {
          setLoading(false);
          return;
        }

        // Get roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('profile_roles')
          .select(`
            role_id,
            roles:role_id (
              id,
              role_name
            )
          `)
          .eq('profile_id', profileData.id);

        if (rolesError) {
          throw new Error(`Roles error: ${rolesError.message}`);
        }

        setRoles(rolesData.map(r => r.roles));
      } catch (err) {
        console.error('Error checking auth:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [supabase]);

  const checkImpersonatedRoles = async () => {
    if (!supabase || !impersonationData.profileId) return;

    setLoading(true);
    try {
      // Get roles for impersonated user
      const { data: rolesData, error: rolesError } = await supabase
        .from('profile_roles')
        .select(`
          role_id,
          roles:role_id (
            id,
            role_name
          )
        `)
        .eq('profile_id', impersonationData.profileId);

      if (rolesError) {
        throw new Error(`Impersonated roles error: ${rolesError.message}`);
      }

      setRoles(rolesData.map(r => r.roles));
    } catch (err) {
      console.error('Error checking impersonated roles:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const checkAdminServer = async () => {
    setServerCheckLoading(true);
    try {
      const result = await checkAdminAccessServer();
      setServerCheckResult(result);
    } catch (err) {
      console.error('Error checking admin access (server):', err);
      setServerCheckResult({
        isAdmin: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        debug: { error: 'Client-side error' }
      });
    } finally {
      setServerCheckLoading(false);
    }
  };

  const checkAdminDirect = async () => {
    setDirectCheckLoading(true);
    try {
      const result = await checkAdminAccessDirect();
      setDirectCheckResult(result);
    } catch (err) {
      console.error('Error checking admin access (direct):', err);
      setDirectCheckResult({
        isAdmin: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        debug: { error: 'Client-side error' }
      });
    } finally {
      setDirectCheckLoading(false);
    }
  };

  const hasAdminRole = roles.some(role => role.role_name === 'Admin');

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Access Debug</CardTitle>
          <CardDescription>
            Check if you have admin access and debug any issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Admin Status</h3>
                  {hasAdminRole ? (
                    <Alert className="bg-green-50 border-green-200 text-green-800 mt-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle>You have admin access</AlertTitle>
                      <AlertDescription>
                        You have the Admin role assigned to your profile
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No admin access</AlertTitle>
                      <AlertDescription>
                        You do not have the Admin role assigned to your profile
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium">Authentication</h3>
                  <div className="bg-slate-100 p-4 rounded-md mt-2 overflow-auto max-h-40">
                    <pre>{JSON.stringify(authUser, null, 2)}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Profile</h3>
                  <div className="bg-slate-100 p-4 rounded-md mt-2 overflow-auto max-h-40">
                    <pre>{JSON.stringify(profile, null, 2)}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Roles</h3>
                  <div className="bg-slate-100 p-4 rounded-md mt-2 overflow-auto max-h-40">
                    <pre>{JSON.stringify(roles, null, 2)}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Impersonation Data</h3>
                  <div className="bg-slate-100 p-4 rounded-md mt-2 overflow-auto max-h-40">
                    <pre>{JSON.stringify(impersonationData, null, 2)}</pre>
                  </div>
                  {impersonationData?.profileId && (
                    <Button
                      onClick={checkImpersonatedRoles}
                      className="mt-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Check Impersonated Roles
                    </Button>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium">Cookies</h3>
                  <div className="bg-slate-100 p-4 rounded-md mt-2 overflow-auto max-h-40">
                    <pre>{cookies}</pre>
                  </div>
                </div>
                <div className="space-y-2 mt-6">
                  <h3 className="text-lg font-medium">Server-Side Checks</h3>
                  <div className="flex space-x-4">
                    <Button
                      onClick={checkAdminServer}
                      disabled={serverCheckLoading}
                      className="flex items-center"
                    >
                      {serverCheckLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ServerIcon className="h-4 w-4 mr-2" />
                      )}
                      Check Admin (Server)
                    </Button>
                    <Button
                      onClick={checkAdminDirect}
                      disabled={directCheckLoading}
                      variant="outline"
                      className="flex items-center"
                    >
                      {directCheckLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <DatabaseIcon className="h-4 w-4 mr-2" />
                      )}
                      Check Admin (Direct DB)
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>

        {(serverCheckResult || directCheckResult) && (
          <CardFooter className="flex flex-col items-start space-y-4">
            {serverCheckResult && (
              <div className="w-full">
                <h3 className="text-lg font-medium mb-2">Server Check Result</h3>
                {serverCheckResult.isAdmin ? (
                  <Alert className="bg-green-50 border-green-200 text-green-800 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Admin access confirmed (Server)</AlertTitle>
                    <AlertDescription>
                      The server-side check confirms you have admin access
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive" className="mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No admin access (Server)</AlertTitle>
                    <AlertDescription>
                      {serverCheckResult.error || 'The server-side check indicates you do not have admin access'}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="bg-slate-100 p-4 rounded-md overflow-auto max-h-60">
                  <pre>{JSON.stringify(serverCheckResult.debug, null, 2)}</pre>
                </div>
              </div>
            )}

            {directCheckResult && (
              <div className="w-full">
                <h3 className="text-lg font-medium mb-2">Direct DB Check Result</h3>
                {directCheckResult.isAdmin ? (
                  <Alert className="bg-green-50 border-green-200 text-green-800 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Admin access confirmed (Direct DB)</AlertTitle>
                    <AlertDescription>
                      The direct database check confirms you have admin access
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive" className="mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No admin access (Direct DB)</AlertTitle>
                    <AlertDescription>
                      {directCheckResult.error || 'The direct database check indicates you do not have admin access'}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="bg-slate-100 p-4 rounded-md overflow-auto max-h-60">
                  <pre>{JSON.stringify(directCheckResult.debug, null, 2)}</pre>
                </div>
              </div>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
