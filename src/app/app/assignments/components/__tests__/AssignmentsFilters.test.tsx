import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssignmentsFilters } from '../assignments-filters'; // Adjust if default export

// Mock UI Components - Adjust paths and names as per your project structure
vi.mock('@/components/ui/input', () => ({
  Input: vi.fn(({ value, onChange, placeholder, disabled }) => (
    <input
      data-testid="mock-input"
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  )),
}));

vi.mock('@/components/ui/label', () => ({
  Label: vi.fn(({ children, htmlFor }) => <label htmlFor={htmlFor}>{children}</label>),
}));

vi.mock('@/components/ui/select', () => ({
  Select: vi.fn(({ value, onValueChange, disabled, children, ...rest }) => (
    <select
      data-testid={`mock-select-${rest['data-testid-custom'] || 'select'}`} // Use a custom test ID part if passed
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
    >
      {children}
    </select>
  )),
  SelectTrigger: vi.fn(({ children }) => <div>{children}</div>),
  SelectValue: vi.fn(({ placeholder }) => <span>{placeholder}</span>),
  SelectContent: vi.fn(({ children }) => <div>{children}</div>),
  SelectItem: vi.fn(({ children, value }) => <option value={value}>{children}</option>),
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: vi.fn(({ checked, onCheckedChange, disabled, id }) => (
    <input
      type="checkbox"
      data-testid="mock-switch"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      disabled={disabled}
    />
  )),
}));


describe('AssignmentsFilters', () => {
  const mockOnFiltersChange = vi.fn();
  const mockTimeSlots = [
    { id: 'ts1', name: 'Morning Shift' },
    { id: 'ts2', name: 'Afternoon Shift' },
  ];
  const mockSevaCategories = [
    { id: 'sc1', name: 'Kitchen Seva' },
    { id: 'sc2', name: 'Cleaning Seva' },
  ];
  const mockVolunteers = [
    { id: 'vol1', full_name: 'Volunteer One' },
    { id: 'vol2', full_name: 'Volunteer Two' },
  ];
  const mockProfileId = 'user-profile-id-123';

  const defaultProps = {
    onFiltersChange: mockOnFiltersChange,
    initialFilters: {},
    timeSlots: mockTimeSlots,
    sevaCategories: mockSevaCategories,
    volunteers: mockVolunteers,
    profileId: mockProfileId,
    userRole: 'admin' as 'admin' | 'event_manager' | 'volunteer',
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all filter controls', () => {
    render(<AssignmentsFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search by task or volunteer name...')).toBeInTheDocument();
    expect(screen.getByTestId('mock-select-time-slot-filter')).toBeInTheDocument();
    expect(screen.getByTestId('mock-select-seva-category-filter')).toBeInTheDocument();
    expect(screen.getByTestId('mock-select-volunteer-filter')).toBeInTheDocument();
    // "My Assignments" switch is conditional, test separately
  });

  it('should call onFiltersChange when search input changes', async () => {
    render(<AssignmentsFilters {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search by task or volunteer name...');
    fireEvent.change(searchInput, { target: { value: 'New Task' } });

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ searchQuery: 'New Task' }));
    });
  });

  it('should call onFiltersChange when time slot select changes', () => {
    render(<AssignmentsFilters {...defaultProps} />);
    const timeSlotSelect = screen.getByTestId('mock-select-time-slot-filter');
    fireEvent.change(timeSlotSelect, { target: { value: 'ts1' } });
    expect(mockOnFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ timeSlotId: 'ts1' }));
  });

  it('should call onFiltersChange when seva category select changes', () => {
    render(<AssignmentsFilters {...defaultProps} />);
    const sevaCategorySelect = screen.getByTestId('mock-select-seva-category-filter');
    fireEvent.change(sevaCategorySelect, { target: { value: 'sc1' } });
    expect(mockOnFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ sevaCategoryId: 'sc1' }));
  });

  it('should call onFiltersChange when volunteer select changes', () => {
    render(<AssignmentsFilters {...defaultProps} userRole="admin" />); // Ensure switch is not affecting this
    const volunteerSelect = screen.getByTestId('mock-select-volunteer-filter');
    fireEvent.change(volunteerSelect, { target: { value: 'vol1' } });
    expect(mockOnFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ volunteerId: 'vol1' }));
  });

  describe('"My Assignments" Switch', () => {
    it('should be visible for volunteer role', () => {
      render(<AssignmentsFilters {...defaultProps} userRole="volunteer" />);
      expect(screen.getByLabelText('My Assignments')).toBeInTheDocument();
      expect(screen.getByTestId('mock-switch')).toBeInTheDocument();
    });

    it('should be visible for event_manager role', () => {
      render(<AssignmentsFilters {...defaultProps} userRole="event_manager" />);
      expect(screen.getByLabelText('My Assignments')).toBeInTheDocument();
      expect(screen.getByTestId('mock-switch')).toBeInTheDocument();
    });

    it('should NOT be visible for admin role', () => {
      render(<AssignmentsFilters {...defaultProps} userRole="admin" />);
      expect(screen.queryByLabelText('My Assignments')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-switch')).not.toBeInTheDocument();
    });

    it('should call onFiltersChange with profileId when toggled ON (volunteer)', () => {
      render(<AssignmentsFilters {...defaultProps} userRole="volunteer" />);
      const myAssignmentsSwitch = screen.getByTestId('mock-switch');
      fireEvent.click(myAssignmentsSwitch); // Initial state is off, so this toggles it on
      expect(mockOnFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ volunteerId: mockProfileId }));
      // Also check if volunteer select becomes disabled
      expect(screen.getByTestId('mock-select-volunteer-filter')).toBeDisabled();
    });
    
    it('should call onFiltersChange with profileId when toggled ON (event_manager)', () => {
      render(<AssignmentsFilters {...defaultProps} userRole="event_manager" />);
      const myAssignmentsSwitch = screen.getByTestId('mock-switch');
      fireEvent.click(myAssignmentsSwitch);
      expect(mockOnFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ volunteerId: mockProfileId }));
      expect(screen.getByTestId('mock-select-volunteer-filter')).toBeDisabled();
    });

    it('should call onFiltersChange with null when toggled OFF after being ON', () => {
      // Start with it on via initialFilters
      render(
        <AssignmentsFilters
          {...defaultProps}
          userRole="volunteer"
          initialFilters={{ volunteerId: mockProfileId }}
        />
      );
      const myAssignmentsSwitch = screen.getByTestId('mock-switch');
      expect(myAssignmentsSwitch).toBeChecked(); // Should be checked due to initialFilters
      expect(screen.getByTestId('mock-select-volunteer-filter')).toBeDisabled();


      fireEvent.click(myAssignmentsSwitch); // Toggle it OFF
      expect(mockOnFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ volunteerId: null }));
      expect(screen.getByTestId('mock-select-volunteer-filter')).not.toBeDisabled();
    });
  });

  it('should disable all inputs when loading is true', () => {
    render(<AssignmentsFilters {...defaultProps} loading={true} userRole="event_manager" />); // event_manager to have switch
    expect(screen.getByPlaceholderText('Search by task or volunteer name...')).toBeDisabled();
    expect(screen.getByTestId('mock-select-time-slot-filter')).toBeDisabled();
    expect(screen.getByTestId('mock-select-seva-category-filter')).toBeDisabled();
    expect(screen.getByTestId('mock-select-volunteer-filter')).toBeDisabled();
    expect(screen.getByTestId('mock-switch')).toBeDisabled();
  });

  it('should initialize with and correctly reflect initialFilters', () => {
    const initialFilters = {
      searchQuery: 'Initial Search',
      timeSlotId: 'ts2',
      sevaCategoryId: 'sc2',
      volunteerId: 'vol2', // For admin, this directly sets the volunteer
    };
    render(<AssignmentsFilters {...defaultProps} initialFilters={initialFilters} userRole="admin" />);

    expect(screen.getByPlaceholderText('Search by task or volunteer name...')).toHaveValue(initialFilters.searchQuery);
    expect(screen.getByTestId('mock-select-time-slot-filter')).toHaveValue(initialFilters.timeSlotId);
    expect(screen.getByTestId('mock-select-seva-category-filter')).toHaveValue(initialFilters.sevaCategoryId);
    expect(screen.getByTestId('mock-select-volunteer-filter')).toHaveValue(initialFilters.volunteerId);
  });
  
  it('should correctly initialize "My Assignments" switch if initialFilters.volunteerId matches profileId', () => {
    render(
      <AssignmentsFilters
        {...defaultProps}
        userRole="volunteer"
        initialFilters={{ volunteerId: mockProfileId }}
      />
    );
    const myAssignmentsSwitch = screen.getByTestId('mock-switch');
    expect(myAssignmentsSwitch).toBeChecked();
    expect(screen.getByTestId('mock-select-volunteer-filter')).toBeDisabled();
  });

  it('should NOT check "My Assignments" switch if initialFilters.volunteerId does not match profileId', () => {
     render(
      <AssignmentsFilters
        {...defaultProps}
        userRole="volunteer"
        initialFilters={{ volunteerId: 'some-other-volunteer-id' }}
      />
    );
    const myAssignmentsSwitch = screen.getByTestId('mock-switch');
    expect(myAssignmentsSwitch).not.toBeChecked();
    expect(screen.getByTestId('mock-select-volunteer-filter')).not.toBeDisabled();
    // Volunteer select should also reflect 'some-other-volunteer-id'
    expect(screen.getByTestId('mock-select-volunteer-filter')).toHaveValue('some-other-volunteer-id');
  });
});
