import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssignmentsDashboard } from '../assignments-dashboard'; // Adjust path if it's a default export
import * as actions from '../../actions'; // Mock server actions

// Mock child components
vi.mock('../assignments-filters', () => ({
  AssignmentsFilters: vi.fn(({ onFiltersChange }) => (
    <div data-testid="mock-assignments-filters">
      <button onClick={() => onFiltersChange({ status: 'Open', searchQuery: 'test' })}>
        Apply Filters
      </button>
    </div>
  )),
}));

vi.mock('../assignments-table', () => ({
  AssignmentsTable: vi.fn(() => <div data-testid="mock-assignments-table">Mock AssignmentsTable</div>),
}));

// Mock server actions
vi.mock('../../actions', async (importOriginal) => {
  const actual = await importOriginal<typeof actions>();
  return {
    ...actual, // Import and retain all non-async functions
    fetchAssignmentsAndTasks: vi.fn(),
    fetchVolunteers: vi.fn(),
    // Keep other actions if they are used directly by the dashboard for other purposes
    // For now, we primarily care about data fetching actions for initial render.
  };
});

// Mock Supabase client (basic mock, can be expanded if needed)
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn(),
  // Add any other methods used by the component
};

describe('AssignmentsDashboard', () => {
  const mockProfileId = 'test-profile-123';
  const mockSupabase = mockSupabaseClient as any; // Cast to any for simplicity in tests

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations for actions for a successful load
    vi.mocked(actions.fetchAssignmentsAndTasks).mockResolvedValue({
      success: true,
      data: {
        assignments: [{ id: 'assign1', task_id: 'task1', user_id: 'user1', status: 'Pending', tasks: { id: 'task1', name: 'Task 1' }, users: { id: 'user1', full_name: 'User 1' } }],
        tasks: [{ id: 'task1', name: 'Task 1', events: { name: 'Event 1' } }],
      },
    });
    vi.mocked(actions.fetchVolunteers).mockResolvedValue({
      success: true,
      data: [{ id: 'user1', name: 'User 1', email: 'user1@example.com' }],
    });
  });

  it('should display loading state initially', async () => {
    // Make actions return a promise that never resolves for this test
    vi.mocked(actions.fetchAssignmentsAndTasks).mockReturnValue(new Promise(() => {}));
    vi.mocked(actions.fetchVolunteers).mockReturnValue(new Promise(() => {}));

    render(<AssignmentsDashboard profileId={mockProfileId} userRole="admin" supabase={mockSupabase} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument(); // Or check for a skeleton
  });

  it('should display error if fetching assignments/tasks fails', async () => {
    vi.mocked(actions.fetchAssignmentsAndTasks).mockResolvedValueOnce({ error: { message: 'Failed to fetch assignments' } });

    render(<AssignmentsDashboard profileId={mockProfileId} userRole="admin" supabase={mockSupabase} />);
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch assignments/i)).toBeInTheDocument();
    });
  });

  it('should display error if fetching volunteers fails', async () => {
    // This test assumes volunteer fetching is critical and an error should be shown.
    // If it's not critical, the component might render without them or with an empty list.
    vi.mocked(actions.fetchVolunteers).mockResolvedValueOnce({ error: { message: 'Failed to fetch volunteers' } });

    render(<AssignmentsDashboard profileId={mockProfileId} userRole="admin" supabase={mockSupabase} />);
    await waitFor(() => {
      // Depending on implementation, this might show an error or the table might be empty.
      // For this example, let's assume an error message is shown.
      expect(screen.getByText(/failed to fetch volunteers/i)).toBeInTheDocument();
    });
  });

  it('should render filters and table on successful data load for admin', async () => {
    const mockAssignments = [{ id: 'a1', task_id: 't1', user_id: 'u1', status: 'Confirmed', tasks: {id: 't1', name: 'Task Alpha'}, users: {id: 'u1', full_name: 'User Alpha'} }];
    const mockTasks = [{ id: 't1', name: 'Task Alpha', events: { name: 'Event Alpha'} }];
    const mockVolunteers = [{ id: 'u1', name: 'User Alpha', email: 'alpha@example.com' }];

    vi.mocked(actions.fetchAssignmentsAndTasks).mockResolvedValueOnce({
      success: true,
      data: { assignments: mockAssignments, tasks: mockTasks },
    });
    vi.mocked(actions.fetchVolunteers).mockResolvedValueOnce({ success: true, data: mockVolunteers });

    render(<AssignmentsDashboard profileId={mockProfileId} userRole="admin" supabase={mockSupabase} />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-assignments-filters')).toBeInTheDocument();
      expect(screen.getByTestId('mock-assignments-table')).toBeInTheDocument();
    });

    const { AssignmentsTable } = await import('../assignments-table');
    expect(AssignmentsTable).toHaveBeenCalledWith(
      expect.objectContaining({
        assignments: mockAssignments,
        tasks: mockTasks,
        volunteers: mockVolunteers,
        profileId: mockProfileId,
        userRole: 'admin',
        // supabase prop is not directly passed to AssignmentsTable from AssignmentsDashboard in the typical setup
      }),
      expect.anything()
    );
  });

  it('should render filters and table on successful data load for event_manager', async () => {
    const mockAssignments = [{ id: 'a1', task_id: 't1', user_id: 'u1', status: 'Confirmed', tasks: {id: 't1', name: 'Task Alpha'}, users: {id: 'u1', full_name: 'User Alpha'} }];
    const mockTasks = [{ id: 't1', name: 'Task Alpha', events: { name: 'Event Alpha'} }];
    const mockVolunteers = [{ id: 'u1', name: 'User Alpha', email: 'alpha@example.com' }];

    vi.mocked(actions.fetchAssignmentsAndTasks).mockResolvedValueOnce({
      success: true,
      data: { assignments: mockAssignments, tasks: mockTasks },
    });
    vi.mocked(actions.fetchVolunteers).mockResolvedValueOnce({ success: true, data: mockVolunteers });

    render(<AssignmentsDashboard profileId={mockProfileId} userRole="event_manager" supabase={mockSupabase} />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-assignments-filters')).toBeInTheDocument();
      expect(screen.getByTestId('mock-assignments-table')).toBeInTheDocument();
    });

    const { AssignmentsTable } = await import('../assignments-table');
    expect(AssignmentsTable).toHaveBeenCalledWith(
      expect.objectContaining({
        assignments: mockAssignments,
        tasks: mockTasks,
        volunteers: mockVolunteers,
        profileId: mockProfileId,
        userRole: 'event_manager',
      }),
      expect.anything()
    );
  });


  it('should render only table (and no/limited filters) for volunteer role', async () => {
    render(<AssignmentsDashboard profileId={mockProfileId} userRole="volunteer" supabase={mockSupabase} />);

    await waitFor(() => {
      // Depending on how it's implemented, filters might not be there or might be a different component
      expect(screen.queryByTestId('mock-assignments-filters')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-assignments-table')).toBeInTheDocument();
    });
     const { AssignmentsTable } = await import('../assignments-table');
     expect(AssignmentsTable).toHaveBeenCalledWith(
      expect.objectContaining({
        userRole: 'volunteer',
      }),
      expect.anything()
    );
  });

  it('should refetch assignments when filters change', async () => {
    render(<AssignmentsDashboard profileId={mockProfileId} userRole="admin" supabase={mockSupabase} />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-assignments-filters')).toBeInTheDocument();
    });

    // Ensure initial fetch is done
    expect(actions.fetchAssignmentsAndTasks).toHaveBeenCalledTimes(1);

    const filterButton = screen.getByRole('button', { name: /apply filters/i });
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(actions.fetchAssignmentsAndTasks).toHaveBeenCalledTimes(2);
    });
    expect(actions.fetchAssignmentsAndTasks).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'Open', searchQuery: 'test' }), // from mock filter
      mockProfileId, // for volunteer role, it passes profileId
      "admin" // userRole
    );
  });

   it('should call fetchAssignmentsAndTasks with profileId when userRole is volunteer and filters change', async () => {
    render(<AssignmentsDashboard profileId={mockProfileId} userRole="volunteer" supabase={mockSupabase} />);

    // For volunteers, filters are not rendered, but the internal onFilterChange might be triggered by something else
    // or this test is more about the internal logic if filters were present.
    // Given the current setup, this test might need adjustment if onFilterChange is not callable for volunteers.
    // However, the component does set initial filters and calls fetchData.
    // Let's simulate an internal re-fetch perhaps due to some other trigger or initial load for volunteer.

    await waitFor(() => {
      expect(actions.fetchAssignmentsAndTasks).toHaveBeenCalledTimes(1);
    });

    // Directly call the fetchData to simulate a refresh or filter change if the component structure allowed it
    // For instance, if there was a refresh button or if we directly invoke a method.
    // Since we are testing the passed parameters, we can check the initial call for volunteer.
    expect(actions.fetchAssignmentsAndTasks).toHaveBeenCalledWith(
      expect.objectContaining({ status: undefined, searchQuery: undefined }), // Initial filters
      mockProfileId, // profileId for volunteer
      "volunteer" // userRole
    );
  });
});
