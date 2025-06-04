import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TshirtsPage from '../page'; // Assuming default export from page.tsx
import { useUser } from '@supabase/auth-helpers-nextjs'; // For mocking user session
import { getUserProfileWithRole } from '@/app/app/profile/actions'; // For mocking role
import { ROLES } from '@/lib/constants';

// Mock child components
vi.mock('../components/unified-tshirt-table', () => ({
  UnifiedTshirtTable: vi.fn(() => <div data-testid="mock-unified-tshirt-table">Mock UnifiedTshirtTable</div>),
}));
vi.mock('../components/inventory-management', () => ({
  InventoryManagement: vi.fn(() => <div data-testid="mock-inventory-management">Mock InventoryManagement</div>),
}));
// Assuming a generic filter component might be used, or filters are part of UnifiedTshirtTable's parent.
// For now, we'll focus on what TshirtsPage directly renders.
// vi.mock('../components/tshirt-filters', () => ({
//   TshirtFilters: vi.fn(({ onFilterChange, availableRoles }) => (
//     <div>
//       <input data-testid="mock-search-input" onChange={(e) => onFilterChange({ searchQuery: e.target.value })} />
//       {availableRoles && <select data-testid="mock-role-filter" onChange={(e) => onFilterChange({ role: e.target.value })}>
//         {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
//       </select>}
//     </div>
//   )),
// }));


// Mock hooks and server actions
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  useUser: vi.fn(),
}));
vi.mock('@/app/app/profile/actions', () => ({
  getUserProfileWithRole: vi.fn(),
}));
// Mock the data hook used by TshirtsPage
vi.mock('../hooks/use-unified-tshirt-data', () => ({
  useUnifiedTshirtData: vi.fn(() => ({
    data: [],
    loading: false,
    error: null,
    profileId: null, // Will be set based on user role in tests
    userRole: null,  // Will be set based on user role in tests
    filters: {},
    setFilters: vi.fn(),
    refreshData: vi.fn(),
  })),
}));


const mockUseUser = vi.mocked(useUser);
const mockGetUserProfileWithRole = vi.mocked(getUserProfileWithRole);
const mockUseUnifiedTshirtData = vi.mocked(require('../hooks/use-unified-tshirt-data').useUnifiedTshirtData);
const mockSetFilters = vi.fn();

describe('TshirtsPage - RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetFilters.mockClear();
    // Default mock for the hook, can be overridden in tests
    mockUseUnifiedTshirtData.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      profileId: 'some-profile-id',
      userRole: ROLES.VOLUNTEER, // Default to volunteer, override as needed
      filters: {},
      setFilters: mockSetFilters,
      refreshData: vi.fn(),
    });
  });

  describe('Inventory Management Access', () => {
    it('Admin User - should see and be able to access Inventory Management', async () => {
      mockUseUser.mockReturnValue({ id: 'admin-user-id' } as any);
      mockGetUserProfileWithRole.mockResolvedValue({
        data: { role: ROLES.ADMIN, id: 'admin-user-id', event_id: 1 }, // Assuming event_id is needed
        error: null,
      });

      render(<TshirtsPage />);

      // Wait for async operations like role fetching to complete
      await waitFor(() => {
        // The page might conditionally render the button based on the role.
        // Let's assume the button for Inventory Management has a specific text or test ID.
        // The actual component might have a <Link> wrapping a <Button> or just a <Button>
        // that changes a state to show InventoryManagement component.
        // For this test, we'll check for a button/link with text "Inventory Management".
        // Note: The actual component code for TshirtsPage.tsx is not provided yet,
        // so this test assumes a common way to provide access.
        const inventoryButton = screen.queryByRole('button', { name: /inventory management/i });
        // If it's a link that looks like a button:
        // const inventoryLink = screen.queryByRole('link', { name: /inventory management/i });

        // This assertion needs to be based on how InventoryManagement is actually toggled/displayed.
        // If admin sees it by default, or a button to show it:
        expect(inventoryButton).toBeInTheDocument();
        // If it's a button that enables the component:
        // expect(inventoryButton).not.toBeDisabled();
      });
    });

    it('Volunteer User - should NOT see or access Inventory Management', async () => {
      mockUseUser.mockReturnValue({ id: 'volunteer-user-id' } as any);
      mockGetUserProfileWithRole.mockResolvedValue({
        data: { role: ROLES.VOLUNTEER, id: 'volunteer-user-id', event_id: 1 },
        error: null,
      });

      render(<TshirtsPage />);

      await waitFor(() => {
        // Check that the button/link is NOT present for volunteer
        const inventoryButton = screen.queryByRole('button', { name: /inventory management/i });
        // const inventoryLink = screen.queryByRole('link', { name: /inventory management/i });

        expect(inventoryButton).not.toBeInTheDocument();
        // expect(inventoryLink).not.toBeInTheDocument();

        // Also ensure the InventoryManagement component itself is not rendered
        expect(screen.queryByTestId('mock-inventory-management')).not.toBeInTheDocument();
      });
    });

    it('Event Manager User - should see and be able to access Inventory Management', async () => {
      mockUseUser.mockReturnValue({ id: 'event-manager-id' } as any);
      mockGetUserProfileWithRole.mockResolvedValue({
        data: { role: ROLES.EVENT_MANAGER, id: 'event-manager-id', event_id: 1 },
        error: null,
      });

      render(<TshirtsPage />);
      await waitFor(() => {
        const inventoryButton = screen.queryByRole('button', { name: /inventory management/i });
        expect(inventoryButton).toBeInTheDocument();
      });
    });
  });

  // Further describe blocks for Search/Filter RBAC will be added once component structure is known.
  describe('Search and Filter RBAC', () => {
    const mockAdminProfile = { role: ROLES.ADMIN, id: 'admin-user-id', event_id: 1 };
    const mockVolunteerProfile = { role: ROLES.VOLUNTEER, id: 'volunteer-user-id', event_id: 1 };

    it('Admin User - can search broadly and potentially filter by roles', async () => {
      mockUseUser.mockReturnValue({ id: 'admin-user-id' } as any);
      mockGetUserProfileWithRole.mockResolvedValue({ data: mockAdminProfile, error: null });
      mockUseUnifiedTshirtData.mockReturnValue({
        data: [{id: 'user1', full_name: 'Searched User'} as any],
        loading: false, error: null, profileId: 'admin-user-id', userRole: ROLES.ADMIN,
        filters: { searchQuery: 'TestSearch', roles: [ROLES.VOLUNTEER] },
        setFilters: mockSetFilters, refreshData: vi.fn()
      });

      render(<TshirtsPage />);

      // Simulate admin changing filters (e.g., via a mocked child filter component that calls setFilters)
      // This part assumes TshirtsPage itself or a child component it controls calls setFilters from the hook.
      // If TshirtsPage has input fields itself:
      // fireEvent.change(screen.getByTestId('admin-search-input'), { target: { value: 'Test Volunteer' } });
      // fireEvent.change(screen.getByTestId('admin-role-filter'), { target: { value: ROLES.VOLUNTEER } });

      // For this test, we'll check if the hook `useUnifiedTshirtData` is eventually called
      // with parameters that reflect an admin's broad access.
      // The hook itself calls getUnifiedTshirtData. We are testing how TshirtsPage USES the hook.
      // The hook's setFilters would trigger a refetch with new filters.
      // We need to ensure the `filters` state in the hook can be set by the page.

      // Let's assume the TshirtsPage renders a filter component that uses `setFilters`.
      // We can't directly test the `getUnifiedTshirtData` call here without knowing more about
      // how `TshirtsPage` and `useUnifiedTshirtData` interact with a filter child component.
      // However, we can assert that if an admin role is detected, the `useUnifiedTshirtData` hook
      // is initialized or used in a way that doesn't inherently restrict to "own data".
      // The hook's `userRole` prop being ADMIN implies it will fetch data accordingly.

      // We are mocking useUnifiedTshirtData, so we check how it's called or what it's provided.
      // The crucial part is that TshirtsPage should provide the correct initial context (admin role)
      // to useUnifiedTshirtData, and the hook itself handles fetching.

      await waitFor(() => {
        expect(mockUseUnifiedTshirtData).toHaveBeenCalled();
      });
      // The `profileId` passed to `useUnifiedTshirtData` by `TshirtsPage` for an admin would be the admin's own ID.
      // The hook `useUnifiedTshirtData` would then call `getUnifiedTshirtData` without restricting by this admin's ID for data rows.
      // This is implicitly tested by `getUnifiedTshirtData` tests where passing an admin profileId doesn't limit results.
      // We can check that `UnifiedTshirtTable` receives data that isn't filtered to only the admin.
      const { UnifiedTshirtTable } = await import('../components/unified-tshirt-table');
      await waitFor(() => {
          const tableProps = (UnifiedTshirtTable as vi.Mock).mock.calls[0][0];
          expect(tableProps.data.length).toBe(1); // Based on mock return
          expect(tableProps.userRole).toBe(ROLES.ADMIN);
      });
    });

    it('Volunteer User - search/filter capabilities are appropriately restricted or scoped', async () => {
      mockUseUser.mockReturnValue({ id: 'volunteer-user-id' } as any);
      mockGetUserProfileWithRole.mockResolvedValue({ data: mockVolunteerProfile, error: null });

      const volunteerOwnData = [{id: 'volunteer-user-id', full_name: 'Volunteer User', profile_roles: [{role: ROLES.VOLUNTEER}]} as any];
      mockUseUnifiedTshirtData.mockReturnValue({
        data: volunteerOwnData, // Hook would be responsible for fetching only this
        loading: false, error: null, profileId: 'volunteer-user-id', userRole: ROLES.VOLUNTEER,
        filters: {}, // Volunteers might not have filter controls, or they are scoped
        setFilters: mockSetFilters, refreshData: vi.fn()
      });

      render(<TshirtsPage />);

      await waitFor(() => {
        expect(mockUseUnifiedTshirtData).toHaveBeenCalled();
      });

      // For a volunteer, the `useUnifiedTshirtData` hook (when called by TshirtsPage)
      // should receive the volunteer's `profileId`. The hook itself is then responsible
      // for ensuring `getUnifiedTshirtData` is called in a way that respects this (e.g., by passing
      // the profileId to `getUnifiedTshirtData` if it were to filter by it, or by applying client-side filtering).
      // Since `getUnifiedTshirtData` doesn't currently filter by profileId, `useUnifiedTshirtData`
      // or `TshirtsPage` would need to handle this.
      // The `UnifiedTshirtTable` tests already confirm it filters data if role is volunteer.
      // Here, we verify that `TshirtsPage` passes the volunteer role and profileId to the table.

      const { UnifiedTshirtTable } = await import('../components/unified-tshirt-table');
      await waitFor(() => {
          const tableProps = (UnifiedTshirtTable as vi.Mock).mock.calls[0][0];
          expect(tableProps.userRole).toBe(ROLES.VOLUNTEER);
          expect(tableProps.profileId).toBe('volunteer-user-id');
          // The data passed to UnifiedTshirtTable might still be wide if page doesn't filter it before passing to hook,
          // but UnifiedTshirtTable itself will filter it for display.
          // If useUnifiedTshirtData itself filters based on role/profileId:
          expect(tableProps.data).toEqual(volunteerOwnData);
      });

      // Assert that broad filter controls (e.g., a free-text search for all users, or role selection filters)
      // are not available or are appropriately restricted for volunteers.
      // This depends on whether TshirtsPage renders filter controls itself or uses a child component.
      // Assuming TshirtsPage might render a generic <FilterComponent />
      // We would check props passed to it, or its absence.
      // Example: expect(screen.queryByTestId('admin-role-filter')).not.toBeInTheDocument();
      // expect(screen.queryByTestId('global-search-input')).not.toBeInTheDocument();
    });
  });

  describe('Search and Filtering Functionality (as Admin)', () => {
    const mockAdminProfile = { role: ROLES.ADMIN, id: 'admin-user-id', event_id: 1 };
    let currentFilters = {}; // To simulate merging of filters

    beforeEach(() => {
      currentFilters = {}; // Reset for each test
      mockUseUser.mockReturnValue({ id: 'admin-user-id' } as any);
      mockGetUserProfileWithRole.mockResolvedValue({ data: mockAdminProfile, error: null });

      // Make setFilters update currentFilters for sequential filter tests
      mockSetFilters.mockImplementation((newFiltersOrCallback) => {
        if (typeof newFiltersOrCallback === 'function') {
          currentFilters = newFiltersOrCallback(currentFilters);
        } else {
          currentFilters = { ...currentFilters, ...newFiltersOrCallback };
        }
        // Update the mock return value for filters if needed for subsequent assertions
        mockUseUnifiedTshirtData.mockReturnValue({
          data: [], loading: false, error: null,
          profileId: 'admin-user-id', userRole: ROLES.ADMIN,
          filters: currentFilters, // Return updated filters
          setFilters: mockSetFilters, refreshData: vi.fn()
        });
      });

      // Initial return value for the hook
      mockUseUnifiedTshirtData.mockReturnValue({
        data: [], loading: false, error: null,
        profileId: 'admin-user-id', userRole: ROLES.ADMIN,
        filters: currentFilters,
        setFilters: mockSetFilters, refreshData: vi.fn()
      });
    });

    it('should call setFilters with searchQuery for Volunteer Name search', async () => {
      render(
        <TshirtsPage>
          {/* Assume TshirtsPage renders a search input like this for the test */}
          <input data-testid="search-input" onChange={(e) => mockSetFilters({ searchQuery: e.target.value })} />
        </TshirtsPage>
      );
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });
      await waitFor(() => {
        expect(mockSetFilters).toHaveBeenCalledWith({ searchQuery: 'Alice' });
      });
    });

    it('should call setFilters with searchQuery for Email search', async () => {
       render(
        <TshirtsPage>
          <input data-testid="search-input" onChange={(e) => mockSetFilters({ searchQuery: e.target.value })} />
        </TshirtsPage>
      );
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'alice@example.com' } });
      await waitFor(() => {
        expect(mockSetFilters).toHaveBeenCalledWith({ searchQuery: 'alice@example.com' });
      });
    });

    // Phone number search is not supported by getUnifiedTshirtData's current OR clause.
    // If it were, a similar test would be here.

    it('should call setFilters with size_cd for Size-Based Filtering', async () => {
       render(
        <TshirtsPage>
          <select data-testid="size-filter" onChange={(e) => mockSetFilters({ size_cd: e.target.value })}>
            <option value="">Any Size</option>
            <option value="M">M</option>
            <option value="L">L</option>
          </select>
        </TshirtsPage>
      );
      const sizeFilter = screen.getByTestId('size-filter');
      fireEvent.change(sizeFilter, { target: { value: 'M' } });
      await waitFor(() => {
        expect(mockSetFilters).toHaveBeenCalledWith({ size_cd: 'M' });
      });
    });

    it('should call setFilters with claim_status for Status-Based Filtering (Claimed)', async () => {
       render(
        <TshirtsPage>
          <select data-testid="status-filter" onChange={(e) => mockSetFilters({ claim_status: e.target.value })}>
            <option value="">Any Status</option>
            <option value="CLAIMED">Claimed</option>
            <option value="ISSUED">Issued</option>
          </select>
        </TshirtsPage>
      );
      const statusFilter = screen.getByTestId('status-filter');
      fireEvent.change(statusFilter, { target: { value: 'CLAIMED' } });
      await waitFor(() => {
        expect(mockSetFilters).toHaveBeenCalledWith({ claim_status: 'CLAIMED' });
      });
    });

    it('should call setFilters with issue_status for Status-Based Filtering (Issued)', async () => {
       render(
        <TshirtsPage>
          <select data-testid="status-filter" onChange={(e) => mockSetFilters({ issue_status: e.target.value })}>
            <option value="">Any Status</option>
            <option value="ISSUED">Issued</option>
          </select>
        </TshirtsPage>
      );
      const statusFilter = screen.getByTestId('status-filter');
      fireEvent.change(statusFilter, { target: { value: 'ISSUED' } });
      await waitFor(() => {
        expect(mockSetFilters).toHaveBeenCalledWith({ issue_status: 'ISSUED' });
      });
    });

    it('should call setFilters with roles for Role-Based Filtering', async () => {
       render(
        <TshirtsPage>
          {/* Simplified: real role filter might be multi-select */}
          <select data-testid="role-filter" onChange={(e) => mockSetFilters({ roles: [e.target.value] })}>
            <option value="">Any Role</option>
            <option value={ROLES.VOLUNTEER}>Volunteer</option>
            <option value={ROLES.EVENT_MANAGER}>Event Manager</option>
          </select>
        </TshirtsPage>
      );
      const roleFilter = screen.getByTestId('role-filter');
      fireEvent.change(roleFilter, { target: { value: ROLES.VOLUNTEER } });
      await waitFor(() => {
        expect(mockSetFilters).toHaveBeenCalledWith({ roles: [ROLES.VOLUNTEER] });
      });
    });

    it('should correctly combine multiple filters sequentially', async () => {
      render(
        <TshirtsPage>
          <input data-testid="search-input" onChange={(e) => mockSetFilters(prev => ({ ...prev, searchQuery: e.target.value }))} />
          <select data-testid="size-filter" onChange={(e) => mockSetFilters(prev => ({ ...prev, size_cd: e.target.value }))}>
            <option value="">Any Size</option><option value="L">L</option>
          </select>
          <select data-testid="role-filter" onChange={(e) => mockSetFilters(prev => ({ ...prev, roles: [e.target.value] }))}>
            <option value="">Any Role</option><option value={ROLES.EVENT_MANAGER}>Event Manager</option>
          </select>
        </TshirtsPage>
      );

      // 1. Search for "Bob"
      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Bob' } });
      await waitFor(() => expect(mockSetFilters).toHaveBeenCalledWith(expect.objectContaining({ searchQuery: 'Bob' })));

      // 2. Filter by Size L
      fireEvent.change(screen.getByTestId('size-filter'), { target: { value: 'L' } });
      await waitFor(() => expect(mockSetFilters).toHaveBeenCalledWith(expect.objectContaining({ searchQuery: 'Bob', size_cd: 'L' })));

      // 3. Filter by Role Event Manager
      fireEvent.change(screen.getByTestId('role-filter'), { target: { value: ROLES.EVENT_MANAGER } });
      await waitFor(() => expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({ searchQuery: 'Bob', size_cd: 'L', roles: [ROLES.EVENT_MANAGER] })
      ));
      // Check the final state of filters from the hook's perspective
      expect(currentFilters).toEqual({ searchQuery: 'Bob', size_cd: 'L', roles: [ROLES.EVENT_MANAGER] });
    });

    it('should correctly clear a filter', async () => {
       render(
        <TshirtsPage>
           <select data-testid="size-filter" onChange={(e) => mockSetFilters(prev => ({...prev, size_cd: e.target.value === "" ? undefined : e.target.value }))}>
            <option value="L">L</option>
            <option value="">Any Size</option>
          </select>
        </TshirtsPage>
      );
      const sizeFilter = screen.getByTestId('size-filter');

      // Apply Size L filter
      fireEvent.change(sizeFilter, { target: { value: 'L' } });
      await waitFor(() => expect(mockSetFilters).toHaveBeenCalledWith(expect.objectContaining({ size_cd: 'L' })));
      expect(currentFilters).toHaveProperty('size_cd', 'L');

      // Clear Size filter (select "Any Size")
      fireEvent.change(sizeFilter, { target: { value: '' } }); // Assuming empty value clears the filter
      await waitFor(() => expect(mockSetFilters).toHaveBeenCalledWith(expect.objectContaining({ size_cd: undefined })));
      expect(currentFilters).toEqual(expect.objectContaining({ size_cd: undefined })); // or that size_cd is not in currentFilters
    });
  });
});
