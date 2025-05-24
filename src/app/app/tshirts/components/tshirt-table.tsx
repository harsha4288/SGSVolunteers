"use client";

import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { WorkingTShirtTable } from "./working-tshirt-table";
import { NoVolunteersAlert } from "./common/no-volunteers-alert";
import type { Volunteer, TShirtSize } from "../types";

interface TShirtTableProps {
  supabase: SupabaseClient<Database>;
  isAdmin: boolean;
  eventId: number;
  tshirtSizes: TShirtSize[];
  volunteer: Volunteer | null;
  familyMembers: Volunteer[];
  searchResults: Volunteer[];
  profileId: string;
}

/**
 * Main component for displaying the T-shirt management table
 * Now uses the unified approach for simplified code
 */
export function TShirtTable({
  supabase,
  isAdmin,
  eventId,
  tshirtSizes,
  volunteer,
  familyMembers,
  searchResults,
  profileId
}: TShirtTableProps) {
  // Determine which volunteers to display
  const volunteersToDisplay = React.useMemo(() => {
    if (isAdmin) {
      return searchResults.length > 0 ? searchResults : [];
    } else {
      const volunteers = [];
      if (volunteer) volunteers.push(volunteer);
      volunteers.push(...familyMembers);
      return volunteers;
    }
  }, [isAdmin, searchResults, volunteer, familyMembers]);

  if (volunteersToDisplay.length === 0) {
    return <NoVolunteersAlert isAdmin={isAdmin} />;
  }

  return (
    <WorkingTShirtTable
      supabase={supabase}
      eventId={eventId}
      volunteers={volunteersToDisplay}
      isAdmin={isAdmin}
      currentVolunteerId={volunteer?.id}
      currentProfileId={profileId}
    />
  );
}
