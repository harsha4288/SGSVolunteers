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
      data-testid={`mock-inline-editor-${value}`} // Test ID includes value for easier targeting
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
      data-testid={`mock-inline-quantity-editor-${value}`} // Test ID includes value
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
      inventory: JSON.parse(JSON.stringify(sampleInventory)), // Deep copy for each test
      loading: false,
      updateQuantity: vi.fn().mockResolvedValue({ success: true }),
      updateSizeCode: vi.fn().mockResolvedValue({ success: true }),
      updateSortOrder: vi.fn().mockResolvedValue({ success: true }),
      addSize: vi.fn().mockResolvedValue({ success: true }),
      removeSize: vi.fn().mockResolvedValue({ success: true }),
      refreshInventory: vi.fn(),
      getSaving: vi.fn(() => false), // Default: no item is currently being saved
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
    // Check for presence of pulse-animated divs (typical skeleton pattern)
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
    expect(screen.getByText('M')).toBeInTheDocument(); // Rendered as span due to issuances
    expect(screen.getByText('L')).toBeInTheDocument(); // Rendered as span due to issuances
    // For 'S', which has no issuances, InlineEditor mock is used
    expect(screen.getByTestId('mock-inline-editor-S')).toBeInTheDocument();
    expect(screen.getByTestId('mock-inline-quantity-editor-100')).toBeInTheDocument(); // M's initial stock
    expect(screen.getByText('85')).toBeInTheDocument(); // M's current stock (quantity_on_hand)
    expect(screen.getAllByText('15')[0]).toBeInTheDocument(); // M's issued (100 - 85)
  });

  describe('Add T-shirt Size Dialog', () => {
    it('opens dialog, validates input, and calls addSize', async () => {
      render(<InventoryManagement eventId={1} />);
      fireEvent.click(screen.getByRole('button', { name: /Add Size/i }));
      await waitFor(() => expect(screen.getByText('Add New T-shirt Size')).toBeVisible());

      const sizeInput = screen.getByLabelText('Size Code');
      const quantityInput = screen.getByLabelText('Initial Quantity');
      const addButton = screen.getByRole('button', { name: 'Add Size' }); // Specific to dialog

      expect(addButton).toBeDisabled(); // Initially disabled

      fireEvent.change(sizeInput, { target: { value: 'XL' } });
      expect(addButton).toBeDisabled(); // Quantity still missing

      fireEvent.change(quantityInput, { target: { value: '50' } });
      expect(addButton).not.toBeDisabled();

      fireEvent.click(addButton);
      await waitFor(() => expect(mockUseInventoryData.addSize).toHaveBeenCalledWith('XL', 50));
      // Assuming addSize success closes dialog and resets form (tested by component's internal state logic)
    });

    it('prevents adding size with negative quantity', async () => {
      render(<InventoryManagement eventId={1} />);
      fireEvent.click(screen.getByRole('button', { name: /Add Size/i }));
      await waitFor(() => expect(screen.getByText('Add New T-shirt Size')).toBeVisible());
      
      fireEvent.change(screen.getByLabelText('Size Code'), { target: { value: 'XS' } });
      fireEvent.change(screen.getByLabelText('Initial Quantity'), { target: { value: '-5' } });
      
      const addButton = screen.getByRole('button', { name: 'Add Size' });
      fireEvent.click(addButton);
      
      // handleAddSize should prevent call to addSize if quantity is < 0
      expect(mockUseInventoryData.addSize).not.toHaveBeenCalled();
    });
  });

  describe('Inline Editing', () => {
    it('updates initial stock via InlineQuantityEditor', async () => {
      render(<InventoryManagement eventId={1} />);
      const editor = screen.getByTestId('mock-inline-quantity-editor-100'); // M's initial stock
      fireEvent.change(editor, { target: { value: '110' } });
      fireEvent.blur(editor); // Triggers onSave
      await waitFor(() => expect(mockUseInventoryData.updateQuantity).toHaveBeenCalledWith('M', 110, 'initial'));
    });

    it('updates size code via InlineEditor (for item with no issuances)', async () => {
      render(<InventoryManagement eventId={1} />);
      const editor = screen.getByTestId('mock-inline-editor-S'); // S (no issuances)
      fireEvent.change(editor, { target: { value: 'XS' } });
      fireEvent.blur(editor);
      await waitFor(() => expect(mockUseInventoryData.updateSizeCode).toHaveBeenCalledWith('S', 'XS'));
    });

    it('does not render InlineEditor for size code if item has issuances', () => {
      render(<InventoryManagement eventId={1} />);
      expect(screen.queryByTestId('mock-inline-editor-M')).not.toBeInTheDocument(); // M has issuances
      expect(screen.getByText('M')).toBeInTheDocument(); // Rendered as span
    });

    it('updates sort order via InlineQuantityEditor', async () => {
      render(<InventoryManagement eventId={1} />);
      const editor = screen.getByTestId('mock-inline-quantity-editor-20'); // M's sort order
      fireEvent.change(editor, { target: { value: '25' } });
      fireEvent.blur(editor);
      await waitFor(() => expect(mockUseInventoryData.updateSortOrder).toHaveBeenCalledWith('M', 25));
    });
  });

  describe('Remove T-shirt Size', () => {
    it('confirms and calls removeSize for item with no issuances', async () => {
      mockConfirm.mockReturnValueOnce(true);
      render(<InventoryManagement eventId={1} />);
      // Find remove button for 'S' (no issuances)
      // This assumes a specific way to target the button, e.g., via its row or a more specific test ID.
      // For now, we'll rely on the order and enabled state.
      const removeButtons = screen.getAllByTitle("Remove size"); // Only enabled buttons will have this title if disabled ones have different title
      const removeButtonForS = removeButtons.find(btn => !btn.closest('button')?.disabled); // Find the one that's not disabled

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
      // Find remove button for 'M' (has issuances)
      // This test requires being able to specifically target the button for 'M'.
      // The title changes if it's disabled due to issuances.
      const removeButtonForM = screen.getByTitle('Cannot remove: T-shirts have been issued');
      expect(removeButtonForM).toBeDisabled();
    });
  });

  describe('Saving State Indicator (getSaving)', () => {
    it('disables editors and remove button when getSaving returns true for an item', () => {
      (useInventoryData as vi.Mock).mockReturnValue({
        ...mockUseInventoryData,
        getSaving: (sizeCd: string) => sizeCd === 'M', // 'M' is being saved
      });
      render(<InventoryManagement eventId={1} />);
      
      // For 'M'
      // Size code 'M' has issuances, so it's a span, not InlineEditor. Test its non-editable nature.
      expect(screen.queryByTestId('mock-inline-editor-M')).toBeNull(); 
      expect(screen.getByTestId('mock-inline-quantity-editor-20')).toBeDisabled(); // Sort Order for M
      expect(screen.getByTestId('mock-inline-quantity-editor-100')).toBeDisabled(); // Initial Stock for M
      expect(screen.getByTitle('Cannot remove: T-shirts have been issued')).toBeDisabled(); // Remove for M (already disabled by issuances, but saving state would also disable)

      // For 'S' (not being saved, no issuances)
      expect(screen.getByTestId('mock-inline-editor-S')).not.toBeDisabled();
      expect(screen.getByTestId('mock-inline-quantity-editor-50')).not.toBeDisabled(); // Initial Stock for S
      expect(screen.getByTestId('mock-inline-quantity-editor-10')).not.toBeDisabled(); // Sort Order for S
      const removeButtonForS = screen.getAllByTitle("Remove size").find(btn => !btn.closest('button')?.disabled);
      expect(removeButtonForS).not.toBeDisabled();
    });
  });
});
