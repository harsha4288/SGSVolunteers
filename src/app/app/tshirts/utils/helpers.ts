/**
 * Helper functions for the T-shirt module
 */

import type { Volunteer, TShirtSize } from "../types";

/**
 * Determine which volunteers to display based on role
 */
export function getVolunteersToDisplay(
  isAdmin: boolean,
  volunteer: Volunteer | null,
  familyMembers: Volunteer[],
  searchResults: Volunteer[]
): Volunteer[] {
  if (isAdmin) {
    // For admin, show search results if available
    return searchResults.length > 0 ? searchResults : [];
  } else {
    // For volunteer, always show the volunteer and family members if available
    const volunteers = [];
    if (volunteer) volunteers.push(volunteer);
    if (familyMembers && familyMembers.length > 0) volunteers.push(...familyMembers);
    return volunteers;
  }
}

/**
 * Calculate allocations from volunteer data
 */
export function calculateAllocations(volunteers: Volunteer[]): Record<string, number> {
  const allocations: Record<string, number> = {};

  volunteers.forEach(vol => {
    // Use requested_tshirt_quantity from the Volunteers table
    // Default to 1 if requested_tshirt_quantity is not set
    const requestedQuantity = vol.requested_tshirt_quantity !== undefined ?
      parseInt(vol.requested_tshirt_quantity as any) : 1;

    allocations[vol.id] = isNaN(requestedQuantity) ? 1 : requestedQuantity;
  });

  return allocations;
}

/**
 * Initialize empty T-shirts record for volunteers
 */
export function initializeTShirts(volunteerIds: string[]): Record<string, any[]> {
  const tshirts: Record<string, any[]> = {};
  volunteerIds.forEach(id => {
    tshirts[id] = [];
  });
  return tshirts;
}

/**
 * Initialize empty counts by size for volunteers
 */
export function initializeCountsBySize(volunteerIds: string[]): Record<string, Record<string, number>> {
  const countsBySize: Record<string, Record<string, number>> = {};

  volunteerIds.forEach(id => {
    countsBySize[id] = {};
  });

  return countsBySize;
}

/**
 * Calculate preference counts by size from T-shirts
 */
export function calculatePreferenceCountsBySize(
  volunteerIds: string[],
  tshirts: Record<string, any[]>
): Record<string, Record<string, number>> {
  const countsBySize: Record<string, Record<string, number>> = {};

  volunteerIds.forEach(id => {
    countsBySize[id] = {};
    if (tshirts[id]) {
      tshirts[id]
        .filter(t => t.status === 'preferred')
        .forEach(t => {
          if (!countsBySize[id][t.size]) {
            countsBySize[id][t.size] = 0;
          }
          countsBySize[id][t.size] += (t.quantity || 1);
        });
    }
  });

  return countsBySize;
}

/**
 * Calculate issuance counts by size from T-shirts
 */
export function calculateIssuanceCountsBySize(
  volunteerIds: string[],
  tshirts: Record<string, any[]>
): Record<string, Record<string, number>> {
  const countsBySize: Record<string, Record<string, number>> = {};

  volunteerIds.forEach(id => {
    countsBySize[id] = {};
    if (tshirts[id]) {
      tshirts[id]
        .filter(t => t.status === 'issued')
        .forEach(t => {
          if (!countsBySize[id][t.size]) {
            countsBySize[id][t.size] = 0;
          }
          countsBySize[id][t.size] += (t.quantity || 1);
        });
    }
  });

  return countsBySize;
}

/**
 * Get default T-shirt sizes if none are available
 */
export function getDefaultSizes(eventId: number): TShirtSize[] {
  // IMPORTANT: These sizes must match exactly what's in the tshirt_inventory table
  // The size_cd values are used as foreign keys
  return [
    { event_id: eventId, size_cd: 'XS', size_name: 'XS', sort_order: 1 },
    { event_id: eventId, size_cd: 'S', size_name: 'S', sort_order: 2 },
    { event_id: eventId, size_cd: 'M', size_name: 'M', sort_order: 3 },
    { event_id: eventId, size_cd: 'L', size_name: 'L', sort_order: 4 },
    { event_id: eventId, size_cd: 'XL', size_name: 'XL', sort_order: 5 },
    { event_id: eventId, size_cd: '2XL', size_name: '2XL', sort_order: 6 },
    { event_id: eventId, size_cd: '3XL', size_name: '3XL', sort_order: 7 },
  ];
}

/**
 * Format volunteer name for display
 */
export function formatVolunteerName(volunteer: Volunteer, currentVolunteerId?: string): string {
  let name = `${volunteer.first_name} ${volunteer.last_name}`;
  if (currentVolunteerId && volunteer.id === currentVolunteerId) {
    name += " (You)";
  }
  return name;
}
