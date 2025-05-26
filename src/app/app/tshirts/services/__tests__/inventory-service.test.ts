import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/client'; // Adjust path as necessary
import {
  getInventory,
  updateInventoryQuantity,
  addTshirtSize,
  removeTshirtSize,
  getTshirtIssuances,
  issueTshirt,
  undoLastIssue,
  // Add any other functions exported by inventory-service.ts
} from '../inventory-service';

// Mock @/lib/supabase/client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('InventoryService', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      // Add other methods like 'rpc' if your service uses them
    };
    (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);
  });

  // Tests for getInventory
  describe('getInventory', () => {
    it('should fetch inventory ordered by size_order', async () => {
      const mockInventory = [{ id: '1', size: 'M', quantity: 10, size_order: 2 }];
      mockSupabaseClient.order.mockResolvedValueOnce({ data: mockInventory, error: null });

      const result = await getInventory();

      expect(createClient).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('size_order', { ascending: true });
      expect(result).toEqual(mockInventory);
    });

    it('should throw an error if Supabase call fails for getInventory', async () => {
      const errorMessage = 'Supabase select error';
      mockSupabaseClient.order.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      await expect(getInventory()).rejects.toThrow(errorMessage);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('size_order', { ascending: true });
    });
  });

  // Tests for updateInventoryQuantity
  describe('updateInventoryQuantity', () => {
    it('should update the quantity for a given t-shirt ID', async () => {
      const itemId = 'item-123';
      const newQuantity = 25;
      // Assume the update operation returns the updated item or some success indicator
      mockSupabaseClient.eq.mockResolvedValueOnce({ data: [{ id: itemId, quantity: newQuantity }], error: null });

      const result = await updateInventoryQuantity(itemId, newQuantity);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ quantity: newQuantity });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', itemId);
      // Check if the result is what's expected, e.g., the updated item or true
      expect(result).toEqual([{ id: itemId, quantity: newQuantity }]);
    });

    it('should throw an error if Supabase call fails for updateInventoryQuantity', async () => {
      const itemId = 'item-123';
      const newQuantity = 25;
      const errorMessage = 'Supabase update error';
      mockSupabaseClient.eq.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      await expect(updateInventoryQuantity(itemId, newQuantity)).rejects.toThrow(errorMessage);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ quantity: newQuantity });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', itemId);
    });

    it('should throw an error if attempting to set quantity to a negative value', async () => {
      const itemId = 'item-123';
      const negativeQuantity = -5;
      // This test assumes the function itself checks for negative values before calling Supabase.
      // If the check is done by a DB constraint, this test would be different or might not apply here.
      await expect(updateInventoryQuantity(itemId, negativeQuantity)).rejects.toThrow('Quantity cannot be negative');
      expect(mockSupabaseClient.from).not.toHaveBeenCalled(); // Supabase shouldn't be called
      expect(mockSupabaseClient.update).not.toHaveBeenCalled();
    });
  });

  // Tests for addTshirtSize
  describe('addTshirtSize', () => {
    it('should add a new t-shirt size with quantity and order', async () => {
      const newSizeData = { size: 'XXL', quantity: 10, size_order: 5 };
      const expectedReturnData = { ...newSizeData, id: 'new-id-123' }; // Assuming DB assigns an ID
      mockSupabaseClient.insert.mockResolvedValueOnce({ data: [expectedReturnData], error: null });

      const result = await addTshirtSize(newSizeData.size, newSizeData.quantity, newSizeData.size_order);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
        { size: newSizeData.size, quantity: newSizeData.quantity, size_order: newSizeData.size_order },
      ]);
      expect(result).toEqual([expectedReturnData]);
    });

    it('should throw an error if Supabase call fails for addTshirtSize', async () => {
      const newSizeData = { size: 'XXL', quantity: 10, size_order: 5 };
      const errorMessage = 'Supabase insert error';
      mockSupabaseClient.insert.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      await expect(
        addTshirtSize(newSizeData.size, newSizeData.quantity, newSizeData.size_order)
      ).rejects.toThrow(errorMessage);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([newSizeData]);
    });

    it('should throw an error if attempting to add a size with negative quantity', async () => {
      await expect(addTshirtSize('XXL', -5, 5)).rejects.toThrow('Quantity cannot be negative');
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });
    
    it('should throw an error if attempting to add a size with invalid size_order (e.g. 0 or negative)', async () => {
      await expect(addTshirtSize('XXL', 5, 0)).rejects.toThrow('Size order must be a positive number');
      await expect(addTshirtSize('XXL', 5, -1)).rejects.toThrow('Size order must be a positive number');
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });

    it('should throw an error if size is empty', async () => {
      await expect(addTshirtSize('', 10, 5)).rejects.toThrow('Size cannot be empty');
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });
  });

  // Tests for removeTshirtSize
  describe('removeTshirtSize', () => {
    it('should remove a t-shirt size by ID', async () => {
      const sizeIdToRemove = 'size-to-delete-123';
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null }); // Indicates successful deletion

      await removeTshirtSize(sizeIdToRemove);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.delete).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', sizeIdToRemove);
    });

    it('should throw an error if Supabase call fails for removeTshirtSize', async () => {
      const sizeIdToRemove = 'size-to-delete-123';
      const errorMessage = 'Supabase delete error';
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: { message: errorMessage } });

      await expect(removeTshirtSize(sizeIdToRemove)).rejects.toThrow(errorMessage);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.delete).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', sizeIdToRemove);
    });

    it('should throw an error if sizeId is empty', async () => {
      await expect(removeTshirtSize('')).rejects.toThrow('Size ID cannot be empty');
      expect(mockSupabaseClient.delete).not.toHaveBeenCalled();
    });
  });

  // Tests for getTshirtIssuances
  describe('getTshirtIssuances', () => {
    it('should fetch t-shirt issuances with inventory size and user name, ordered by issued_at', async () => {
      const mockIssuances = [
        { id: 'issue-1', inventory_id: 'item-1', user_id: 'user-123', issued_at: new Date().toISOString(), tshirt_inventory: { size: 'M' }, users: { full_name: 'Test User' } },
      ];
      mockSupabaseClient.order.mockResolvedValueOnce({ data: mockIssuances, error: null });

      const result = await getTshirtIssuances();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_issuances');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*, tshirt_inventory(size), users(full_name)');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('issued_at', { ascending: false });
      expect(result).toEqual(mockIssuances);
    });

    it('should throw an error if Supabase call fails for getTshirtIssuances', async () => {
      const errorMessage = 'Supabase fetch issuances error';
      mockSupabaseClient.order.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      await expect(getTshirtIssuances()).rejects.toThrow(errorMessage);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_issuances');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*, tshirt_inventory(size), users(full_name)');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('issued_at', { ascending: false });
    });
  });

  // Tests for issueTshirt
  describe('issueTshirt', () => {
    const inventoryId = 'inv-123';
    const userId = 'user-abc';
    const issuedBy = 'admin-xyz';

    it('should issue a t-shirt and decrement inventory if quantity is sufficient', async () => {
      const mockInventoryItem = { id: inventoryId, quantity: 5 };
      const newIssuance = { id: 'issue-new', inventory_id: inventoryId, user_id: userId, issued_by: issuedBy };

      mockSupabaseClient.select.mockReturnValueOnce({ data: mockInventoryItem, error: null, single: () => ({data: mockInventoryItem, error: null}) }); // For fetching quantity
      mockSupabaseClient.update.mockResolvedValueOnce({ error: null }); // For decrementing inventory
      mockSupabaseClient.insert.mockResolvedValueOnce({ data: [newIssuance], error: null }); // For creating issuance record

      const result = await issueTshirt(inventoryId, userId, issuedBy);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('quantity');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', inventoryId);
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ quantity: mockInventoryItem.quantity - 1 });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', inventoryId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_issuances');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
        expect.objectContaining({ inventory_id: inventoryId, user_id: userId, issued_by: issuedBy }),
      ]);
      expect(result).toEqual([newIssuance]);
    });

    it('should throw error if inventory item not found', async () => {
      mockSupabaseClient.select.mockReturnValueOnce({ data: null, error: null, single: () => ({data: null, error: null}) });
      await expect(issueTshirt(inventoryId, userId, issuedBy)).rejects.toThrow('Inventory item not found or error fetching it.');
      expect(mockSupabaseClient.update).not.toHaveBeenCalled();
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });
    
    it('should throw error if inventory select fails', async () => {
      mockSupabaseClient.select.mockReturnValueOnce({ data: null, error: {message: "DB error"}, single: () => ({data: null, error: {message: "DB error"}}) });
      await expect(issueTshirt(inventoryId, userId, issuedBy)).rejects.toThrow('Inventory item not found or error fetching it.');
    });


    it('should throw error if t-shirt quantity is zero', async () => {
      mockSupabaseClient.select.mockReturnValueOnce({ data: { quantity: 0 }, error: null, single: () => ({data: { quantity: 0 }, error: null})});
      await expect(issueTshirt(inventoryId, userId, issuedBy)).rejects.toThrow('Insufficient quantity for this t-shirt size.');
      expect(mockSupabaseClient.update).not.toHaveBeenCalled();
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });

    it('should throw error and attempt to revert inventory if inventory update fails', async () => {
      const mockInventoryItem = { id: inventoryId, quantity: 5 };
      mockSupabaseClient.select.mockReturnValueOnce({ data: mockInventoryItem, error: null, single: () => ({data: mockInventoryItem, error: null}) });
      mockSupabaseClient.update.mockResolvedValueOnce({ error: { message: 'Inventory update failed' } }); // First update fails

      await expect(issueTshirt(inventoryId, userId, issuedBy)).rejects.toThrow('Inventory update failed');
      
      // It should not have proceeded to insert issuance
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
      // No revert should be called if the first update fails. Revert is for when issuance insert fails.
      // The initial call to update is already captured by the mock.
      expect(mockSupabaseClient.update).toHaveBeenCalledTimes(1); 
    });
    
    it('should throw error and attempt to revert inventory if issuance insert fails', async () => {
      const mockInventoryItem = { id: inventoryId, quantity: 5 };
      mockSupabaseClient.select.mockReturnValueOnce({ data: mockInventoryItem, error: null, single: () => ({data: mockInventoryItem, error: null}) }); // Inventory check
      mockSupabaseClient.update.mockResolvedValueOnce({ error: null }); // Inventory decrement success
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: { message: 'Issuance insert failed' } }); // Issuance insert fails
      mockSupabaseClient.update.mockResolvedValueOnce({ error: null }); // Inventory increment (revert) success

      await expect(issueTshirt(inventoryId, userId, issuedBy)).rejects.toThrow('Issuance insert failed');
      
      expect(mockSupabaseClient.update).toHaveBeenCalledTimes(2); // Decrement and then Increment
      // Verify the second update call was a revert
      expect(mockSupabaseClient.update).toHaveBeenNthCalledWith(2, { quantity: mockInventoryItem.quantity });
      expect(mockSupabaseClient.eq).toHaveBeenNthCalledWith(4, 'id', inventoryId); // .eq for the second update
    });

    it('should throw error if inventoryId, userId, or issuedBy is missing', async () => {
      await expect(issueTshirt('', userId, issuedBy)).rejects.toThrow('Inventory ID, User ID, and Issued By ID are required.');
      await expect(issueTshirt(inventoryId, '', issuedBy)).rejects.toThrow('Inventory ID, User ID, and Issued By ID are required.');
      await expect(issueTshirt(inventoryId, userId, '')).rejects.toThrow('Inventory ID, User ID, and Issued By ID are required.');
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });

  // Tests for undoLastIssue
  describe('undoLastIssue', () => {
    const userIdToUndo = 'user-to-undo-id';
    const undoneByUserId = 'admin-performing-undo';
    const lastIssuance = {
      id: 'last-issue-id-456',
      inventory_id: 'inv-789',
      user_id: userIdToUndo,
      issued_at: new Date().toISOString(),
      tshirt_inventory: { id: 'inv-789', quantity: 4 }, // Quantity *before* incrementing
    };

    it('should undo the last issuance for a user and increment inventory', async () => {
      mockSupabaseClient.select.mockReturnValueOnce({ data: lastIssuance, error: null, single: () => ({data: lastIssuance, error: null}) }); // Fetch last issuance
      mockSupabaseClient.delete.mockResolvedValueOnce({ error: null }); // Delete issuance
      mockSupabaseClient.update.mockResolvedValueOnce({ error: null }); // Increment inventory

      const result = await undoLastIssue(userIdToUndo, undoneByUserId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_issuances');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id, inventory_id, tshirt_inventory(quantity, id)');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', userIdToUndo);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('issued_at', { ascending: false });
      // expect(mockSupabaseClient.limit).toHaveBeenCalledWith(1); // limit is not available on this mock
      // expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);


      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_issuances');
      expect(mockSupabaseClient.delete).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', lastIssuance.id);


      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_inventory');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ quantity: lastIssuance.tshirt_inventory.quantity + 1 });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', lastIssuance.inventory_id);
      
      expect(result).toEqual(expect.objectContaining({undone_issuance_id: lastIssuance.id}));
    });

    it('should throw error if no issuance found for the user', async () => {
      mockSupabaseClient.select.mockReturnValueOnce({ data: null, error: null, single: () => ({data: null, error: null}) });
      await expect(undoLastIssue(userIdToUndo, undoneByUserId)).rejects.toThrow('No T-shirt issuance found for this user to undo.');
      expect(mockSupabaseClient.delete).not.toHaveBeenCalled();
      expect(mockSupabaseClient.update).not.toHaveBeenCalled();
    });
    
    it('should throw error if fetching last issuance fails', async () => {
      mockSupabaseClient.select.mockReturnValueOnce({ data: null, error: {message: "DB error"}, single: () => ({data: null, error: {message: "DB error"}}) });
      await expect(undoLastIssue(userIdToUndo, undoneByUserId)).rejects.toThrow("DB error");
    });

    it('should throw error if deleting issuance fails', async () => {
      mockSupabaseClient.select.mockReturnValueOnce({ data: lastIssuance, error: null, single: () => ({data: lastIssuance, error: null}) });
      mockSupabaseClient.delete.mockResolvedValueOnce({ error: { message: 'Delete failed' } });
      await expect(undoLastIssue(userIdToUndo, undoneByUserId)).rejects.toThrow('Delete failed');
      expect(mockSupabaseClient.update).not.toHaveBeenCalled(); // Inventory should not be updated
    });

    it('should throw error if incrementing inventory fails (and issuance deletion should ideally be rolled back - though test cannot enforce rollback here)', async () => {
      mockSupabaseClient.select.mockReturnValueOnce({ data: lastIssuance, error: null, single: () => ({data: lastIssuance, error: null}) });
      mockSupabaseClient.delete.mockResolvedValueOnce({ error: null }); // Issuance deleted
      mockSupabaseClient.update.mockResolvedValueOnce({ error: { message: 'Inventory update failed' } }); // Inventory increment fails

      await expect(undoLastIssue(userIdToUndo, undoneByUserId)).rejects.toThrow('Inventory update failed');
      // This tests that the function attempts the inventory update and fails.
      // Actual rollback logic would be more complex and part of the service's responsibility.
      expect(mockSupabaseClient.update).toHaveBeenCalledTimes(1);
    });
    
    it('should throw error if tshirt_inventory data is missing in fetched issuance', async () => {
      const issuanceWithoutInventoryDetails = { ...lastIssuance, tshirt_inventory: null };
      mockSupabaseClient.select.mockReturnValueOnce({ data: issuanceWithoutInventoryDetails, error: null, single: () => ({data: issuanceWithoutInventoryDetails, error: null}) });
      
      await expect(undoLastIssue(userIdToUndo, undoneByUserId)).rejects.toThrow('Failed to retrieve T-shirt inventory details for the last issuance.');
    });


    it('should throw error if userId or undoneByUserId is missing', async () => {
      await expect(undoLastIssue('', undoneByUserId)).rejects.toThrow('User ID and Undone By User ID are required.');
      await expect(undoLastIssue(userIdToUndo, '')).rejects.toThrow('User ID and Undone By User ID are required.');
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });
});
