"use client";

import { useState, useEffect } from "react";
import { RoleBasedDashboard } from "./role-based-dashboard";

interface ClientDashboardProps {
  defaultProfileId: string;
}

export function ClientDashboard({ defaultProfileId }: ClientDashboardProps) {
  const [profileId, setProfileId] = useState<string>(defaultProfileId);

  useEffect(() => {
    // Check for impersonation on client side
    const impersonatedProfileId = localStorage.getItem('impersonatedProfileId');
    if (impersonatedProfileId) {
      setProfileId(impersonatedProfileId);
    }
  }, []);

  return <RoleBasedDashboard profileId={profileId} />;
}