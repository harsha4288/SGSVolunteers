import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/client'; // Adjust path as necessary
import {
  getUnifiedTshirtData,
  updateTshirtClaimStatus,
  recordTshirtIssuanceByQr,
  // Add any other functions exported by unified-tshirt-service.ts
} from '../unified-tshirt-service';
// import * as inventoryService from '../inventory-service'; // Uncomment if used and needs mocking

// Mock @/lib/supabase/client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Mock inventory-service if its functions are called by unified-tshirt-service
vi.mock('../inventory-service', () => ({
  issueTshirt: vi.fn(),
  getInventory: vi.fn(), // Though not directly used by recordTshirtIssuanceByQr, good to have if other unified fns use it
  // Add other functions from inventory-service if they were to be called by unified-service
}));

describe('UnifiedTshirtService', () => {
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
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockReturnThis(), // For calling stored procedures
      // Add other methods as needed
    };
    (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);
  });

  // Tests for getUnifiedTshirtData
  describe('getUnifiedTshirtData', () => {
    const baseExpectedQuery = '*, profile_roles(role), tshirt_claims(claimed_at, tshirt_inventory_id, tshirt_inventory(size)), tshirt_issuances(issued_at, inventory_id, tshirt_inventory(size))';

    it('should fetch all unified t-shirt data without filters', async () => {
      const mockData = [{ id: 'user1', full_name: 'User Alpha', email: 'alpha@example.com' }];
      mockSupabaseClient.select.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await getUnifiedTshirtData();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(baseExpectedQuery);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('full_name', { ascending: true });
      expect(result).toEqual(mockData);
    });

    it('should filter by roles if roles array is provided', async () => {
      const mockData = [{ id: 'user2', full_name: 'User Beta' }];
      const rolesToFilter = ['volunteer', 'event_manager'];
      // Simulate the chaining for .in().select()
      mockSupabaseClient.in.mockReturnThis(); // .in() returns the client for further chaining
      mockSupabaseClient.select.mockResolvedValueOnce({ data: mockData, error: null });


      const result = await getUnifiedTshirtData(rolesToFilter);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.in).toHaveBeenCalledWith('profile_roles.role', rolesToFilter);
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(baseExpectedQuery); // select is called after 'in'
      expect(result).toEqual(mockData);
    });

    it('should filter by search query if searchQuery is provided', async () => {
      const mockData = [{ id: 'user3', full_name: 'User Charlie' }];
      const searchQuery = 'Charlie';
      // Simulate the chaining for .or().select()
      mockSupabaseClient.or.mockReturnThis(); // .or() returns the client
      mockSupabaseClient.select.mockResolvedValueOnce({ data: mockData, error: null });


      const result = await getUnifiedTshirtData(undefined, searchQuery);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(baseExpectedQuery); // select is called after 'or'
      expect(result).toEqual(mockData);
    });

    it('should filter by both roles and search query if provided', async () => {
      const mockData = [{ id: 'user4', full_name: 'User Delta' }];
      const rolesToFilter = ['staff'];
      const searchQuery = 'Delta';
      mockSupabaseClient.in.mockReturnThis();
      mockSupabaseClient.or.mockReturnThis();
      mockSupabaseClient.select.mockResolvedValueOnce({ data: mockData, error: null });


      const result = await getUnifiedTshirtData(rolesToFilter, searchQuery);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.in).toHaveBeenCalledWith('profile_roles.role', rolesToFilter);
      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(baseExpectedQuery);
      expect(result).toEqual(mockData);
    });

    it('should throw an error if Supabase call fails', async () => {
      const errorMessage = 'Supabase fetch error';
      mockSupabaseClient.select.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      await expect(getUnifiedTshirtData()).rejects.toThrow(errorMessage);
    });
  });

  // Tests for updateTshirtClaimStatus
  describe('updateTshirtClaimStatus', () => {
    const userId = 'user-test-id';
    const tshirtInventoryId = 'inventory-item-id';
    const claimedByUserId = 'admin-test-id';

    it('should create a new claim if none exists and claimed is true', async () => {
      const newClaim = { id: 'new-claim-1', user_id: userId, tshirt_inventory_id: tshirtInventoryId };
      // First select call for checking existing claims for the user (returns empty)
      mockSupabaseClient.select.mockReturnValueOnce( { data: [], error: null });
      // Delete call (will do nothing as no claims found to delete for this user by current logic)
      mockSupabaseClient.delete.mockResolvedValueOnce({ error: null });
      // Insert call for the new claim
      mockSupabaseClient.insert.mockResolvedValueOnce({ data: [newClaim], error: null });

      const result = await updateTshirtClaimStatus(userId, tshirtInventoryId, true, claimedByUserId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_claims');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id'); // Initial check for user's claims
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', userId);
      
      expect(mockSupabaseClient.delete).toHaveBeenCalledTimes(1); // Attempt to delete existing claims for user
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', userId);


      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: userId,
          tshirt_inventory_id: tshirtInventoryId,
          claimed_by: claimedByUserId,
        }),
      ]);
      expect(result).toEqual([newClaim]);
    });

    it('should delete existing claim if claimed is false', async () => {
      mockSupabaseClient.delete.mockResolvedValueOnce({ error: null }); // For deleting the claim

      const result = await updateTshirtClaimStatus(userId, null, false, claimedByUserId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_claims');
      expect(mockSupabaseClient.delete).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', userId);
      expect(result).toBeUndefined(); // Or some success indicator if the function returns one
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });
    
    it('should delete existing claims for the user then insert a new one if claimed is true (effectively updating claim)', async () => {
      const existingClaimId = 'existing-claim-id-123';
      const newClaimData = { id: 'new-claim-xyz', user_id: userId, tshirt_inventory_id: tshirtInventoryId };
      // Mock select to find an existing claim (though the service currently always deletes by user_id first)
      mockSupabaseClient.select.mockReturnValueOnce({ data: [{ id: existingClaimId }], error: null });
      // Mock the delete call for the user's claims
      mockSupabaseClient.delete.mockResolvedValueOnce({ error: null });
      // Mock the insert call for the new claim
      mockSupabaseClient.insert.mockResolvedValueOnce({ data: [newClaimData], error: null });

      const result = await updateTshirtClaimStatus(userId, tshirtInventoryId, true, claimedByUserId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tshirt_claims');
      expect(mockSupabaseClient.delete).toHaveBeenCalledTimes(1); // Deletes all claims for user_id
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', userId); 
      
      expect(mockSupabaseClient.insert).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
        expect.objectContaining({ user_id: userId, tshirt_inventory_id: tshirtInventoryId })
      ]);
      expect(result).toEqual([newClaimData]);
    });


    it('should throw error if tshirtInventoryId is null when claiming true', async () => {
      await expect(updateTshirtClaimStatus(userId, null, true, claimedByUserId)).rejects.toThrow(
        'T-shirt inventory ID is required when claiming a T-shirt.'
      );
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should throw error if Supabase select fails (initial check)', async () => {
      mockSupabaseClient.select.mockReturnValueOnce({ data: null, error: { message: 'DB Select Error' } });
       await expect(updateTshirtClaimStatus(userId, tshirtInventoryId, true, claimedByUserId)).rejects.toThrow(
        'DB Select Error'
      );
    });
    
    it('should throw error if Supabase delete fails (when unclaiming)', async () => {
      mockSupabaseClient.delete.mockResolvedValueOnce({ error: { message: 'DB Delete Error' } });
      await expect(updateTshirtClaimStatus(userId, null, false, claimedByUserId)).rejects.toThrow(
        'DB Delete Error'
      );
    });
    
    it('should throw error if Supabase delete fails (before inserting new claim)', async () => {
      mockSupabaseClient.select.mockReturnValueOnce({ data: [], error: null }); // No existing claim initially
      mockSupabaseClient.delete.mockResolvedValueOnce({ error: { message: 'DB Delete Error on pre-insert clear' } }); // Delete fails
       await expect(updateTshirtClaimStatus(userId, tshirtInventoryId, true, claimedByUserId)).rejects.toThrow(
        'DB Delete Error on pre-insert clear'
      );
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });

    it('should throw error if Supabase insert fails', async () => {
      mockSupabaseClient.select.mockReturnValueOnce({ data: [], error: null }); // No existing claim
      mockSupabaseClient.delete.mockResolvedValueOnce({ error: null }); // Successful delete (of no items)
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: { message: 'DB Insert Error' } }); // Insert fails
      await expect(updateTshirtClaimStatus(userId, tshirtInventoryId, true, claimedByUserId)).rejects.toThrow(
        'DB Insert Error'
      );
    });
    
    it('should throw error if userId or claimedByUserId is missing', async () => {
      await expect(updateTshirtClaimStatus('', tshirtInventoryId, true, claimedByUserId)).rejects.toThrow('User ID and Claimed By User ID are required.');
      await expect(updateTshirtClaimStatus(userId, tshirtInventoryId, true, '')).rejects.toThrow('User ID and Claimed By User ID are required.');
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });

  // Tests for recordTshirtIssuanceByQr
  describe('recordTshirtIssuanceByQr', () => {
    const qrToken = 'test-qr-token';
    const issuedByUserId = 'admin-issuer-id';
    let mockIssueTshirt: any; // To spy on/mock inventoryService.issueTshirt

    beforeEach(() => {
      // Import and mock inventoryService.issueTshirt
      mockIssueTshirt = vi.mocked(require('../inventory-service').issueTshirt);
    });

    const mockUserBase = {
      id: 'user-qr-id',
      qr_code_token: qrToken,
      profile_roles: [{ role: 'volunteer' }], // Default eligible role
      tshirt_claims: [],
      tshirt_issuances: [],
    };

    it('should issue claimed T-shirt if user has a valid claim and stock exists', async () => {
      const inventoryIdFromClaim = 'claimed-inv-id';
      const userWithClaim = {
        ...mockUserBase,
        tshirt_claims: [{
          tshirt_inventory_id: inventoryIdFromClaim,
          tshirt_inventory: { size: 'L', quantity: 1 },
        }],
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: userWithClaim, error: null });
      mockIssueTshirt.mockResolvedValueOnce({ success: true, data: { id: 'new-issue-id' } });

      const result = await recordTshirtIssuanceByQr(qrToken, issuedByUserId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(expect.stringContaining('tshirt_claims'));
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('qr_code_token', qrToken);
      expect(mockIssueTshirt).toHaveBeenCalledWith(inventoryIdFromClaim, userWithClaim.id, issuedByUserId);
      expect(result).toEqual({ success: true, data: { id: 'new-issue-id' } });
    });

    it('should issue default T-shirt (e.g., "M" for volunteer) if no claim, role eligible, and stock exists', async () => {
      const defaultSizeInventory = { id: 'default-m-inv-id', size: 'M', quantity: 10 };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockUserBase, error: null }); // User fetch
      // Mock the inventory fetch for the default size 'M'
      mockSupabaseClient.select.mockImplementation((query) => {
         // Check if this select is for the default size inventory item
        if (query === 'id, quantity') { // A bit simplistic, might need better query differentiation
             return { 
                eq: vi.fn().mockReturnThis(), // for .eq('size', defaultSize)
                limit: vi.fn().mockReturnThis(), // for .limit(1)
                single: vi.fn().mockResolvedValueOnce({ data: defaultSizeInventory, error: null })
            };
        }
        // Fallback for other select calls if any (though not expected in this specific path)
        return mockSupabaseClient; 
      });


      mockIssueTshirt.mockResolvedValueOnce({ success: true, data: { id: 'new-issue-id-default' } });

      const result = await recordTshirtIssuanceByQr(qrToken, issuedByUserId);
      
      // Verify it tried to fetch default size 'M'
      // This assertion is tricky because the select mock is complex. We infer by `issueTshirt` call.
      expect(mockIssueTshirt).toHaveBeenCalledWith(defaultSizeInventory.id, mockUserBase.id, issuedByUserId);
      expect(result).toEqual({ success: true, data: { id: 'new-issue-id-default' } });
    });

    it('should throw error if user not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      await expect(recordTshirtIssuanceByQr(qrToken, issuedByUserId)).rejects.toThrow('User not found for this QR token.');
    });
    
    it('should throw error if user DB query fails', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: {message: "DB Error"} });
      await expect(recordTshirtIssuanceByQr(qrToken, issuedByUserId)).rejects.toThrow("DB Error");
    });


    it('should throw error if user is not eligible (no roles)', async () => {
      const userNoRoles = { ...mockUserBase, profile_roles: [] };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: userNoRoles, error: null });
      await expect(recordTshirtIssuanceByQr(qrToken, issuedByUserId)).rejects.toThrow('User is not eligible for a T-shirt based on their role.');
    });

    it('should throw error if T-shirt already issued', async () => {
      const userAlreadyIssued = { ...mockUserBase, tshirt_issuances: [{ inventory_id: 'some-inv-id' }] };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: userAlreadyIssued, error: null });
      await expect(recordTshirtIssuanceByQr(qrToken, issuedByUserId)).rejects.toThrow('T-shirt already issued to this user.');
    });

    it('should throw error if claimed T-shirt is out of stock', async () => {
      const userWithClaimNoStock = {
        ...mockUserBase,
        tshirt_claims: [{
          tshirt_inventory_id: 'claimed-inv-id-nostock',
          tshirt_inventory: { size: 'L', quantity: 0 },
        }],
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: userWithClaimNoStock, error: null });
      await expect(recordTshirtIssuanceByQr(qrToken, issuedByUserId)).rejects.toThrow('Claimed T-shirt size (L) is currently out of stock.');
    });

    it('should throw error if default size for role is out of stock', async () => {
      const defaultSizeInventoryNoStock = { id: 'default-m-inv-id-nostock', size: 'M', quantity: 0 };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockUserBase, error: null }); // User has no claim
      // Mock inventory fetch for 'M' size returning no stock
       mockSupabaseClient.select.mockImplementation((query) => {
        if (query === 'id, quantity') {
             return { 
                eq: vi.fn().mockReturnThis(), 
                limit: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValueOnce({ data: defaultSizeInventoryNoStock, error: null })
            };
        }
        return mockSupabaseClient;
      });
      await expect(recordTshirtIssuanceByQr(qrToken, issuedByUserId)).rejects.toThrow('Default T-shirt size (M) for role (volunteer) is out of stock.');
    });
    
    it('should throw error if default size for role is not found in inventory', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockUserBase, error: null }); // User has no claim
       mockSupabaseClient.select.mockImplementation((query) => {
        if (query === 'id, quantity') {
             return { 
                eq: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValueOnce({ data: null, error: null }) // Not found
            };
        }
        return mockSupabaseClient;
      });
      await expect(recordTshirtIssuanceByQr(qrToken, issuedByUserId)).rejects.toThrow('Default T-shirt size (M) for role (volunteer) not found in inventory.');
    });


    it('should throw error if inventoryService.issueTshirt fails', async () => {
      const inventoryIdFromClaim = 'claimed-inv-id';
      const userWithClaim = {
        ...mockUserBase,
        tshirt_claims: [{
          tshirt_inventory_id: inventoryIdFromClaim,
          tshirt_inventory: { size: 'L', quantity: 1 },
        }],
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: userWithClaim, error: null });
      mockIssueTshirt.mockRejectedValueOnce(new Error('Internal issueTshirt service error.'));

      await expect(recordTshirtIssuanceByQr(qrToken, issuedByUserId)).rejects.toThrow('Internal issueTshirt service error.');
    });
    
    it('should throw error if qrToken or issuedByUserId is missing', async () => {
      await expect(recordTshirtIssuanceByQr('', issuedByUserId)).rejects.toThrow('QR Token and Issued By User ID are required.');
      await expect(recordTshirtIssuanceByQr(qrToken, '')).rejects.toThrow('QR Token and Issued By User ID are required.');
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });

  // Add describe blocks for other functions if any
});
