'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Database as DatabaseIcon,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  checkRoles,
  checkProfileRoles,
  checkSpecificUserRole,
  checkAdminUsers,
  checkProfiles,
  checkTriggerStats,
  checkAdminRoleExists,
  checkRoleAssignments,
  checkTriggerExists,
  assignAdminRoleToUser,
  runFixScript
} from './actions';

export default function SqlCheckPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const runCheck = async (checkFn: () => Promise<any>, title: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await checkFn();
      if (!result.success) {
        setError(result.error || 'Unknown error');
      } else {
        setResult({
          title,
          data: result.data,
          fields: result.fields,
          rowCount: result.rowCount
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAdminRole = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await assignAdminRoleToUser(email);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        // Refresh the profile roles to show the change
        await runCheck(checkProfileRoles, "Profile Roles");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to assign admin role",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DatabaseIcon className="mr-2 h-6 w-6" />
            SQL Role Check
          </CardTitle>
          <CardDescription>
            Check user roles directly in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="checks">
            <TabsList className="mb-4">
              <TabsTrigger value="checks">Database Checks</TabsTrigger>
              <TabsTrigger value="assign">Assign Admin Role</TabsTrigger>
            </TabsList>

            <TabsContent value="checks">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <Button
                  onClick={() => runCheck(checkRoles, "Roles")}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center justify-start"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Check Roles
                </Button>
                <Button
                  onClick={() => runCheck(checkProfileRoles, "Profile Roles")}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center justify-start"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Check Profile Roles
                </Button>
                <Button
                  onClick={() => runCheck(checkSpecificUserRole, "Specific User Role")}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center justify-start"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Check datta.rajesh@gmail.com
                </Button>
                <Button
                  onClick={() => runCheck(checkAdminUsers, "Admin Users")}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center justify-start"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Check Admin Users
                </Button>
                <Button
                  onClick={() => runCheck(checkProfiles, "Profiles")}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center justify-start"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Check Profiles
                </Button>
                <Button
                  onClick={() => runCheck(checkTriggerStats, "Trigger Stats")}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center justify-start"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Check Trigger Stats
                </Button>
                <Button
                  onClick={() => runCheck(checkAdminRoleExists, "Admin Role Exists")}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center justify-start"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Check Admin Role Exists
                </Button>
                <Button
                  onClick={() => runCheck(checkRoleAssignments, "Role Assignments")}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center justify-start"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Check Role Assignments
                </Button>
                <Button
                  onClick={() => runCheck(checkTriggerExists, "Trigger Exists")}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center justify-start"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Check Trigger Exists
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">{result.title} ({result.rowCount} rows)</h3>
                  <div className="border rounded-md overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {result.fields?.map((field: string) => (
                            <TableHead key={field}>{field}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.data?.map((row: any, i: number) => (
                          <TableRow key={i}>
                            {result.fields?.map((field: string) => (
                              <TableCell key={field}>
                                {row[field] !== null ? String(row[field]) : 'null'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="assign">
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      id="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button
                      onClick={handleAssignAdminRole}
                      disabled={loading || !email}
                      className="flex items-center"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Assign Admin Role
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    This will directly assign the Admin role (ID: 1) to the user with the specified email address.
                    Make sure you enter the correct email address.
                  </AlertDescription>
                </Alert>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-2">Run Fix Script</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will run a script to fix all role assignments and ensure the database is set up correctly.
                  </p>
                  <Button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const result = await runFixScript();
                        if (result.success) {
                          toast({
                            title: "Success",
                            description: result.message,
                          });
                          // Refresh the profile roles to show the change
                          await runCheck(checkProfileRoles, "Profile Roles");
                        } else {
                          toast({
                            title: "Error",
                            description: result.error || "Failed to run fix script",
                            variant: "destructive"
                          });
                        }
                      } catch (err) {
                        toast({
                          title: "Error",
                          description: err instanceof Error ? err.message : "Unknown error",
                          variant: "destructive"
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    variant="destructive"
                    className="flex items-center"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Run Fix Script
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
