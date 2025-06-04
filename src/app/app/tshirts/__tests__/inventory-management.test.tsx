import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InventoryManagement } from '../components/inventory-management';
import { useInventoryData } from '../hooks/use-inventory-data';
import { useToast } from '@/components/ui/use-toast';

// Mock hooks
vi.mock('../hooks/use-inventory-data');
vi.mock('@/components/ui/use-toast');

// Mock child components for focused testing
vi.mock('../components/common/inline-editor', () => ({
  InlineEditor: vi.fn(({ value, onSave, disabled, placeholder, maxLength }) => (
    <input
      data-testid={`mock-inline-editor-${value}`}
      defaultValue={value}
      onBlur={(e) => onSave(e.target.value)}
      disabled={disabled}
      placeholder={placeholder || ''}
      maxLength={maxLength}
    />
  )),
}));

vi.mock('../components/common/inline-quantity-editor', () => ({
  InlineQuantityEditor: vi.fn(({ value, onSave, disabled }) => (
    <input
      data-testid={`mock-inline-quantity-editor-${value}`}
      type="number"
      defaultValue={value}
      onBlur={(e) => onSave(parseInt(e.target.value, 10))}
      disabled={disabled}
    />
  )),
}));

describe('InventoryManagement', () => {
  let mockUseInventoryData: ReturnType<typeof useInventoryData>;
  let mockToastFn: ReturnType<typeof vi.fn>;
  let mockConfirm: ReturnType<typeof vi.spyOn>;

  const sampleInventory = [
    { size_cd: 'M', sort_order: 20, quantity: 100, quantity_on_hand: 85 }, // Has issuances
    { size_cd: 'L', sort_order: 30, quantity: 80, quantity_on_hand: 70 }, // Has issuances
    { size_cd: 'S', sort_order: 10, quantity: 50, quantity_on_hand: 50 }, // No issuances
  ];

  beforeEach(() => {
    mockToastFn = vi.fn();
    (useToast as vi.Mock).mockReturnValue({ toast: mockToastFn });

    mockUseInventoryData = {
      inventory: JSON.parse(JSON.stringify(sampleInventory)),
      loading: false,
      updateQuantity: vi.fn().mockResolvedValue({ success: true }),
      updateSizeCode: vi.fn().mockResolvedValue({ success: true }),
      updateSortOrder: vi.fn().mockResolvedValue({ success: true }),
      addSize: vi.fn().mockResolvedValue({ success: true }),
      removeSize: vi.fn().mockResolvedValue({ success: true }),
      refreshInventory: vi.fn(),
      getSaving: vi.fn(() => false),
    };
    (useInventoryData as vi.Mock).mockReturnValue(mockUseInventoryData);

    mockConfirm = vi.spyOn(window, 'confirm');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading skeleton when loading is true', () => {
    (useInventoryData as vi.Mock).mockReturnValue({ ...mockUseInventoryData, loading: true });
    render(<InventoryManagement eventId={1} />);
    expect(screen.queryAllByRole('progressbar', { hidden: true }).length).toBeGreaterThan(0);
  });

  it('renders "No Inventory Data" alert when inventory is empty', () => {
    (useInventoryData as vi.Mock).mockReturnValue({ ...mockUseInventoryData, inventory: [] });
    render(<InventoryManagement eventId={1} />);
    expect(screen.getByText('No Inventory Data')).toBeInTheDocument();
  });

  it('renders table with inventory data', () => {
    render(<InventoryManagement eventId={1} />);
    expect(screen.getByText('Size Code')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByTestId('mock-inline-editor-S')).toBeInTheDocument();
    expect(screen.getByTestId('mock-inline-quantity-editor-100')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getAllByText('15')[0]).toBeInTheDocument();
  });

  describe('Add T-shirt Size Dialog', () => {
    it('opens dialog, validates input, and calls addSize', async () => {
      render(<InventoryManagement eventId={1} />);
      fireEvent.click(screen.getByRole('button', { name: /Add Size/i }));
      await waitFor(() => expect(screen.getByText('Add New T-shirt Size')).toBeVisible());

      const sizeInput = screen.getByLabelText('Size Code');
      const quantityInput = screen.getByLabelText('Initial Quantity');
      const addButton = screen.getByRole('button', { name: 'Add Size' });

      expect(addButton).toBeDisabled();

      fireEvent.change(sizeInput, { target: { value: 'XL' } });
      expect(addButton).toBeDisabled();

      fireEvent.change(quantityInput, { target: { value: '50' } });
      expect(addButton).not.toBeDisabled();

      fireEvent.click(addButton);
      await waitFor(() => expect(mockUseInventoryData.addSize).toHaveBeenCalledWith('XL', 50));
    });

    it('prevents adding size with negative quantity (client-side check)', async () => {
      render(<InventoryManagement eventId={1} />);
      fireEvent.click(screen.getByRole('button', { name: /Add Size/i }));
      await waitFor(() => expect(screen.getByText('Add New T-shirt Size')).toBeVisible());

      fireEvent.change(screen.getByLabelText('Size Code'), { target: { value: 'XS' } });
      fireEvent.change(screen.getByLabelText('Initial Quantity'), { target: { value: '-5' } });

      const addButton = screen.getByRole('button', { name: 'Add Size' });
      fireEvent.click(addButton);

      expect(mockUseInventoryData.addSize).not.toHaveBeenCalled();
    });

    it('keeps dialog open and does not clear form if addSize hook rejects (e.g. duplicate size)', async () => {
      const errorMessage = "Size code already exists";
      mockUseInventoryData.addSize.mockRejectedValueOnce(new Error(errorMessage));
      // Or if the hook returns an error object: .mockResolvedValueOnce({ error: { message: errorMessage, code: "23505"} });

      render(<InventoryManagement eventId={1} />);
      fireEvent.click(screen.getByRole('button', { name: /Add Size/i }));
      await waitFor(() => expect(screen.getByText('Add New T-shirt Size')).toBeVisible());

      const sizeInput = screen.getByLabelText('Size Code');
      const quantityInput = screen.getByLabelText('Initial Quantity');
      const addButtonInDialog = screen.getByRole('button', { name: 'Add Size' });

      fireEvent.change(sizeInput, { target: { value: 'DUP' } });
      fireEvent.change(quantityInput, { target: { value: '30' } });
      fireEvent.click(addButtonInDialog);

      await waitFor(() => expect(mockUseInventoryData.addSize).toHaveBeenCalledWith('DUP', 30));

      expect(screen.getByText('Add New T-shirt Size')).toBeVisible();
      expect(screen.getByLabelText('Size Code')).toHaveValue('DUP');
      expect(screen.getByLabelText('Initial Quantity')).toHaveValue('30');
      // Note: Toast for this error would be shown by the useInventoryData hook itself.
      // The component's responsibility is to keep the dialog open if addSize fails.
    });

    it('keeps dialog open if addSize hook rejects (e.g. invalid size format from DB)', async () => {
      mockUseInventoryData.addSize.mockRejectedValueOnce(new Error('Size code too long'));
      render(<InventoryManagement eventId={1} />);
      fireEvent.click(screen.getByRole('button', { name: /Add Size/i }));
      await waitFor(() => expect(screen.getByText('Add New T-shirt Size')).toBeVisible());

      fireEvent.change(screen.getByLabelText('Size Code'), { target: { value: 'WAYTOOLONG' } });
      fireEvent.change(screen.getByLabelText('Initial Quantity'), { target: { value: '10' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add Size' }));

      await waitFor(() => expect(mockUseInventoryData.addSize).toHaveBeenCalledWith('WAYTOOLONG', 10));
      expect(screen.getByText('Add New T-shirt Size')).toBeVisible();
      // Note: Toast for this error would be shown by the useInventoryData hook.
    });
  });

  describe('Inline Editing', () => {
    it('updates initial stock via InlineQuantityEditor', async () => {
      render(<InventoryManagement eventId={1} />);
      const editor = screen.getByTestId('mock-inline-quantity-editor-100');
      fireEvent.change(editor, { target: { value: '110' } });
      fireEvent.blur(editor);
      await waitFor(() => expect(mockUseInventoryData.updateQuantity).toHaveBeenCalledWith('M', 110, 'initial'));
    });

    it('updates size code via InlineEditor (for item with no issuances)', async () => {
      render(<InventoryManagement eventId={1} />);
      const editor = screen.getByTestId('mock-inline-editor-S');
      fireEvent.change(editor, { target: { value: 'XS' } });
      fireEvent.blur(editor);
      await waitFor(() => expect(mockUseInventoryData.updateSizeCode).toHaveBeenCalledWith('S', 'XS'));
    });

    it('does not render InlineEditor for size code if item has issuances', () => {
      render(<InventoryManagement eventId={1} />);
      expect(screen.queryByTestId('mock-inline-editor-M')).not.toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('updates sort order via InlineQuantityEditor', async () => {
      render(<InventoryManagement eventId={1} />);
      const editor = screen.getByTestId('mock-inline-quantity-editor-20');
      fireEvent.change(editor, { target: { value: '25' } });
      fireEvent.blur(editor);
      await waitFor(() => expect(mockUseInventoryData.updateSortOrder).toHaveBeenCalledWith('M', 25));
    });

    it('calls updateSortOrder and hook handles error (e.g. invalid sort order value)', async () => {
      // The component calls updateSortOrder. If the hook rejects (e.g. service throws "Sort order must be positive"),
      // the hook is responsible for any toasts. The component doesn't re-catch this.
      const errorMessage = "Sort order must be a positive number.";
      mockUseInventoryData.updateSortOrder.mockRejectedValueOnce(new Error(errorMessage));
      render(<InventoryManagement eventId={1} />);
      const editor = screen.getByTestId('mock-inline-quantity-editor-20');

      fireEvent.change(editor, { target: { value: '0' } });
      fireEvent.blur(editor);

      await waitFor(() => expect(mockUseInventoryData.updateSortOrder).toHaveBeenCalledWith('M', 0));
      // If the hook were to show a toast, a test in the hook's suite would verify:
      // expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ description: errorMessage, variant: "destructive" }));
      // The editor's value might revert or stay, depending on InlineQuantityEditor's internal logic on error,
      // which is not the focus of this component's test. Here, we just ensure the call was made.
    });

    it('calls updateSortOrder and hook handles error (e.g. generic DB error)', async () => {
      const errorMessage = "Database error";
      mockUseInventoryData.updateSortOrder.mockRejectedValueOnce(new Error(errorMessage));
      render(<InventoryManagement eventId={1} />);
      const editor = screen.getByTestId('mock-inline-quantity-editor-30');

      fireEvent.change(editor, { target: { value: '35' } });
      fireEvent.blur(editor);

      await waitFor(() => expect(mockUseInventoryData.updateSortOrder).toHaveBeenCalledWith('L', 35));
      // Toast for "Database error" would be shown by the hook.
    });
  });

  describe('Remove T-shirt Size', () => {
    it('confirms and calls removeSize for item with no issuances', async () => {
      mockConfirm.mockReturnValueOnce(true);
      render(<InventoryManagement eventId={1} />);
      const removeButtons = screen.getAllByTitle("Remove size");
      const removeButtonForS = removeButtons.find(btn => !btn.closest('button')?.disabled);

      expect(removeButtonForS).toBeInTheDocument();
      if (!removeButtonForS) throw "Remove button for S not found";
      fireEvent.click(removeButtonForS);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to remove size S? This action cannot be undone.');
      await waitFor(() => expect(mockUseInventoryData.removeSize).toHaveBeenCalledWith('S'));
    });

    it('does not call removeSize if confirmation is denied', () => {
      mockConfirm.mockReturnValueOnce(false);
      render(<InventoryManagement eventId={1} />);
      const removeButtonForS = screen.getAllByTitle("Remove size").find(btn => !btn.closest('button')?.disabled);
      if (!removeButtonForS) throw "Remove button for S not found";
      fireEvent.click(removeButtonForS);
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockUseInventoryData.removeSize).not.toHaveBeenCalled();
    });

    it('disables Remove button for item with issuances', () => {
      render(<InventoryManagement eventId={1} />);
      const removeButtonForM = screen.getByTitle('Cannot remove: T-shirts have been issued');
      expect(removeButtonForM).toBeDisabled();
    });
  });

  describe('Saving State Indicator (getSaving)', () => {
    it('disables editors and remove button when getSaving returns true for an item', () => {
      (useInventoryData as vi.Mock).mockReturnValue({
        ...mockUseInventoryData,
        getSaving: (sizeCd: string) => sizeCd === 'M',
      });
      render(<InventoryManagement eventId={1} />);

      expect(screen.queryByTestId('mock-inline-editor-M')).toBeNull();
      expect(screen.getByTestId('mock-inline-quantity-editor-20')).toBeDisabled();
      expect(screen.getByTestId('mock-inline-quantity-editor-100')).toBeDisabled();
      expect(screen.getByTitle('Cannot remove: T-shirts have been issued')).toBeDisabled();

      expect(screen.getByTestId('mock-inline-editor-S')).not.toBeDisabled();
      expect(screen.getByTestId('mock-inline-quantity-editor-50')).not.toBeDisabled();
      expect(screen.getByTestId('mock-inline-quantity-editor-10')).not.toBeDisabled();
      const removeButtonForS = screen.getAllByTitle("Remove size").find(btn => !btn.closest('button')?.disabled);
      expect(removeButtonForS).not.toBeDisabled();
    });
  });
});
