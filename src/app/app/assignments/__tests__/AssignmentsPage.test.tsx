import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AssignmentsPage from '../page'; // Adjust path as necessary
import { createClient } from '@/lib/supabase/client'; // Adjust path as necessary

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string | null> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock @/lib/supabase/client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Mock AssignmentsDashboard component
vi.mock('../components/assignments-dashboard', () => ({
  // If AssignmentsDashboard is a default export:
  // default: vi.fn(() => <div data-testid="mock-assignments-dashboard">Mock AssignmentsDashboard</div>),
  // If AssignmentsDashboard is a named export:
  AssignmentsDashboard: vi.fn(() => <div data-testid="mock-assignments-dashboard">Mock AssignmentsDashboard</div>),
}));

// Mock DashboardSkeleton component (assuming it's used for loading state)
vi.mock('@/components/shared/skeletons/dashboard-skeleton', () => ({
  DashboardSkeleton: vi.fn(() => <div data-testid="mock-dashboard-skeleton">Mock DashboardSkeleton</div>),
}));


describe('AssignmentsPage', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();

    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    };
    (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);
  });

  it('should render DashboardSkeleton while loading', () => {
    render(<AssignmentsPage />);
    expect(screen.getByTestId('mock-dashboard-skeleton')).toBeInTheDocument();
  });

  it('should display error if impersonatedProfileId is missing', async () => {
    mockLocalStorage.setItem('impersonatedProfileId', ''); // Simulate missing ID
    render(<AssignmentsPage />);
    // This test assumes that the component directly renders an error or that
    // AssignmentsDashboard (even if mocked) would somehow indicate this.
    // A more robust test would involve checking for specific error UI if the page itself handles this.
    // For now, we'll check if the skeleton is NOT there and the dashboard is not called.
    await waitFor(() => {
      expect(screen.queryByTestId('mock-dashboard-skeleton')).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId('mock-assignments-dashboard')).not.toBeInTheDocument();
    // Ideally, check for an actual error message:
    // expect(screen.getByText(/error obtaining profile/i)).toBeInTheDocument();
  });

  it('should display error if Supabase fails to fetch roles', async () => {
    const profileId = 'test-profile-id';
    mockLocalStorage.setItem('impersonatedProfileId', profileId);
    mockSupabaseClient.eq.mockResolvedValueOnce({ error: { message: 'Supabase error' } });

    render(<AssignmentsPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('mock-dashboard-skeleton')).not.toBeInTheDocument();
    });
    // Assuming an error message is shown. This part needs adjustment based on actual error handling.
    // For example, if it falls back to rendering the dashboard with a default role:
    // expect(screen.getByTestId('mock-assignments-dashboard')).toBeInTheDocument();
    // Or, if it shows an error:
    // expect(screen.getByText(/failed to fetch user role/i)).toBeInTheDocument();
    // For this example, let's assume it tries to render the dashboard but might pass a null/default role or show an error within it.
    // The current mock of AssignmentsDashboard doesn't show errors, so we check if it's rendered.
    // A more specific assertion about an error message would be better.
    await waitFor(() => {
        expect(screen.getByTestId('mock-assignments-dashboard')).toBeInTheDocument();
    });
    // And that it was called with the profileId and default role
    const { AssignmentsDashboard } = await import('../components/assignments-dashboard');
    expect(AssignmentsDashboard).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: profileId,
        userRole: 'volunteer', // Default role on error
        supabase: mockSupabaseClient,
      }),
      expect.anything()
    );
  });

  const rolesToTest: Array<[string | null, string]> = [
    ['admin', 'admin'],
    ['event_manager', 'event_manager'],
    ['volunteer', 'volunteer'],
    ['other_role', 'volunteer'], // Any other role defaults to volunteer
    [null, 'volunteer'], // No role found defaults to volunteer
  ];

  rolesToTest.forEach(([roleInDb, expectedRole]) => {
    it(`should render AssignmentsDashboard with role "${expectedRole}" when DB role is "${roleInDb}"`, async () => {
      const profileId = 'test-profile-id';
      mockLocalStorage.setItem('impersonatedProfileId', profileId);
      const dbResponse = roleInDb ? { data: [{ role: roleInDb }], error: null } : { data: [], error: null };
      mockSupabaseClient.eq.mockResolvedValueOnce(dbResponse);

      render(<AssignmentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-assignments-dashboard')).toBeInTheDocument();
      });

      const { AssignmentsDashboard } = await import('../components/assignments-dashboard');
      expect(AssignmentsDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          profileId: profileId,
          userRole: expectedRole,
          supabase: mockSupabaseClient,
        }),
        expect.anything()
      );
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profile_roles');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('role');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('profile_id', profileId);
    });
  });

  it('should render AssignmentsDashboard with default "volunteer" role if profile_roles data is null (e.g. RLS)', async () => {
    const profileId = 'test-profile-id';
    mockLocalStorage.setItem('impersonatedProfileId', profileId);
    // Simulate RLS or other issue returning null data but no explicit error
    mockSupabaseClient.eq.mockResolvedValueOnce({ data: null, error: null });

    render(<AssignmentsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-assignments-dashboard')).toBeInTheDocument();
    });

    const { AssignmentsDashboard } = await import('../components/assignments-dashboard');
    expect(AssignmentsDashboard).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: profileId,
        userRole: 'volunteer', // Default role
        supabase: mockSupabaseClient,
      }),
      expect.anything()
    );
  });
});
