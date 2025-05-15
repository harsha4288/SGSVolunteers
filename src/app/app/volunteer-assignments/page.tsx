'use client';

import { useState, useEffect } from 'react';
import {
  fetchVolunteers,
  fetchTimeSlots,
  fetchSevaCategories,
  fetchVolunteerCommitments,
  assignVolunteerToTask,
  removeVolunteerAssignment,
  checkAdminAccess,
  type Volunteer,
  type TimeSlot,
  type SevaCategory,
  type VolunteerCommitment
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CalendarClock,
  Loader2,
  Plus,
  Trash2,
  UserCog,
  Users,
  Search,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function VolunteerAssignmentsPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [sevaCategories, setSevaCategories] = useState<SevaCategory[]>([]);
  const [commitments, setCommitments] = useState<VolunteerCommitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVolunteers, setTotalVolunteers] = useState(0);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Form state
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedSevaCategory, setSelectedSevaCategory] = useState<string>('');
  const [taskNotes, setTaskNotes] = useState<string>('');

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

  // Fetch data
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
        // Fetch volunteers with pagination and search
        const { data: volunteersData, totalCount, error: volunteersError } =
          await fetchVolunteers(currentPage, pageSize, debouncedSearchQuery);

        if (volunteersError) {
          setError(volunteersError);
          return;
        }
        setVolunteers(volunteersData || []);
        setTotalVolunteers(totalCount);

        // Fetch time slots
        const { data: timeSlotsData, error: timeSlotsError } = await fetchTimeSlots();
        if (timeSlotsError) {
          setError(timeSlotsError);
          return;
        }
        setTimeSlots(timeSlotsData || []);

        // Fetch seva categories
        const { data: sevaCategoriesData, error: sevaCategoriesError } = await fetchSevaCategories();
        if (sevaCategoriesError) {
          setError(sevaCategoriesError);
          return;
        }
        setSevaCategories(sevaCategoriesData || []);

        // Fetch volunteer commitments
        const { data: commitmentsData, error: commitmentsError } = await fetchVolunteerCommitments();
        if (commitmentsError) {
          setError(commitmentsError);
          return;
        }
        setCommitments(commitmentsData || []);
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, accessChecked, currentPage, pageSize, debouncedSearchQuery]);

  // Handle assigning a volunteer to a task
  const handleAssignVolunteer = async () => {
    if (!selectedVolunteer || !selectedTimeSlot || !selectedSevaCategory) {
      toast({
        title: "Missing information",
        description: "Please select a volunteer, time slot, and seva category",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      const { success, error } = await assignVolunteerToTask(
        selectedVolunteer,
        parseInt(selectedTimeSlot),
        parseInt(selectedSevaCategory),
        taskNotes || null
      );

      if (success) {
        toast({
          title: "Volunteer assigned",
          description: "The volunteer has been assigned to the task successfully",
        });

        // Refresh the commitments data
        const { data: commitmentsData } = await fetchVolunteerCommitments();
        if (commitmentsData) {
          setCommitments(commitmentsData);
        }

        // Reset form
        setSelectedVolunteer('');
        setSelectedTimeSlot('');
        setSelectedSevaCategory('');
        setTaskNotes('');
        setDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: error || "Failed to assign volunteer",
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

  // Handle removing a volunteer assignment
  const handleRemoveAssignment = async (commitmentId: number) => {
    if (!confirm("Are you sure you want to remove this assignment?")) {
      return;
    }

    setActionLoading(true);
    try {
      const { success, error } = await removeVolunteerAssignment(commitmentId);

      if (success) {
        toast({
          title: "Assignment removed",
          description: "The volunteer assignment has been removed successfully",
        });

        // Update the local state to reflect the change
        setCommitments(prevCommitments =>
          prevCommitments.filter(commitment => commitment.id !== commitmentId)
        );
      } else {
        toast({
          title: "Error",
          description: error || "Failed to remove assignment",
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

  // Format date for display
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (err) {
      return dateString;
    }
  };

  // Group commitments by time slot
  const commitmentsByTimeSlot = commitments.reduce((acc, commitment) => {
    const timeSlotId = commitment.time_slot_id;
    if (!acc[timeSlotId]) {
      acc[timeSlotId] = [];
    }
    acc[timeSlotId].push(commitment);
    return acc;
  }, {} as Record<number, VolunteerCommitment[]>);

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
      <Tabs defaultValue="assignments">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="assignments" className="flex items-center">
              <CalendarClock className="mr-2 h-4 w-4" />
              Current Assignments
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Manage Assignments
            </TabsTrigger>
          </TabsList>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Assign Volunteer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Volunteer to Task</DialogTitle>
                <DialogDescription>
                  Select a volunteer, time slot, and seva category to create a new assignment.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="volunteer" className="text-sm font-medium">
                    Volunteer
                  </label>
                  <Select
                    value={selectedVolunteer}
                    onValueChange={setSelectedVolunteer}
                    disabled={actionLoading}
                  >
                    <SelectTrigger id="volunteer">
                      <SelectValue placeholder="Select volunteer" />
                    </SelectTrigger>
                    <SelectContent>
                      {volunteers.map((volunteer) => (
                        <SelectItem key={volunteer.id} value={volunteer.id}>
                          {volunteer.first_name} {volunteer.last_name} ({volunteer.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="timeSlot" className="text-sm font-medium">
                    Time Slot
                  </label>
                  <Select
                    value={selectedTimeSlot}
                    onValueChange={setSelectedTimeSlot}
                    disabled={actionLoading}
                  >
                    <SelectTrigger id="timeSlot">
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((timeSlot) => (
                        <SelectItem key={timeSlot.id} value={timeSlot.id.toString()}>
                          {timeSlot.slot_name} ({formatDateTime(timeSlot.start_time)} - {formatDateTime(timeSlot.end_time)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="sevaCategory" className="text-sm font-medium">
                    Seva Category
                  </label>
                  <Select
                    value={selectedSevaCategory}
                    onValueChange={setSelectedSevaCategory}
                    disabled={actionLoading}
                  >
                    <SelectTrigger id="sevaCategory">
                      <SelectValue placeholder="Select seva category" />
                    </SelectTrigger>
                    <SelectContent>
                      {sevaCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="taskNotes" className="text-sm font-medium">
                    Task Notes (Optional)
                  </label>
                  <Textarea
                    id="taskNotes"
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    placeholder="Add any specific instructions or notes for this assignment"
                    disabled={actionLoading}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignVolunteer}
                  disabled={actionLoading || !selectedVolunteer || !selectedTimeSlot || !selectedSevaCategory}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    'Assign Volunteer'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

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
            <span className="ml-2">Loading data...</span>
          </div>
        ) : (
          <>
            <TabsContent value="assignments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarClock className="mr-2 h-6 w-6" />
                    Current Volunteer Assignments
                  </CardTitle>
                  <CardDescription>
                    View all current volunteer assignments by time slot.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(commitmentsByTimeSlot).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No volunteer assignments found. Use the "Assign Volunteer" button to create new assignments.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {timeSlots.map((timeSlot) => {
                        const slotCommitments = commitmentsByTimeSlot[timeSlot.id] || [];
                        if (slotCommitments.length === 0) return null;

                        return (
                          <div key={timeSlot.id} className="border rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-2 flex items-center">
                              <CalendarClock className="mr-2 h-5 w-5" />
                              {timeSlot.slot_name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              {formatDateTime(timeSlot.start_time)} - {formatDateTime(timeSlot.end_time)}
                            </p>

                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Volunteer</TableHead>
                                  <TableHead>Seva Category</TableHead>
                                  <TableHead>Notes</TableHead>
                                  <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {slotCommitments.map((commitment) => (
                                  <TableRow key={commitment.id}>
                                    <TableCell>
                                      <div className="font-medium">
                                        {commitment.volunteer.first_name} {commitment.volunteer.last_name}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {commitment.volunteer.email}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                        {commitment.seva_category?.category_name || 'No category'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {commitment.task_notes || 'No notes'}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveAssignment(commitment.id)}
                                        disabled={actionLoading}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manage">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-6 w-6" />
                    Manage Volunteer Assignments
                  </CardTitle>
                  <CardDescription>
                    Assign volunteers to specific tasks and time slots. Use the search box to find volunteers quickly.
                  </CardDescription>
                  <div className="mt-4 flex flex-col space-y-2">
                    <div className="text-sm font-medium">Quick Guide:</div>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      <li>Search for a volunteer using the search box</li>
                      <li>Select a time slot from the middle panel</li>
                      <li>Choose a seva category from the right panel</li>
                      <li>Click "Create New Assignment" at the bottom</li>
                      <li>Add optional notes and confirm the assignment</li>
                    </ol>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Volunteers</CardTitle>
                          <div className="mt-2 relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search volunteers..."
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
                        </CardHeader>
                        <CardContent className="h-[300px] overflow-y-auto">
                          {volunteers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              {debouncedSearchQuery
                                ? `No volunteers found matching "${debouncedSearchQuery}"`
                                : "No volunteers found"}
                            </div>
                          ) : (
                            <ul className="space-y-2">
                              {volunteers.map((volunteer) => (
                                <li key={volunteer.id} className="p-2 hover:bg-muted rounded-md">
                                  <div className="font-medium">
                                    {volunteer.first_name} {volunteer.last_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {volunteer.email}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-4">
                          <div className="text-sm text-muted-foreground">
                            Showing {volunteers.length} of {totalVolunteers} volunteers
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1 || loading}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm">
                              Page {currentPage} of {Math.ceil(totalVolunteers / pageSize) || 1}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => (prev * pageSize < totalVolunteers ? prev + 1 : prev))}
                              disabled={currentPage * pageSize >= totalVolunteers || loading}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Time Slots</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] overflow-y-auto">
                          <ul className="space-y-2">
                            {timeSlots.map((timeSlot) => (
                              <li key={timeSlot.id} className="p-2 hover:bg-muted rounded-md">
                                <div className="font-medium">
                                  {timeSlot.slot_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatDateTime(timeSlot.start_time)} - {formatDateTime(timeSlot.end_time)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Seva Categories</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] overflow-y-auto">
                          <ul className="space-y-2">
                            {sevaCategories.map((category) => (
                              <li key={category.id} className="p-2 hover:bg-muted rounded-md">
                                <div className="font-medium">
                                  {category.category_name}
                                </div>
                                {category.description && (
                                  <div className="text-sm text-muted-foreground">
                                    {category.description}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full flex items-center justify-center"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Assignment
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
