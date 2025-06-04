import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, SpyInstance } from 'vitest';
import { AssignmentsTable, AssignmentRow } from '../assignments-table'; // Adjust if default export
import * as assignmentActions from '../../actions'; // To mock the server actions

// Mock UI Components
vi.mock('@/components/ui/data-table', () => ({
  DataTable: vi.fn(({ columns, data }) => (
    <table data-testid="mock-data-table">
      <thead>
        <tr>
          {columns.map((col: any, index: number) => (
            <th key={index}>{typeof col.header === 'function' ? col.header({}) : col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row: AssignmentRow, rowIndex: number) => (
          <tr key={row.id || rowIndex}>
            {columns.map((col: any, colIndex: number) => (
              <td key={colIndex}>{col.cell ? col.cell({ row: { original: row } }) : JSON.stringify(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )),
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: vi.fn(({ children }) => <div data-testid="mock-alert-dialog">{children}</div>),
  AlertDialogTrigger: vi.fn(({ children }) => <div data-testid="mock-alert-dialog-trigger">{children}</div>),
  AlertDialogContent: vi.fn(({ children }) => <div data-testid="mock-alert-dialog-content">{children}</div>),
  AlertDialogHeader: vi.fn(({ children }) => <div data-testid="mock-alert-dialog-header">{children}</div>),
  AlertDialogTitle: vi.fn(({ children }) => <div data-testid="mock-alert-dialog-title">{children}</div>),
  AlertDialogDescription: vi.fn(({ children }) => <div data-testid="mock-alert-dialog-description">{children}</div>),
  AlertDialogFooter: vi.fn(({ children }) => <div data-testid="mock-alert-dialog-footer">{children}</div>),
  AlertDialogAction: vi.fn(({ children, onClick, ...props }) => <button data-testid="mock-alert-dialog-action" onClick={onClick} {...props}>{children}</button>),
  AlertDialogCancel: vi.fn(({ children, onClick }) => <button data-testid="mock-alert-dialog-cancel" onClick={onClick}>{children}</button>),
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: vi.fn(({ checked, onCheckedChange, disabled, ...rest }) => (
    <input
      type="checkbox"
      data-testid={`mock-checkbox-${rest['data-testid-custom'] || rest.id || 'checkbox'}`}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
      {...rest}
    />
  )),
}));

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, variant, size, disabled, ...rest }) => (
    <button data-testid={`mock-button-${children?.toString().toLowerCase().replace(/\s+/g, '-') || 'button'}`} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  )),
}));

vi.mock('@/components/ui/input', () => ({
  Input: vi.fn(({ value, onChange, placeholder, ...rest }) => (
    <input data-testid="mock-input" value={value || ''} onChange={onChange} placeholder={placeholder} {...rest} />
  )),
}));

vi.mock('@/components/ui/select', () => ({
  Select: vi.fn(({ children, onValueChange, value, ...rest }) => (
    <select data-testid={`mock-select-${rest['data-testid-custom'] || 'select'}`} onChange={(e) => onValueChange?.(e.target.value)} value={value}>{children}</select>
  )),
  SelectTrigger: vi.fn(({ children }) => <div>{children}</div>),
  SelectValue: vi.fn(({ placeholder }) => <span>{placeholder}</span>),
  SelectContent: vi.fn(({ children }) => <div>{children}</div>),
  SelectItem: vi.fn(({ children, value }) => <option value={value}>{children}</option>),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});


// Mock server actions that are called by prop functions
// These are illustrative; the actual test will spy on/mock the prop functions directly.
vi.mock('../../actions', async (importOriginal) => {
  const actual = await importOriginal<typeof assignmentActions>();
  return {
    ...actual,
    assignVolunteerToTask: vi.fn(),
    removeVolunteerAssignment: vi.fn(),
    updateCheckInStatus: vi.fn(),
  };
});


describe('AssignmentsTable', () => {
  const mockAssignments: AssignmentRow[] = [
    { id: 'assign1', user_id: 'user1', users: { id: 'user1', full_name: 'Volunteer One', email: 'v1@example.com' }, task_id: 'task1', tasks: { id: 'task1', name: 'Task Alpha', description: 'Desc Alpha', events: { id: 'event1', name: 'Event One' }, time_slots: { id: 'ts1', name: 'Morning' }, seva_categories: { id: 'sc1', name: 'Kitchen' } }, status: 'Pending', task_notes: 'Note 1', checked_in: false, check_in_time: null, check_out_time: null, check_ins: { id: 'ci1', checked_in: false} },
    { id: 'assign2', user_id: 'user2', users: { id: 'user2', full_name: 'Volunteer Two', email: 'v2@example.com' }, task_id: 'task2', tasks: { id: 'task2', name: 'Task Beta', description: 'Desc Beta', events: { id: 'event1', name: 'Event One' }, time_slots: { id: 'ts2', name: 'Afternoon' }, seva_categories: { id: 'sc2', name: 'Cleaning' } }, status: 'Confirmed', task_notes: null, checked_in: true, check_in_time: new Date().toISOString(), check_out_time: null, check_ins: { id: 'ci2', checked_in: true} },
  ];
  const mockProfileId = 'current-user-profile-id';
  const mockOnAssign = vi.fn();
  const mockOnRemove = vi.fn();
  const mockOnCheckIn = vi.fn();

  const mockTasks = [ // For the assign dialog
    { id: 'task1', name: 'Task Alpha', time_slot_id: 'ts1', seva_category_id: 'sc1', events: { name: 'Event One' } },
    { id: 'task2', name: 'Task Beta', time_slot_id: 'ts2', seva_category_id: 'sc2', events: { name: 'Event One' } },
    { id: 'task3', name: 'Task Gamma', time_slot_id: 'ts1', seva_category_id: 'sc1', events: { name: 'Event Two' } },
  ];
   const mockVolunteers = [ // For the assign dialog (if needed, though table takes assignments)
    { id: 'user1', name: 'Volunteer One', email: 'v1@example.com' },
    { id: 'user2', name: 'Volunteer Two', email: 'v2@example.com' },
  ];


  const defaultProps = {
    assignments: mockAssignments,
    tasks: mockTasks, // Used in "Assign/Update" dialog
    volunteers: mockVolunteers, // Used in "Assign/Update" dialog for volunteer selection
    profileId: mockProfileId,
    userRole: 'admin' as 'admin' | 'event_manager' | 'volunteer',
    onAssign: mockOnAssign,
    onRemove: mockOnRemove,
    onCheckIn: mockOnCheckIn,
    loading: false,
    refetchAssignments: vi.fn(), // Add this prop
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGeolocation.getCurrentPosition.mockImplementation((success) => success({ coords: { latitude: 10, longitude: 20, accuracy: 100, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() }));
    // Default success for actions called by handlers
    mockOnAssign.mockResolvedValue({ success: true });
    mockOnRemove.mockResolvedValue({ success: true });
    mockOnCheckIn.mockResolvedValue({ success: true });
  });

  it('should render the DataTable with correct number of rows', () => {
    render(<AssignmentsTable {...defaultProps} />);
    expect(screen.getByTestId('mock-data-table')).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    // Header row + data rows
    expect(rows.length).toBe(mockAssignments.length + 1);
  });

  it('should display relevant assignment data in cells', () => {
    render(<AssignmentsTable {...defaultProps} />);
    // Check for some data from the first mock assignment
    expect(screen.getByText('Volunteer One')).toBeInTheDocument();
    expect(screen.getByText('Task Alpha')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument(); // Status
    // Check for the check-in checkbox for the first row
    expect(screen.getByTestId(`mock-checkbox-${mockAssignments[0].id}-check-in`)).toBeInTheDocument();
  });

  describe('Check-in Functionality', () => {
    it('should call onCheckIn with correct parameters when checkbox is clicked', async () => {
      render(<AssignmentsTable {...defaultProps} />);
      const firstAssignment = mockAssignments[0];
      const checkbox = screen.getByTestId(`mock-checkbox-${firstAssignment.id}-check-in`) as HTMLInputElement;

      expect(checkbox.checked).toBe(false);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(defaultProps.onCheckIn).toHaveBeenCalledWith(
          firstAssignment.id,
          true, // new checked_in status
          expect.objectContaining({ latitude: 10, longitude: 20 }) // mocked location
        );
      });
      expect(vi.mocked(assignmentActions.updateCheckInStatus)).toHaveBeenCalledTimes(1); // From the onCheckIn mock
      await waitFor(() => expect(vi.mocked(defaultProps.refetchAssignments)).toHaveBeenCalled());
      await waitFor(() => expect(vi.mocked(Sonner.toast.success)).toHaveBeenCalledWith('Volunteer checked in successfully.'));

    });

    it('should show error toast if onCheckIn fails', async () => {
      vi.mocked(defaultProps.onCheckIn).mockResolvedValueOnce({ error: { message: 'Check-in failed' } });
      render(<AssignmentsTable {...defaultProps} />);
      const firstAssignment = mockAssignments[0];
      const checkbox = screen.getByTestId(`mock-checkbox-${firstAssignment.id}-check-in`) as HTMLInputElement;
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(vi.mocked(Sonner.toast.error)).toHaveBeenCalledWith('Check-in failed');
      });
       expect(vi.mocked(defaultProps.refetchAssignments)).not.toHaveBeenCalled();
    });

    it('should handle geolocation error gracefully', async () => {
      mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => error?.({ code: 1, message: "User denied Geolocation" } as GeolocationPositionError));
      render(<AssignmentsTable {...defaultProps} />);
      const firstAssignment = mockAssignments[0];
      const checkbox = screen.getByTestId(`mock-checkbox-${firstAssignment.id}-check-in`) as HTMLInputElement;
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(defaultProps.onCheckIn).toHaveBeenCalledWith(
          firstAssignment.id,
          true,
          null // No location
        );
      });
      await waitFor(() => expect(vi.mocked(Sonner.toast.warning)).toHaveBeenCalledWith("Location access denied. Check-in recorded without location."));
      await waitFor(() => expect(vi.mocked(Sonner.toast.success)).toHaveBeenCalledWith('Volunteer checked in successfully.')); // Still proceeds
    });
  });

  describe('Actions Column (Admin/Event Manager)', () => {
    beforeEach(() => {
      // Ensure admin role for these tests
      defaultProps.userRole = 'admin';
    });

    it('should open Assign/Update dialog and call onAssign', async () => {
      render(<AssignmentsTable {...defaultProps} />);
      const assignmentToUpdate = mockAssignments[0]; // Update the first assignment

      // Find the "Update" button for the first row. The mock DataTable renders cells.
      // We need to find a button associated with the first row's actions.
      // This assumes the "Update" button text or a specific test ID.
      // Let's assume the actions cell for the first row contains a button with text "Update" or similar.
      // The mock DataTable structure makes this tricky without more specific cell content.
      // For now, let's simulate clicking a button that would trigger the dialog for the first row.
      // A better way would be to have specific test-ids on buttons within cells.

      // Let's assume the columns definition creates an "Actions" cell,
      // and within that, for each row, there's an "Update" button.
      // We'll directly manipulate the state that shows the dialog for testing purposes.
      // This is a workaround due to the DataTable mock complexity.

      // Find an "Update" button (assuming one exists and is identifiable)
      // This part is highly dependent on how columns are defined and rendered.
      // If your DataTable mock renders `col.cell({ row: { original: row } })`,
      // and that cell function for 'Actions' column renders a button:
      const updateButton = screen.getAllByTestId('mock-button-update')[0]; // Assuming test id is set in cell render
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.getByTestId('mock-alert-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent(/Assign Task to/);
      });

      // Simulate selecting a task (if different) and adding notes
      const taskSelect = screen.getByTestId('mock-select-task-select'); // Custom test ID for task select in dialog
      fireEvent.change(taskSelect, { target: { value: mockTasks[1].id } }); // Select "Task Beta"

      const notesInput = screen.getByPlaceholderText('Enter task notes...');
      fireEvent.change(notesInput, { target: { value: 'Test notes for update' } });

      const saveButton = screen.getByTestId('mock-alert-dialog-action'); // Assuming this is the "Save" button
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onAssign).toHaveBeenCalledWith(
          assignmentToUpdate.users.id, // volunteerId
          mockTasks[1].id,       // new taskId
          'Test notes for update', // taskNotes
          assignmentToUpdate.id    // existingAssignmentId
        );
      });
      expect(vi.mocked(assignmentActions.assignVolunteerToTask)).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(vi.mocked(defaultProps.refetchAssignments)).toHaveBeenCalled());
      await waitFor(() => expect(vi.mocked(Sonner.toast.success)).toHaveBeenCalledWith('Assignment updated successfully.'));
    });

    it('should open Remove dialog and call onRemove', async () => {
      render(<AssignmentsTable {...defaultProps} />);
      const assignmentToRemove = mockAssignments[0];

      const removeButton = screen.getAllByTestId('mock-button-remove')[0]; // Assuming test id
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Confirm Removal');
      });

      const confirmRemoveButton = screen.getByTestId('mock-alert-dialog-action'); // Assuming this is "Confirm"
      fireEvent.click(confirmRemoveButton);

      await waitFor(() => {
        expect(defaultProps.onRemove).toHaveBeenCalledWith(assignmentToRemove.id);
      });
      expect(vi.mocked(assignmentActions.removeVolunteerAssignment)).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(vi.mocked(defaultProps.refetchAssignments)).toHaveBeenCalled());
      await waitFor(() => expect(vi.mocked(Sonner.toast.success)).toHaveBeenCalledWith('Assignment removed successfully.'));
    });

    it('should show error toast if onAssign fails', async () => {
      vi.mocked(defaultProps.onAssign).mockResolvedValueOnce({ error: { message: 'Assign failed' } });
      render(<AssignmentsTable {...defaultProps} />);
      const updateButton = screen.getAllByTestId('mock-button-update')[0];
      fireEvent.click(updateButton);
      // ... (fill dialog)
      const taskSelect = screen.getByTestId('mock-select-task-select');
      fireEvent.change(taskSelect, { target: { value: mockTasks[1].id } });
      const saveButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(vi.mocked(Sonner.toast.error)).toHaveBeenCalledWith('Assign failed');
      });
      expect(vi.mocked(defaultProps.refetchAssignments)).not.toHaveBeenCalled();
    });

    it('should show error toast if onRemove fails', async () => {
      vi.mocked(defaultProps.onRemove).mockResolvedValueOnce({ error: { message: 'Remove failed' } });
      render(<AssignmentsTable {...defaultProps} />);
      const removeButton = screen.getAllByTestId('mock-button-remove')[0];
      fireEvent.click(removeButton);
      // ... (confirm dialog)
      const confirmRemoveButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(confirmRemoveButton);
      await waitFor(() => {
        expect(vi.mocked(Sonner.toast.error)).toHaveBeenCalledWith('Remove failed');
      });
      expect(vi.mocked(defaultProps.refetchAssignments)).not.toHaveBeenCalled();
    });
  });

  describe('Volunteer Role View', () => {
    it('should not show Update/Remove buttons for volunteer role', () => {
      render(<AssignmentsTable {...defaultProps} userRole="volunteer" />);
      // Check that buttons typically found in the "Actions" column are not present
      expect(screen.queryByTestId('mock-button-update')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-button-remove')).not.toBeInTheDocument();
    });

    it('should still allow check-in for volunteer role', async () => {
      render(<AssignmentsTable {...defaultProps} userRole="volunteer" />);
      const firstAssignment = mockAssignments[0];
      const checkbox = screen.getByTestId(`mock-checkbox-${firstAssignment.id}-check-in`) as HTMLInputElement;
      fireEvent.click(checkbox);
      await waitFor(() => {
        expect(defaultProps.onCheckIn).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    it('should disable check-in and action buttons when loading', () => {
      render(<AssignmentsTable {...defaultProps} loading={true} userRole="admin"/>); // Admin to have action buttons

      // Check-in checkboxes
      mockAssignments.forEach(assign => {
        const checkbox = screen.getByTestId(`mock-checkbox-${assign.id}-check-in`);
        expect(checkbox).toBeDisabled();
      });

      // Action buttons (Update/Remove)
      // These might not be rendered if loading is true, or just disabled.
      // The current mock setup for DataTable might make this hard to test accurately without seeing the actual column def.
      // Assuming they are rendered but disabled:
      screen.getAllByTestId('mock-button-update').forEach(btn => expect(btn).toBeDisabled());
      screen.getAllByTestId('mock-button-remove').forEach(btn => expect(btn).toBeDisabled());
    });
  });

  // Test for the "Assign Task" button at the top of the table (if it exists for admins)
  it('should open Assign Task dialog when global "Assign Task" button is clicked (admin)', async () => {
    defaultProps.userRole = 'admin';
    render(<AssignmentsTable {...defaultProps} />);

    // Assuming there's a global "Assign Task" button outside the table, or part of table header
    // This button is part of the component itself, not the DataTable mock.
    const globalAssignButton = screen.getByTestId('mock-button-assign-task'); // This button needs to exist in AssignmentsTable component
    fireEvent.click(globalAssignButton);

    await waitFor(() => {
      expect(screen.getByTestId('mock-alert-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Assign Task');
    });

    // Simulate selecting a volunteer
    const volunteerSelect = screen.getByTestId('mock-select-volunteer-select'); // Custom test ID for volunteer select
    fireEvent.change(volunteerSelect, { target: { value: mockVolunteers[0].id } }); // Select "Volunteer One"

    // Simulate selecting a task
    const taskSelect = screen.getByTestId('mock-select-task-select');
    fireEvent.change(taskSelect, { target: { value: mockTasks[0].id } }); // Select "Task Alpha"

    const notesInput = screen.getByPlaceholderText('Enter task notes...');
    fireEvent.change(notesInput, { target: { value: 'New assignment notes' } });

    const saveButton = screen.getByTestId('mock-alert-dialog-action');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(defaultProps.onAssign).toHaveBeenCalledWith(
        mockVolunteers[0].id,    // selected volunteerId
        mockTasks[0].id,         // selected taskId
        'New assignment notes',  // taskNotes
        undefined                // no existingAssignmentId for new assignment
      );
    });
    await waitFor(() => expect(vi.mocked(Sonner.toast.success)).toHaveBeenCalledWith('Assignment created successfully.'));
    expect(vi.mocked(defaultProps.refetchAssignments)).toHaveBeenCalled();
  });

  it('should not render global "Assign Task" button for volunteer role', () => {
    defaultProps.userRole = 'volunteer';
    render(<AssignmentsTable {...defaultProps} />);
    expect(screen.queryByTestId('mock-button-assign-task')).not.toBeInTheDocument();
  });

});

// Helper to import Sonner for toast checks
const Sonner = await vi.importActual<{ toast: typeof vi.mocked<typeof import('sonner')['toast']> }>('sonner');
});
