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
  const mockOnShowQrCode = vi.fn();
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
    profileId: 'current-admin-id',
    onUpdateClaimStatus: mockOnUpdateClaimStatus,
    onIssueTshirt: mockOnIssueTshirt,
    onUndoLastIssue: mockOnUndoLastIssue,
    onShowQrCode: mockOnShowQrCode,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as vi.Mock).mockReturnValue({ toast: mockToastFn });
    mockOnUpdateClaimStatus.mockResolvedValue({ success: true }); // Default success
    mockOnIssueTshirt.mockResolvedValue({ success: true }); // Default success
    mockOnUndoLastIssue.mockResolvedValue({ success: true }); // Default success
  });

  it('should render DataTable with correct columns and initial data', () => {
    render(<UnifiedTshirtTable {...defaultProps} />);
    expect(screen.getByTestId('mock-data-table')).toBeInTheDocument();
    expect(screen.getByText('Volunteer')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Claimed Size')).toBeInTheDocument();
    expect(screen.getByText('Issued Size')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Alice Volunteer')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  describe('Claim/Unclaim Actions (via Action Menu/Buttons)', () => {
    it('allows claiming a T-shirt for an unclaimed user via action menu', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      const claimMButtonForAlice = screen.getAllByTestId('mock-button-claim-size-m')[0];
      fireEvent.click(claimMButtonForAlice);

      await waitFor(() => {
        expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledWith('user1', 'inv-m', true, defaultProps.profileId);
      });
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt claim updated for Alice Volunteer.' }));
    });

    it('shows admin override dialog if claiming for volunteer at limit (via menu), then claims on confirm', async () => {
      defaultProps.onUpdateClaimStatus
        .mockResolvedValueOnce({ error: { message: 'Allocation limit reached', code: 'ALLOCATION_LIMIT_REACHED' } })
        .mockResolvedValueOnce({ success: true });

      render(<UnifiedTshirtTable {...defaultProps} />);
      const claimMButtonForAlice = screen.getAllByTestId('mock-button-claim-size-m')[0];
      fireEvent.click(claimMButtonForAlice);

      await waitFor(() => expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledTimes(1));

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Admin Override: Allocation Limit'));
      expect(screen.getByText(/Volunteer Alice Volunteer has reached their T-shirt allocation limit for claiming./)).toBeInTheDocument();

      const confirmOverrideButton = screen.getByRole('button', { name: 'Claim Anyway (Admin Override)' });
      fireEvent.click(confirmOverrideButton);

      await waitFor(() => expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledTimes(2));
      expect(defaultProps.onUpdateClaimStatus).toHaveBeenLastCalledWith('user1', 'inv-m', true, defaultProps.profileId, true);
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt claim updated for Alice Volunteer (Admin Override).' }));
    });


    it('allows unclaiming a T-shirt for a claimed user via action menu', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      const unclaimButtonForBob = screen.getAllByTestId('mock-button-unclaim')[0];
      fireEvent.click(unclaimButtonForBob);

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Confirm Unclaim'));

      const confirmButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledWith('user2', null, false, defaultProps.profileId);
      });
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt claim removed for Bob Manager.' }));
    });
  });

  describe('Claim/Unclaim via Checkbox', () => {
    it('claims via checkbox, opening size select dialog', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      const claimCheckboxForAlice = screen.getByTestId('mock-checkbox-claim-user1');
      expect((claimCheckboxForAlice as HTMLInputElement).checked).toBe(false);
      fireEvent.click(claimCheckboxForAlice);

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Select T-Shirt Size for Alice Volunteer'));

      const sizeSelect = screen.getByTestId('mock-select-t-shirt-size-select');
      fireEvent.change(sizeSelect, { target: { value: 'inv-m' } });

      const saveButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledWith('user1', 'inv-m', true, defaultProps.profileId);
      });
       expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt claim updated for Alice Volunteer.' }));
    });

    it('claims via checkbox, shows admin override if limit hit, then claims on confirm', async () => {
      defaultProps.onUpdateClaimStatus
        .mockResolvedValueOnce({ error: { message: 'Allocation limit reached', code: 'ALLOCATION_LIMIT_REACHED' } })
        .mockResolvedValueOnce({ success: true });

      render(<UnifiedTshirtTable {...defaultProps} />);
      const claimCheckboxForAlice = screen.getByTestId('mock-checkbox-claim-user1');
      fireEvent.click(claimCheckboxForAlice);

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Select T-Shirt Size for Alice Volunteer'));
      fireEvent.change(screen.getByTestId('mock-select-t-shirt-size-select'), { target: { value: 'inv-m' } });
      fireEvent.click(screen.getByTestId('mock-alert-dialog-action'));

      await waitFor(() => expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledTimes(1));

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Admin Override: Allocation Limit'));
      expect(screen.getByText(/Volunteer Alice Volunteer has reached their T-shirt allocation limit for claiming./)).toBeInTheDocument();

      const confirmOverrideButton = screen.getByRole('button', { name: 'Claim Anyway (Admin Override)' });
      fireEvent.click(confirmOverrideButton);

      await waitFor(() => expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledTimes(2));
      expect(defaultProps.onUpdateClaimStatus).toHaveBeenLastCalledWith('user1', 'inv-m', true, defaultProps.profileId, true);
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt claim updated for Alice Volunteer (Admin Override).' }));
    });


    it('unclaims when checkbox is unchecked for a claimed user', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      const claimCheckboxForBob = screen.getByTestId('mock-checkbox-claim-user2');
      expect((claimCheckboxForBob as HTMLInputElement).checked).toBe(true);
      fireEvent.click(claimCheckboxForBob);

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Confirm Unclaim T-Shirt for Bob Manager'));

      const confirmUnclaimButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(confirmUnclaimButton);

      await waitFor(() => {
        expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledWith('user2', null, false, defaultProps.profileId);
      });
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt claim removed for Bob Manager.' }));
    });

    it('checkbox is disabled if T-shirt has been issued', () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      const claimCheckboxForCharlie = screen.getByTestId('mock-checkbox-claim-user3');
      expect((claimCheckboxForCharlie as HTMLInputElement).checked).toBe(true);
      expect(claimCheckboxForCharlie).toBeDisabled();
    });
  });


  describe('Issue T-shirt Action', () => {
    it('allows issuing a T-shirt to a user with a valid claim (and stock)', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      const issueButtonForBob = screen.getAllByTestId('mock-button-issue')[0];
      fireEvent.click(issueButtonForBob);

      await waitFor(() => {
        expect(defaultProps.onIssueTshirt).toHaveBeenCalledWith('user2', 'inv-l', defaultProps.profileId);
      });
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt issued to Bob Manager.' }));
    });

    it('shows admin override dialog if issuing to volunteer at limit, then issues on confirm', async () => {
      defaultProps.onIssueTshirt
        .mockResolvedValueOnce({ error: { message: 'Allocation limit reached', code: 'ALLOCATION_LIMIT_REACHED' } })
        .mockResolvedValueOnce({ success: true });

      render(<UnifiedTshirtTable {...defaultProps} />);
      const issueButtonForAlice = screen.getAllByTestId('mock-button-issue').find(
        (btn) => within(btn.closest('tr')!).queryByText('Alice Volunteer')
      ) || screen.getAllByTestId('mock-button-issue')[0];

      if (!issueButtonForAlice) throw new Error("Could not find Issue button for Alice");
      fireEvent.click(issueButtonForAlice);

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Select T-Shirt Size to Issue to Alice Volunteer'));
      const sizeSelect = screen.getByTestId('mock-select-t-shirt-size-select');
      fireEvent.change(sizeSelect, { target: { value: 'inv-m' } });
      const confirmIssueButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(confirmIssueButton);

      await waitFor(() => expect(defaultProps.onIssueTshirt).toHaveBeenCalledTimes(1));

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Admin Override: Allocation Limit'));
      expect(screen.getByText(/Volunteer Alice Volunteer has reached their T-shirt allocation limit./)).toBeInTheDocument();

      const confirmOverrideButton = screen.getByRole('button', { name: 'Issue Anyway (Admin Override)' });
      fireEvent.click(confirmOverrideButton);

      await waitFor(() => expect(defaultProps.onIssueTshirt).toHaveBeenCalledTimes(2));
      expect(defaultProps.onIssueTshirt).toHaveBeenLastCalledWith('user1', 'inv-m', defaultProps.profileId, true);

      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt issued to Alice Volunteer (Admin Override).' }));
    });

    it('shows admin override dialog for issuing, then cancels if admin chooses cancel', async () => {
      defaultProps.onIssueTshirt.mockResolvedValueOnce({ error: { message: 'Allocation limit reached', code: 'ALLOCATION_LIMIT_REACHED' } });
      render(<UnifiedTshirtTable {...defaultProps} />);
      const issueButtonForAlice = screen.getAllByTestId('mock-button-issue').find(
         (btn) => within(btn.closest('tr')!).queryByText('Alice Volunteer')
      ) || screen.getAllByTestId('mock-button-issue')[0];
      if (!issueButtonForAlice) throw new Error("Could not find Issue button for Alice");
      fireEvent.click(issueButtonForAlice);

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Select T-Shirt Size to Issue to Alice Volunteer'));
      fireEvent.change(screen.getByTestId('mock-select-t-shirt-size-select'), { target: { value: 'inv-m' } });
      fireEvent.click(screen.getByTestId('mock-alert-dialog-action'));

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Admin Override: Allocation Limit'));

      const cancelOverrideButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelOverrideButton);

      expect(defaultProps.onIssueTshirt).toHaveBeenCalledTimes(1);
      expect(mockToastFn).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }));
    });

    it('allows issuing a T-shirt to a user without a claim (opens size selection dialog)', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      const issueButtonForAlice = screen.getAllByTestId('mock-button-issue').find(
         (btn) => within(btn.closest('tr')!).queryByText('Alice Volunteer')
      ) || screen.getAllByTestId('mock-button-issue')[0];
       if (!issueButtonForAlice) throw new Error("Could not find Issue button for Alice");
      fireEvent.click(issueButtonForAlice);

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Select T-Shirt Size to Issue to Alice Volunteer'));

      const sizeSelect = screen.getByTestId('mock-select-t-shirt-size-select');
      fireEvent.change(sizeSelect, { target: { value: 'inv-m' } });

      const confirmIssueButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(confirmIssueButton);

      await waitFor(() => {
        expect(defaultProps.onIssueTshirt).toHaveBeenCalledWith('user1', 'inv-m', defaultProps.profileId);
      });
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt issued to Alice Volunteer.' }));
    });


    it('disables Issue button if T-shirt already issued', () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      const charlieRowActions = screen.getAllByRole('row')[3].cells[5];
      const issueButtonForCharlie = within(charlieRowActions).queryByTestId('mock-button-issue');
      if (issueButtonForCharlie) {
        expect(issueButtonForCharlie).toBeDisabled();
      } else {
        expect(issueButtonForCharlie).toBeNull();
      }
    });

    it('disables Issue button if claimed T-shirt is out of stock', () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      const dianaRowActions = screen.getAllByRole('row')[4].cells[5];
      const issueButtonForDiana = within(dianaRowActions).getByTestId('mock-button-issue');
      expect(issueButtonForDiana).toBeDisabled();
    });
  });

  describe('Undo Last Issue Action', () => {
    it('allows undoing the last issue for an issued user', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      const undoButtonForCharlie = screen.getAllByTestId('mock-button-undo-issue')[0];
      fireEvent.click(undoButtonForCharlie);

      await waitFor(() => expect(screen.getByTestId('mock-alert-dialog-title')).toHaveTextContent('Confirm Undo Issuance for Charlie Staff'));

      const confirmButton = screen.getByTestId('mock-alert-dialog-action');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(defaultProps.onUndoLastIssue).toHaveBeenCalledWith('user3', defaultProps.profileId);
      });
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt issuance undone for Charlie Staff.' }));
    });
  });

  describe('Show QR Code Action', () => {
    it('calls onShowQrCode with user details', async () => {
      render(<UnifiedTshirtTable {...defaultProps} />);
      const showQrButtonForAlice = screen.getAllByTestId('mock-button-show-qr')[0];
      fireEvent.click(showQrButtonForAlice);

      await waitFor(() => {
        expect(defaultProps.onShowQrCode).toHaveBeenCalledWith(mockData[0]);
      });
    });
  });

  describe('Loading State', () => {
    it('disables action buttons and checkboxes when loading is true', () => {
      render(<UnifiedTshirtTable {...defaultProps} loading={true} />);

      screen.getAllByRole('button').forEach(button => {
        if (!button.id.includes('sort')) {
            if (button.textContent && ["Claim Size M", "Unclaim", "Issue", "Undo Issue", "Show QR"].includes(button.textContent)) {
                 expect(button).toBeDisabled();
            }
        }
      });

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
    const rows = screen.getAllByRole('row');

    expect(within(rows[1]).getByText('Not Claimed')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Claimed (L)')).toBeInTheDocument();
    expect(within(rows[3]).getByText('Issued (M)')).toBeInTheDocument();
    expect(within(rows[4]).getByText('Claimed (XL - Out of Stock)')).toBeInTheDocument();
  });

  describe('Role-Based Access Control (RBAC)', () => {
    describe('Volunteer Role', () => {
      const volunteerProfileId = 'user1'; // Alice Volunteer
      // Data for Alice only, as if filtered by the component
      const volunteerOwnData = mockData.filter(u => u.id === volunteerProfileId);

      it('should display only own data for a volunteer', async () => {
        // Pass full data to simulate parent not pre-filtering, component must filter
        render(
          <UnifiedTshirtTable
            {...defaultProps}
            userRole="volunteer"
            profileId={volunteerProfileId}
            data={mockData} // Full data initially
          />
        );

        // The DataTable mock receives data via its `data` prop.
        // We need to await for the component's useEffect to filter and trigger a re-render of DataTable.
        // Or, if filtering is synchronous, it should be immediate.
        // Given the mock structure, the easiest is to check what data DataTable was called with.
        await waitFor(async () => {
          const { DataTable } = await import('@/components/ui/data-table');
          const lastCallToDataTable = (DataTable as vi.Mock).mock.calls[(DataTable as vi.Mock).mock.calls.length - 1];
          expect(lastCallToDataTable[0].data.length).toBe(1);
          expect(lastCallToDataTable[0].data[0].id).toBe(volunteerProfileId);
        });

        expect(screen.getByText('Alice Volunteer')).toBeInTheDocument();
        expect(screen.queryByText('Bob Manager')).not.toBeInTheDocument();
        expect(screen.queryByText('Charlie Staff')).not.toBeInTheDocument();
      });

      it('should allow volunteer to show their own QR code', async () => {
        render(<UnifiedTshirtTable {...defaultProps} userRole="volunteer" profileId={volunteerProfileId} data={volunteerOwnData} />);
        // Since only Alice's data is rendered, there should be only one "Show QR" button.
        const showQrButtonForAlice = screen.getByTestId('mock-button-show-qr');
        fireEvent.click(showQrButtonForAlice);
        await waitFor(() => {
          expect(defaultProps.onShowQrCode).toHaveBeenCalledWith(volunteerOwnData[0]);
        });
      });

      it('should allow volunteer to manage their own claim but not issue/undo general issuances', async () => {
        const aliceUnclaimedData = [{ ...mockData.find(u=>u.id === volunteerProfileId)!, tshirt_claims: [], tshirt_issuances: [] }];
        const { rerender } = render(<UnifiedTshirtTable {...defaultProps} userRole="volunteer" profileId={volunteerProfileId} data={aliceUnclaimedData} />);

        // Volunteer can claim for themselves (e.g., Claim Size M)
        const claimMButtonForAlice = screen.getByTestId('mock-button-claim-size-m');
        fireEvent.click(claimMButtonForAlice);
        await waitFor(() => {
          expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledWith(volunteerProfileId, 'inv-m', true, volunteerProfileId);
        });

        // Simulate Alice having a claim
        const aliceClaimedMData = [{ ...aliceUnclaimedData[0], tshirt_claims: [{ tshirt_inventory_id: 'inv-m', tshirt_inventory: { size: 'M' }, claimed_at: 'date' }] }];
        rerender(<UnifiedTshirtTable {...defaultProps} userRole="volunteer" profileId={volunteerProfileId} data={aliceClaimedMData} />);

        // Volunteer can unclaim their own claim
        const unclaimButtonForAlice = screen.getByTestId('mock-button-unclaim');
        fireEvent.click(unclaimButtonForAlice);
        await waitFor(() => screen.getByTestId('mock-alert-dialog-action')); // Confirmation dialog
        fireEvent.click(screen.getByTestId('mock-alert-dialog-action'));
        await waitFor(() => {
          expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledWith(volunteerProfileId, null, false, volunteerProfileId);
        });

        // Check for absence or disabled state of Issue/Undo buttons for self.
        // This depends on how `renderActionsCell` handles it for volunteers.
        // Assuming for volunteers, these actions for *themselves* are not available through these specific buttons.
        const aliceRow = screen.getByText('Alice Volunteer').closest('tr');
        if(aliceRow) {
            expect(within(aliceRow).queryByTestId('mock-button-issue')).toBeNull(); // Or .toBeDisabled()
            expect(within(aliceRow).queryByTestId('mock-button-undo-issue')).toBeNull(); // Or .toBeDisabled()
        } else {
            throw new Error("Alice's row not found for action check");
        }
      });
    });

    describe('Admin Role', () => {
      it('should display all users data for an admin', async () => {
        render(<UnifiedTshirtTable {...defaultProps} userRole="admin" profileId="current-admin-id" data={mockData} />);
        expect(screen.getByText('Alice Volunteer')).toBeInTheDocument();
        expect(screen.getByText('Bob Manager')).toBeInTheDocument();
        expect(screen.getByText('Charlie Staff')).toBeInTheDocument();

        const { DataTable } = await import('@/components/ui/data-table');
        const lastCallToDataTable = (DataTable as vi.Mock).mock.calls[(DataTable as vi.Mock).mock.calls.length - 1];
        expect(lastCallToDataTable[0].data.length).toBe(mockData.length);
      });

      it('should allow admin to perform all actions on any suitable user record', async () => {
        render(<UnifiedTshirtTable {...defaultProps} userRole="admin" />);

        // Admin claims for Alice (user1)
        const claimMButtonForAlice = screen.getAllByTestId('mock-button-claim-size-m')[0];
        fireEvent.click(claimMButtonForAlice);
        await waitFor(() => {
          expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledWith('user1', 'inv-m', true, defaultProps.profileId);
        });

        // Admin issues for Bob (user2, who has a claim for 'L')
        const bobRow = Array.from(screen.getAllByRole('row')).find(row => within(row).queryByText('Bob Manager'));
        if (!bobRow) throw new Error("Bob Manager's row not found");
        const issueButtonForBob = within(bobRow).getByTestId('mock-button-issue');
        fireEvent.click(issueButtonForBob);
        await waitFor(() => {
          expect(defaultProps.onIssueTshirt).toHaveBeenCalledWith('user2', 'inv-l', defaultProps.profileId);
        });

        // Admin undoes for Charlie (user3, who is issued)
        const charlieRow = Array.from(screen.getAllByRole('row')).find(row => within(row).queryByText('Charlie Staff'));
        if (!charlieRow) throw new Error("Charlie Staff's row not found");
        const undoButtonForCharlie = within(charlieRow).getByTestId('mock-button-undo-issue');
        fireEvent.click(undoButtonForCharlie);
        await waitFor(() => screen.getByTestId('mock-alert-dialog-action'));
        fireEvent.click(screen.getByTestId('mock-alert-dialog-action'));
        await waitFor(() => {
          expect(defaultProps.onUndoLastIssue).toHaveBeenCalledWith('user3', defaultProps.profileId);
        });
      });

      // Note: Admin-specific UI elements like "Inventory Management button" or "advanced filter options"
      // are assumed to be part of a parent page (e.g., TshirtsPage) and not UnifiedTshirtTable itself.
      // Thus, tests for their visibility are not included here.
    });
  });

  it('reflects updated claim when user changes preferred size (single claim policy)', async () => {
    const { rerender } = render(<UnifiedTshirtTable {...defaultProps} />);

    // Alice (user1) initially has no claim.
    // 1. Admin claims "Size M" for Alice via action menu
    const claimMButtonForAlice = screen.getAllByTestId('mock-button-claim-size-m')[0];
    fireEvent.click(claimMButtonForAlice);
    await waitFor(() => {
      expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledWith('user1', 'inv-m', true, defaultProps.profileId);
    });
    expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt claim updated for Alice Volunteer.' }));

    // Simulate data update: Alice now has claim for M
    const updatedDataAfterMClaim = defaultProps.data.map(u =>
      u.id === 'user1' ? { ...u, tshirt_claims: [{ tshirt_inventory_id: 'inv-m', tshirt_inventory: { size: 'M' }, claimed_at: new Date().toISOString() }] } : u
    );
    rerender(<UnifiedTshirtTable {...defaultProps} data={updatedDataAfterMClaim} />);

    // Verify UI shows "Claimed (M)" for Alice
    const rowsAfterMClaim = screen.getAllByRole('row');
    const aliceRowAfterMClaim = Array.from(rowsAfterMClaim).find(row => within(row).queryByText('Alice Volunteer'));
    expect(aliceRowAfterMClaim).toBeDefined();
    if (aliceRowAfterMClaim) {
      expect(within(aliceRowAfterMClaim).getByText('Claimed (M)')).toBeInTheDocument();
    }

    // 2. Admin changes Alice's claim to "Size L" via action menu
    // Note: The action menu might need to dynamically offer "Claim Size L" or a generic "Change Claim"
    // For this test, we'll assume a "Claim Size L" button becomes available or is identifiable for Alice.
    // If the component re-uses the same button types, ensure mocks are reset if needed or specific instances are targeted.
    // We might need to mock the cell rendering for Alice to now offer different claim options.
    // For simplicity, let's assume `getAllByTestId` can find the new target.
    // If the button text/id changes (e.g. "Change Claim to L"), update selector.
    // For this example, assuming 'mock-button-claim-size-l' would be how to claim L via menu.
    // This requires the `renderActionsCell` to be flexible or the test to be adapted to how it actually renders.
    // If claim buttons are always there:
    const claimLButtonForAlice = screen.getAllByTestId('mock-button-claim-size-l')[0]; // You'd need test IDs like this
    fireEvent.click(claimLButtonForAlice);

    await waitFor(() => {
      expect(defaultProps.onUpdateClaimStatus).toHaveBeenCalledWith('user1', 'inv-l', true, defaultProps.profileId);
    });
    expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'T-shirt claim updated for Alice Volunteer.' }));

    // Simulate data update: Alice's claim is now for L
    const updatedDataAfterLClaim = updatedDataAfterMClaim.map(u =>
      u.id === 'user1' ? { ...u, tshirt_claims: [{ tshirt_inventory_id: 'inv-l', tshirt_inventory: { size: 'L' }, claimed_at: new Date().toISOString() }] } : u
    );
    rerender(<UnifiedTshirtTable {...defaultProps} data={updatedDataAfterLClaim} />);

    // Verify UI shows "Claimed (L)" for Alice and not "Claimed (M)"
    const rowsAfterLClaim = screen.getAllByRole('row');
    const aliceRowAfterLClaim = Array.from(rowsAfterLClaim).find(row => within(row).queryByText('Alice Volunteer'));
    expect(aliceRowAfterLClaim).toBeDefined();
    if (aliceRowAfterLClaim) {
      expect(within(aliceRowAfterLClaim).getByText('Claimed (L)')).toBeInTheDocument();
      expect(within(aliceRowAfterLClaim).queryByText('Claimed (M)')).not.toBeInTheDocument();
    }
  });
});

// Helper to use 'within' for scoped queries if needed for complex cells
import { within } from '@testing-library/react';
