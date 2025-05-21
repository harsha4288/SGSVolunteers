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
 * Initialize empty issuances record for volunteers
 */
export function initializeIssuances(volunteerIds: string[]): Record<string, string[]> {
  const issuances: Record<string, string[]> = {};
  volunteerIds.forEach(id => {
    issuances[id] = [];
  });
  return issuances;
}

/**
 * Calculate counts by size from issuances
 */
export function calculateCountsBySize(
  volunteerIds: string[],
  issuances: Record<string, string[]>
): Record<string, Record<string, number>> {
  const countsBySize: Record<string, Record<string, number>> = {};
  
  volunteerIds.forEach(id => {
    countsBySize[id] = {};
    if (issuances[id]) {
      issuances[id].forEach(size => {
        if (!countsBySize[id][size]) {
          countsBySize[id][size] = 0;
        }
        countsBySize[id][size]++;
      });
    }
  });
  
  return countsBySize;
}

/**
 * Get default T-shirt sizes if none are available
 */
export function getDefaultSizes(eventId: number): TShirtSize[] {
  return [
    { id: 1, event_id: eventId, size_name: 'XS', sort_order: 1 },
    { id: 2, event_id: eventId, size_name: 'S', sort_order: 2 },
    { id: 3, event_id: eventId, size_name: 'M', sort_order: 3 },
    { id: 4, event_id: eventId, size_name: 'L', sort_order: 4 },
    { id: 5, event_id: eventId, size_name: 'XL', sort_order: 5 },
    { id: 6, event_id: eventId, size_name: '2XL', sort_order: 6 },
    { id: 7, event_id: eventId, size_name: '3XL', sort_order: 7 },
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
