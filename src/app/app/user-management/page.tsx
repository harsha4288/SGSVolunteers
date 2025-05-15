'use client';

import { useState, useEffect } from 'react';
import {
  fetchUsersWithRoles,
  fetchRoles,
  addRoleToUser,
  removeRoleFromUser,
  checkAdminAccess,
  type UserWithRoles,
  type Role
} from './actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  UserCog,
  Shield,
  ShieldAlert,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, number>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const { toast } = useToast();

  // Check if the current user has admin access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        console.log('Checking admin access...');
        const result = await checkAdminAccess();
        console.log('Admin access check result:', result);

        setIsAdmin(result.isAdmin);

        if (result.error && !result.isAdmin) {
          console.error('Access denied:', result.error);
          setError(`Access denied: ${result.error}`);
        }
      } catch (err) {
        console.error('Error during admin access check:', err);
        setError(`Error checking access: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsAdmin(false);
      } finally {
        setAccessChecked(true);
      }
    };

    checkAccess();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Reset to first page when search changes
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentPage]);

  // Fetch users and roles data
  useEffect(() => {
    if (!accessChecked) return;

    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch users with their roles with pagination and search
        const { data: usersData, totalCount, error: usersError } =
          await fetchUsersWithRoles(currentPage, pageSize, debouncedSearchQuery);

        if (usersError) {
          setError(usersError);
          return;
        }
        setUsers(usersData || []);
        setTotalUsers(totalCount);

        // Fetch available roles
        const { data: rolesData, error: rolesError } = await fetchRoles();
        if (rolesError) {
          setError(rolesError);
          return;
        }
        setRoles(rolesData || []);
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, accessChecked, currentPage, pageSize, debouncedSearchQuery]);

  // Handle adding a role to a user
  const handleAddRole = async (profileId: string) => {
    if (!selectedRoles[profileId]) {
      toast({
        title: "No role selected",
        description: "Please select a role to add",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      const { success, error } = await addRoleToUser(profileId, selectedRoles[profileId]);

      if (success) {
        toast({
          title: "Role added",
          description: "The role has been added successfully",
        });

        // Update the local state to reflect the change
        setUsers(prevUsers =>
          prevUsers.map(user => {
            if (user.id === profileId) {
              const roleToAdd = roles.find(r => r.id === selectedRoles[profileId]);
              if (roleToAdd && !user.roles.some(r => r.id === roleToAdd.id)) {
                return {
                  ...user,
                  roles: [...user.roles, roleToAdd]
                };
              }
            }
            return user;
          })
        );
      } else {
        toast({
          title: "Error",
          description: error || "Failed to add role",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle removing a role from a user
  const handleRemoveRole = async (profileId: string, roleId: number) => {
    // Don't allow removing the Volunteer role (ID: 3)
    if (roleId === 3) {
      toast({
        title: "Cannot remove Volunteer role",
        description: "The Volunteer role is required for all users",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      const { success, error } = await removeRoleFromUser(profileId, roleId);

      if (success) {
        toast({
          title: "Role removed",
          description: "The role has been removed successfully",
        });

        // Update the local state to reflect the change
        setUsers(prevUsers =>
          prevUsers.map(user => {
            if (user.id === profileId) {
              return {
                ...user,
                roles: user.roles.filter(r => r.id !== roleId)
              };
            }
            return user;
          })
        );
      } else {
        toast({
          title: "Error",
          description: error || "Failed to remove role",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Get role badge color based on role name
  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'Admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'Team Lead':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'Volunteer':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Get role icon based on role name
  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'Admin':
        return <ShieldAlert className="h-3 w-3 mr-1" />;
      case 'Team Lead':
        return <Shield className="h-3 w-3 mr-1" />;
      case 'Volunteer':
        return <UserCog className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  // If access check is still in progress, show loading
  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Checking access...</span>
      </div>
    );
  }

  // If user is not an admin, show access denied
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page. This page is restricted to administrators only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCog className="mr-2 h-6 w-6" />
            User Role Management
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions. Add or remove Team Lead and Admin roles.
          </CardDescription>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1.5 h-6 w-6 rounded-full p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading user data...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Current Roles</TableHead>
                  <TableHead>Add Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.display_name || 'No display name'}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge
                            key={role.id}
                            variant="outline"
                            className={`flex items-center ${getRoleBadgeColor(role.role_name)}`}
                            onClick={() => role.id !== 3 && handleRemoveRole(user.id, role.id)}
                          >
                            {getRoleIcon(role.role_name)}
                            {role.role_name}
                            {role.id !== 3 && (
                              <span className="ml-1 text-xs">&times;</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Select
                          onValueChange={(value) => setSelectedRoles({
                            ...selectedRoles,
                            [user.id]: parseInt(value)
                          })}
                          disabled={actionLoading}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles
                              .filter(role => !user.roles.some(r => r.id === role.id))
                              .map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.role_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => handleAddRole(user.id)}
                          disabled={actionLoading || !selectedRoles[user.id]}
                          size="sm"
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Add'
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            Showing {users.length} of {totalUsers} users
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous Page</span>
            </Button>
            <div className="text-sm">
              Page {currentPage} of {Math.ceil(totalUsers / pageSize) || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => (prev * pageSize < totalUsers ? prev + 1 : prev))}
              disabled={currentPage * pageSize >= totalUsers || loading}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
