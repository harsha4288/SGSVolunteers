import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnifiedTshirtTable, UnifiedTshirtDataRow } from '../unified-tshirt-table'; // Adjust path and export name
import { useToast } from '@/components/ui/use-toast';
import * as QrCodeDisplayModule from '@/app/app/tshirts/components/qr/qr-code-display'; // To mock QrCodeDisplay

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
        {data.map((row: UnifiedTshirtDataRow, rowIndex: number) => (
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
  AlertDialog: vi.fn(({ children, open }) => open ? <div data-testid="mock-alert-dialog">{children}</div> : null),
  AlertDialogTrigger: vi.fn(({ children }) => <div data-testid="mock-alert-dialog-trigger">{children}</div>),
  AlertDialogContent: vi.fn(({ children }) => <div data-testid="mock-alert-dialog-content">{children}</div>),
  AlertDialogHeader: vi.fn(({ children }) => <div data-testid="mock-alert-dialog-header">{children}</div>),
  AlertDialogTitle: vi.fn(({ children }) => <h2 data-testid="mock-alert-dialog-title">{children}</h2>),
  AlertDialogDescription: vi.fn(({ children }) => <p data-testid="mock-alert-dialog-description">{children}</p>),
  AlertDialogFooter: vi.fn(({ children }) => <div data-testid="mock-alert-dialog-footer">{children}</div>),
  AlertDialogAction: vi.fn(({ children, onClick, ...props }) => <button data-testid="mock-alert-dialog-action" onClick={onClick} {...props}>{children}</button>),
  AlertDialogCancel: vi.fn(({ children, onClick }) => <button data-testid="mock-alert-dialog-cancel" onClick={onClick}>{children}</button>),
}));

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, variant, size, disabled, ...rest }) => (
    <button data-testid={`mock-button-${children?.toString().toLowerCase().replace(/\s+/g, '-') || 'button'}`} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  )),
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: vi.fn(({ checked, onCheckedChange, disabled, ...rest }) => (
    <input type="checkbox" data-testid={`mock-checkbox-${rest.id || 'checkbox'}`} checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} disabled={disabled} />
  )),
}));

vi.mock('@/components/ui/select', () => ({
  Select: vi.fn(({ children, onValueChange, value, ...rest }) => <select data-testid={`mock-select-${rest['data-testid'] || 'select'}`} onChange={(e) => onValueChange?.(e.target.value)} value={value}>{children}</select>),
  SelectTrigger: vi.fn(({ children }) => <div data-testid="mock-select-trigger">{children}</div>),
  SelectValue: vi.fn(({ placeholder }) => <span data-testid="mock-select-value">{placeholder}</span>),
  SelectContent: vi.fn(({ children }) => <div data-testid="mock-select-content">{children}</div>),
  SelectItem: vi.fn(({ children, value }) => <option value={value}>{children}</option>),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

// Mock QrCodeDisplay component (assuming it's used in a dialog)
vi.mock('@/app/app/tshirts/components/qr/qr-code-display', () => ({
  QrCodeDisplay: vi.fn((props) => (
    <div data-testid="mock-qr-code-display">
      QR for: {props.value}, Name: {props.volunteerName}
    </div>
  )),
}));


describe('UnifiedTshirtTable', () => {
  const mockOnUpdateClaimStatus = vi.fn();
  const mockOnIssueTshirt = vi.fn();
  const mockOnUndoLastIssue = vi.fn();
  const mockOnShowQrCode = vi.fn(); // This will typically set state to show a dialog
  const mockToastFn = vi.fn();

  const mockTshirtInventory = [
    { id: 'inv-m', size: 'M', quantity: 10 },
    { id: 'inv-l', size: 'L', quantity: 5 },
    { id: 'inv-xl', size: 'XL', quantity: 0 }, // Out of stock
  ];

  const mockData: UnifiedTshirtDataRow[] = [
    { id: 'user1', full_name: 'Alice Volunteer', email: 'alice@example.com', qr_code_token: 'qr-alice', profile_roles: [{ role: 'volunteer' }], tshirt_claims: [], tshirt_issuances: [] },
    { id: 'user2', full_name: 'Bob Manager', email: 'bob@example.com', qr_code_token: 'qr-bob', profile_roles: [{ role: 'event_manager' }], tshirt_claims: [{ tshirt_inventory_id: 'inv-l', tshirt_inventory: { size: 'L' }, claimed_at: new Date().toISOString() }], tshirt_issuances: [] },
    { id: 'user3', full_name: 'Charlie Staff', email: 'charlie@example.com', qr_code_token: 'qr-charlie', profile_roles: [{ role: 'staff' }], tshirt_claims: [], tshirt_issuances: [{ inventory_id: 'inv-m', tshirt_inventory: { size: 'M' }, issued_at: new Date().toISOString() }] },
    { id: 'user4', full_name: 'Diana ClaimedNoStock', email: 'diana@example.com', qr_code_token: 'qr-diana', profile_roles: [{ role: 'volunteer' }], tshirt_claims: [{ tshirt_inventory_id: 'inv-xl', tshirt_inventory: { size: 'XL' }, claimed_at: new Date().toISOString() }], tshirt_issuances: [] },
  ];

  const defaultProps = {
    data: mockData,
    tshirtInventory: mockTshirtInventory,
    loading: false,
    profileId: 'current-admin-id', // ID of the admin/event manager using the table
    onUpdateClaimStatus: mockOnUpdateClaimStatus,
    onIssueTshirt: mockOnIssueTshirt,
    onUndoLastIssue: mockOnUndoLastIssue,
    onShowQrCode: mockOnShowQrCode,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as vi.Mock).mockReturnValue({ toast: mockToastFn });
    mockOnUpdateClaimStatus.mockResolvedValue({ success: true });
    mockOnIssueTshirt.mockResolvedValue({ success: true });
    mockOnUndoLastIssue.mockResolvedValue({ success: true });
  });

  it('should render DataTable with correct columns and initial data', () => {
    render(<UnifiedTshirtTable {...defaultProps} />);
    expect(screen.getByTestId('mock-data-table')).toBeInTheDocument();

    // Check for some headers
    expect(screen.getByText('Volunteer')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Claimed Size')).toBeInTheDocument();
    expect(screen.getByText('Issued Size')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument(); // This is the column for claim checkbox
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check for some data from mockData
    expect(screen.getByText('Alice Volunteer')).toBeInTheDocument(); // User 1
    expect(screen.getByText('L')).toBeInTheDocument(); // Bob's claimed size
    expect(screen.getByText('M')).toBeInTheDocument(); // Charlie's issued size
  });

  describe('Claim/Unclaim Actions (via Action Menu/Buttons)', () => {
    it('allows claiming a T-shirt for an unclaimed user via action menu', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      // Alice (user1) has no claim.
      // Assuming the action cell for Alice renders a "Claim" button or a dropdown item that leads to size selection.
      // For this test, let's assume specific test IDs for action items like "Claim Size M"
      const claimMButtonForAlice = screen.getAllByTestId('mock-button-claim-size-m')[0]; // Assuming Alice is first and this button exists for her
      fireEvent.click(claimMButtonForAlice);

      await waitFor(() => {
        expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledWith(
          'user1', // Alice's ID
          'inv-m', // T-shirt ID for size M (from mockTshirtInventory)
          true,    // Claimed status
          defaultProps.profileId // Claimed by
        );
      });
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt claim updated for Alice Volunteer.' }));
    });

    it('allows unclaiming a T-shirt for a claimed user via action menu', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      // Bob (user2) has a claim.
      const unclaimButtonForBob = screen.getAllByTestId('mock-button-unclaim')[0]; // Assuming Bob is the first with an "Unclaim" button visible based on mockData structure
      fireEvent.click(unclaimButtonForBob);

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Confirm Unclaim'));
      
      const confirmButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledWith(
          'user2', // Bob's ID
          null,
          false,
          defaultProps.profileId
        );
      });
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt claim removed for Bob Manager.' }));
    });
  });
  
  describe('Claim/Unclaim via Checkbox', () => {
    it('claims with default/first available size when checkbox is checked for unclaimed user', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      // Alice (user1) is unclaimed.
      const claimCheckboxForAlice = screen.getByTestId('mock-checkbox-claim-user1');
      expect((claimCheckboxForAlice as HTMLInputElement).checked).toBe(false);

      fireEvent.click(claimCheckboxForAlice); // Check it

      // Expect a dialog to choose size
      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Select T-Shirt Size for Alice Volunteer'));
      
      // Select a size (e.g., M)
      const sizeSelect = screen.getByTestId('mock-select-t-shirt-size-select'); // data-testid for select in dialog
      fireEvent.change(sizeSelect, { target: { value: 'inv-m' } });

      const saveButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledWith(
          'user1', // Alice's ID
          'inv-m', // Selected inventory ID for size M
          true,
          defaultProps.profileId
        );
      });
       expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt claim updated for Alice Volunteer.' }));
    });

    it('unclaims when checkbox is unchecked for a claimed user', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      // Bob (user2) is claimed.
      const claimCheckboxForBob = screen.getByTestId('mock-checkbox-claim-user2');
      expect((claimCheckboxForBob as HTMLInputElement).checked).toBe(true);

      fireEvent.click(claimCheckboxForBob); // Uncheck it

      // Expect confirmation dialog for unclaiming
      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Confirm Unclaim T-Shirt for Bob Manager'));
      
      const confirmUnclaimButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(confirmUnclaimButton);

      await waitFor(() => {
        expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledWith(
          'user2', // Bob's ID
          null, 
          false,
          defaultProps.profileId
        );
      });
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt claim removed for Bob Manager.' }));
    });

    it('checkbox is disabled if T-shirt has been issued', () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      // Charlie (user3) has an issued T-shirt.
      const claimCheckboxForCharlie = screen.getByTestId('mock-checkbox-claim-user3');
      expect((claimCheckboxForCharlie as HTMLInputElement).checked).toBe(true); // Assuming issued implies claimed for display
      expect(claimCheckboxForCharlie).toBeDisabled();
    });
  });


  describe('Issue T-shirt Action', () => {
    it('allows issuing a T-shirt to a user with a valid claim (and stock)', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      // Bob (user2) has a claim for 'L' (inv-l), which has stock.
      const issueButtonForBob = screen.getAllByTestId('mock-button-issue')[0]; // Bob is first eligible for "Issue"
      fireEvent.click(issueButtonForBob);

      await waitFor(() => {
        expect(defaultProps.onIssueTshirt).toHaveBeenCalledWith(
          'user2', // Bob's ID
          'inv-l', // Bob's claimed inventory ID
          defaultProps.profileId
        );
      });
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt issued to Bob Manager.' }));
    });
    
    it('allows issuing a T-shirt to a user without a claim (opens size selection dialog)', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      // Alice (user1) has no claim.
      const issueButtonForAlice = screen.getAllByTestId('mock-button-issue')[0]; // Alice is first
      fireEvent.click(issueButtonForAlice);

      // Expect dialog to select size for issuance
      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Select T-Shirt Size to Issue to Alice Volunteer'));
      
      const sizeSelect = screen.getByTestId('mock-select-t-shirt-size-select');
      fireEvent.change(sizeSelect, { target: { value: 'inv-m' } }); // Select size M

      const confirmIssueButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(confirmIssueButton);

      await waitFor(() => {
        expect(defaultProps.onIssueTshirt).toHaveBeenCalledWith(
          'user1', // Alice's ID
          'inv-m', // Selected inventory ID for size M
          defaultProps.profileId
        );
      });
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt issued to Alice Volunteer.' }));
    });


    it('disables Issue button if T-shirt already issued', () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      // Charlie (user3) has an issued T-shirt. The actions cell for Charlie should not contain an enabled "Issue" button.
      // This requires the cell rendering logic to correctly disable/hide it.
      // We check if any "Issue" button corresponds to Charlie and is enabled.
      const charlieRowActions = screen.getAllByRole('row')[3].cells[5]; // Assuming Actions is 6th cell, Charlie is 3rd data row
      const issueButtonForCharlie = within(charlieRowActions).queryByTestId('mock-button-issue');
      if (issueButtonForCharlie) { // If button is rendered at all
        expect(issueButtonForCharlie).toBeDisabled();
      } else { // Or it might not be rendered
        expect(issueButtonForCharlie).toBeNull();
      }
    });

    it('disables Issue button if claimed T-shirt is out of stock', () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      // Diana (user4) claimed 'XL' (inv-xl), which is out of stock.
      const dianaRowActions = screen.getAllByRole('row')[4].cells[5]; // Diana is 4th data row
      const issueButtonForDiana = within(dianaRowActions).getByTestId('mock-button-issue'); // Should be rendered but disabled
      expect(issueButtonForDiana).toBeDisabled();
    });
  });

  describe('Undo Last Issue Action', () => {
    it('allows undoing the last issue for an issued user', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      // Charlie (user3) has an issued T-shirt.
      const undoButtonForCharlie = screen.getAllByTestId('mock-button-undo-issue')[0]; // Charlie is only one with undo
      fireEvent.click(undoButtonForCharlie);
      
      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Confirm Undo Issuance for Charlie Staff'));

      const confirmButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(defaultProps.onUndoLastIssue).toHaveBeenCalledWith(
          'user3', // Charlie's ID
          defaultProps.profileId
        );
      });
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt issuance undone for Charlie Staff.' }));
    });
  });

  describe('Show QR Code Action', () => {
    it('calls onShowQrCode with user details', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      const showQrButtonForAlice = screen.getAllByTestId('mock-button-show-qr')[0]; // Alice
      fireEvent.click(showQrButtonForAlice);

      await waitFor(() => {
        expect(defaultProps.onShowQrCode).toHaveBeenCalledWith(
          mockData[0] // Alice's full data object
        );
      });
    });
  });
  
  describe('Loading State', () => {
    it('disables action buttons and checkboxes when loading is true', () => {
      render(<UnifiedTshirtTable {...defaultProps} loading={true} />);
      
      // Check action buttons (more specific selectors might be needed if test IDs are dynamic)
      screen.getAllByRole('button').forEach(button => {
        // Don't check table sort buttons if any
        if (!button.id.includes('sort')) { // Example to exclude sort buttons
            // More specific: check if it's one of our action buttons
            if (button.textContent && ["Claim Size M", "Unclaim", "Issue", "Undo Issue", "Show QR"].includes(button.textContent)) {
                 expect(button).toBeDisabled();
            }
        }
      });
      
      // Check claim checkboxes
      screen.getAllByTestId(/^mock-checkbox-claim-/i).forEach(checkbox => {
        expect(checkbox).toBeDisabled();
      });
    });
  });

  it('renders correctly with empty data', () => {
    render(<UnifiedTshirtTable {...defaultProps} data={[]} />);
    expect(screen.getByTestId('mock-data-table')).toBeInTheDocument();
    expect(screen.queryByText('Alice Volunteer')).not.toBeInTheDocument();
  });

  it('correctly displays status text for different users', () => {
    render(<UnifiedTshirtTable {...defaultProps} />);
    // Alice (user1): Not Claimed
    // Bob (user2): Claimed (L)
    // Charlie (user3): Issued (M)
    // Diana (user4): Claimed (XL - Out of Stock)
    
    // This requires the cell rendering for status to output these exact texts
    // or for us to query based on row content.
    const rows = screen.getAllByRole('row'); // Includes header row

    // Alice (row 1)
    expect(within(rows[1]).getByText('Not Claimed')).toBeInTheDocument();
    // Bob (row 2)
    expect(within(rows[2]).getByText('Claimed (L)')).toBeInTheDocument();
     // Charlie (row 3)
    expect(within(rows[3]).getByText('Issued (M)')).toBeInTheDocument();
    // Diana (row 4)
    expect(within(rows[4]).getByText('Claimed (XL - Out of Stock)')).toBeInTheDocument();
  });

});

// Helper to use 'within' for scoped queries if needed for complex cells
import { within } from '@testing-library/react';
});
