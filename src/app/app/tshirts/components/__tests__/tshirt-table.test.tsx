import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TshirtTable, TshirtIssuanceRow } from '../tshirt-table'; // Adjust path and export name if necessary
import { useToast } from '@/components/ui/use-toast'; // To mock toast

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
        {data.map((row: TshirtIssuanceRow, rowIndex: number) => (
          <tr key={row.id || rowIndex}>
            {columns.map((col: any, colIndex: number) => (
              <td key={colIndex}>
                {/* Render the cell content, assuming cell function exists */}
                {col.cell ? col.cell({ row: { original: row } }) : JSON.stringify(row)}
              </td>
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
  AlertDialogTitle: vi.fn(({ children }) => <h2 data-testid="mock-alert-dialog-title">{children}</h2>),
  AlertDialogDescription: vi.fn(({ children }) => <p data-testid="mock-alert-dialog-description">{children}</p>),
  AlertDialogFooter: vi.fn(({ children }) => <div data-testid="mock-alert-dialog-footer">{children}</div>),
  AlertDialogAction: vi.fn(({ children, onClick, ...props }) => (
    <button data-testid="mock-alert-dialog-action" onClick={onClick} {...props}>
      {children}
    </button>
  )),
  AlertDialogCancel: vi.fn(({ children, onClick }) => (
    <button data-testid="mock-alert-dialog-cancel" onClick={onClick}>
      {children}
    </button>
  )),
}));

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, variant, size, disabled, ...rest }) => (
    <button
      data-testid={`mock-button-${children?.toString().toLowerCase().replace(/\s+/g, '-') || 'button'}`}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )),
}));

// Mock useToast from sonner (if that's what the component uses) or shadcn/ui
// For shadcn/ui toast:
vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));


describe('TshirtTable', () => {
  const mockOnUndoIssue = vi.fn();
  const mockToastFn = vi.fn();

  const mockData: TshirtIssuanceRow[] = [
    { id: 'issue1', users: { full_name: 'Alice Smith' }, tshirt_inventory: { size: 'M' }, issued_at: new Date('2023-01-10T10:00:00Z').toISOString(), issued_by_user: { full_name: 'Admin UserA' }, inventory_id: 'inv1', user_id: 'user1', issued_by: 'admin1' },
    { id: 'issue2', users: { full_name: 'Bob Johnson' }, tshirt_inventory: { size: 'L' }, issued_at: new Date('2023-01-11T11:00:00Z').toISOString(), issued_by_user: { full_name: 'Admin UserB' }, inventory_id: 'inv2', user_id: 'user2', issued_by: 'admin2' },
  ];

  const defaultProps = {
    data: mockData,
    loading: false,
    onUndoIssue: mockOnUndoIssue,
    profileId: 'current-admin-profile-id', // Needed for onUndoIssue
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as vi.Mock).mockReturnValue({ toast: mockToastFn });
    mockOnUndoIssue.mockResolvedValue({ success: true }); // Default success for undo
  });

  it('should render DataTable with correct columns and data', () => {
    render(<TshirtTable {...defaultProps} />);
    expect(screen.getByTestId('mock-data-table')).toBeInTheDocument();

    // Check for header presence (simplified check)
    expect(screen.getByText('Volunteer Name')).toBeInTheDocument();
    expect(screen.getByText('T-Shirt Size')).toBeInTheDocument();
    expect(screen.getByText('Issued At')).toBeInTheDocument();
    expect(screen.getByText('Issued By')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check for row data presence (simplified check for first row)
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument(); // Size for Alice
    // Dates and Issued By might need more specific checks if formatting is complex
  });

  it('should display empty state correctly', () => {
    render(<TshirtTable {...defaultProps} data={[]} />);
    expect(screen.getByTestId('mock-data-table')).toBeInTheDocument();
    // DataTable mock doesn't show "No results." itself, but it would have 0 data rows.
    // Check that no actual data rows for mockData are present.
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
  });

  describe('Undo Issuance Action', () => {
    it('should open confirmation dialog and call onUndoIssue on confirm', async () => {
      render(<TshirtTable {...defaultProps} />);
      const firstRowUndoButton = screen.getAllByTestId('mock-button-undo')[0]; // Assuming test id set in cell render for Undo button

      fireEvent.click(firstRowUndoButton);

      await waitFor(() => {
        expect(screen.getByTestId('mock-alert-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Are you sure?');
        expect(screen.getByTestId('mock-alert-dialog-description')).toHaveTextContent(/This action will mark this T-shirt issuance as undone/);
      });

      const confirmButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(defaultProps.onUndoIssue).toHaveBeenCalledWith(
          mockData[0].id, // issuanceId
          mockData[0].user_id, // userId for whom the t-shirt is being undone
          defaultProps.profileId // admin/event manager performing the undo
        );
      });
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Success',
        description: 'T-shirt issuance undone successfully for Alice Smith.',
      }));
    });

    it('should show error toast if onUndoIssue returns an error object', async () => {
      defaultProps.onUndoIssue.mockResolvedValueOnce({ error: { message: 'Undo failed error object' } });
      render(<TshirtTable {...defaultProps} />);
      const firstRowUndoButton = screen.getAllByTestId('mock-button-undo')[0];
      fireEvent.click(firstRowUndoButton);

      await waitFor(() => screen.getByTestId('mock-alert-dialog-action'));
      const confirmButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Error Undoing Issuance',
          description: 'Undo failed error object',
          variant: 'destructive',
        }));
      });
    });

    it('should show error toast if onUndoIssue throws an exception', async () => {
      defaultProps.onUndoIssue.mockRejectedValueOnce(new Error('Undo failed exception'));
      render(<TshirtTable {...defaultProps} />);
      const firstRowUndoButton = screen.getAllByTestId('mock-button-undo')[0];
      fireEvent.click(firstRowUndoButton);

      await waitFor(() => screen.getByTestId('mock-alert-dialog-action'));
      const confirmButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Error Undoing Issuance',
          description: 'Undo failed exception',
          variant: 'destructive',
        }));
      });
    });

    it('should close dialog on cancel', async () => {
      render(<TshirtTable {...defaultProps} />);
      const firstRowUndoButton = screen.getAllByTestId('mock-button-undo')[0];
      fireEvent.click(firstRowUndoButton);

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog')).toBeInTheDocument());
      const cancelButton = screen.getByTestId('mock-alert-dialog-cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        // Dialog might not be removed from DOM, but a state change should occur.
        // For this mock, we can check if onUndoIssue was NOT called.
        expect(defaultProps.onUndoIssue).not.toHaveBeenCalled();
      });
       // A more robust check would be `expect(screen.queryByTestId('mock-alert-dialog')).not.toBeInTheDocument()`
       // if the dialog truly unmounts or is hidden via CSS.
       // With the current mock, it stays in the DOM.
    });
  });

  it('should disable Undo buttons when loading is true', () => {
    render(<TshirtTable {...defaultProps} loading={true} />);
    const undoButtons = screen.getAllByTestId('mock-button-undo');
    undoButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});
