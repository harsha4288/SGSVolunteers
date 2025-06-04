import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/client';
import { createInventoryService } from '../inventory-service'; // Main export is the factory
import type { TShirtInventory } from '../../types';


// Mock @/lib/supabase/client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('InventoryService (via createInventoryService)', () => {
  let mockSupabaseClient: any;
  let inventoryServiceInstance: ReturnType<typeof createInventoryService>;
  const mockEventId = 123; // Define a mock eventId for testing context

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      // single: vi.fn().mockReturnThis(), // Not used by functions in createInventoryService
      // limit: vi.fn().mockReturnThis(),  // Not used by functions in createInventoryService
    };
    (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

    // Create a service instance scoped to mockEventId
    inventoryServiceInstance = createInventoryService({ supabase: mockSupabaseClient, eventId: mockEventId });
  });

  describe('fetchInventory', () => {
    it('should fetch inventory for the specific eventId, ordered by size_order', async () => {
      const mockInventoryData: TShirtInventory[] = [{ size_cd: 'M', size_name: 'M', sort_order: 2, quantity: 10, quantity_on_hand: 8 }];
      mockSupabaseClient.order.mockResolvedValueOnce({ data: mockInventoryData, error: null });

      const result = await inventoryServiceInstance.fetchInventory();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('event_id', mockEventId); // Verify eventId filter
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('sort_order', { ascending: true });
      expect(result).toEqual(mockInventoryData.map(item => ({ ...item, size_name: item.size_cd }))); // Match transformation in service
    });

    it('should throw an error if Supabase call fails for fetchInventory', async () => {
      const errorMessage = 'Supabase select error';
      mockSupabaseClient.order.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      await expect(inventoryServiceInstance.fetchInventory()).rejects.toThrow(`Failed to fetch inventory: ${errorMessage}`);
    });
  });

  describe('updateInventoryQuantity', () => {
    const sizeCode = 'M';
    const newQuantity = 25;

    it('should update initial quantity for a given size code and eventId', async () => {
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null }); // .eq('size_cd', sizeCode) is the second .eq

      await inventoryServiceInstance.updateInventoryQuantity(sizeCode, newQuantity, 'initial');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        quantity: newQuantity,
        updated_at: expect.any(String)
      });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('event_id', mockEventId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('size_cd', sizeCode);
    });

    it('should throw error if updateType is not "initial"', async () => {
       await expect(inventoryServiceInstance.updateInventoryQuantity(sizeCode, newQuantity, 'current' as any))
        .rejects.toThrow('Current stock is calculated and cannot be edited directly');
       expect(mockSupabaseClient.update).not.toHaveBeenCalled();
    });

    it('should throw an error if Supabase call fails', async () => {
      const errorMessage = 'Supabase update error';
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: { message: errorMessage } }); // Mock failure on the second .eq call

      await expect(inventoryServiceInstance.updateInventoryQuantity(sizeCode, newQuantity, 'initial'))
        .rejects.toThrow(`Failed to update initial quantity: ${errorMessage}`);
    });
  });

  describe('updateSizeCode', () => {
    const oldSizeCode = 'M';
    const newSizeCode = 'MEDIUM';

    it('should update size code if no T-shirts issued for that size and eventId', async () => {
      mockSupabaseClient.select.mockReturnValueOnce({ // For the count query
          eq: vi.fn().mockReturnThis(), // for event_id
          eq: vi.fn().mockReturnThis(), // for size
          eq: vi.fn().mockResolvedValueOnce({ data: 0, error: null, count:0 }) // for status, count is 0
      });
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null }); // For the update operation

      await inventoryServiceInstance.updateSizeCode(oldSizeCode, newSizeCode);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('volunteer_tshirts'); // First call for check
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id', { count: 'exact' });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('event_id', mockEventId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('size', oldSizeCode);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'issued');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory'); // Second call for update
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        size_cd: newSizeCode.toUpperCase(),
        updated_at: expect.any(String)
      });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('event_id', mockEventId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('size_cd', oldSizeCode);
    });

    it('should throw error if T-shirts have been issued for the size and eventId', async () => {
       mockSupabaseClient.select.mockReturnValueOnce({
          eq: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValueOnce({ data: 5, error: null, count: 5 }) // 5 items issued
      });
      await expect(inventoryServiceInstance.updateSizeCode(oldSizeCode, newSizeCode))
        .rejects.toThrow(`Cannot change size code: 5 T-shirts have been issued for size ${oldSizeCode}`);
    });
  });

  describe('updateSortOrder', () => {
    const sizeCode = 'M';
    const newSortOrder = 5;

    it('should update sort order for a given size code and eventId', async () => {
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null });

      await inventoryServiceInstance.updateSortOrder(sizeCode, newSortOrder);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        sort_order: newSortOrder,
        updated_at: expect.any(String)
      });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('event_id', mockEventId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('size_cd', sizeCode);
    });
     // Input validation for sort_order (e.g. positive number) is assumed to be in the function itself,
     // but the provided service code for updateSortOrder does not have it. If it did, we'd test it.
  });

  describe('addInventorySize', () => {
    const sizeCode = 'XL';
    const initialQuantity = 50;
    const sortOrder = 40;

    it('should add a new inventory size with eventId', async () => {
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null });
      await inventoryServiceInstance.addInventorySize(sizeCode, initialQuantity, sortOrder);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        event_id: mockEventId,
        size_cd: sizeCode,
        quantity: initialQuantity,
        quantity_on_hand: initialQuantity, // Assuming quantity_on_hand starts same as initial
        sort_order: sortOrder,
      });
    });

    it('should throw error if Supabase insert fails', async () => {
      const errorMessage = "Insert failed";
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: { message: errorMessage } });
      await expect(inventoryServiceInstance.addInventorySize(sizeCode, initialQuantity, sortOrder))
        .rejects.toThrow(`Failed to add size: ${errorMessage}`);
    });
  });

  describe('removeInventorySize', () => {
    const sizeCode = 'S'; // Assuming 'S' has no issuances for some tests

    it('should remove inventory size if no T-shirts issued for that size and eventId', async () => {
      mockSupabaseClient.select.mockReturnValueOnce({
          eq: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValueOnce({ data: 0, error: null, count: 0 })
      });
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null }); // For the delete operation

      await inventoryServiceInstance.removeInventorySize(sizeCode);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('volunteer_tshirts');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id', { count: 'exact' });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('event_id', mockEventId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('size', sizeCode);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'issued');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.delete).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('event_id', mockEventId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('size_cd', sizeCode);
    });

    it('should throw error if T-shirts have been issued for the size to be removed for that eventId', async () => {
       mockSupabaseClient.select.mockReturnValueOnce({
          eq: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValueOnce({ data: 3, error: null, count: 3 }) // 3 items issued
      });
      await expect(inventoryServiceInstance.removeInventorySize(sizeCode))
        .rejects.toThrow(`Cannot remove size ${sizeCode}: 3 T-shirts have been issued`);
    });
  });

  // Note: issueTshirt, undoLastIssue, getTshirtIssuances, etc., are not part of the
  // interface returned by `createInventoryService` based on the provided service code.
  // If they were, their tests would also need to ensure eventId scoping.
});
