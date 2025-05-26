// src/app/app/admin/alerts-faqs/hooks/use-alerts-faqs-data.ts
"use client";

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createAlertsFaqsService } from '../services/alerts-faqs-service';
import type { Alert, FAQ, Timeslot } from '../types';

export function useAlertsFaqsData() {
  const [supabase] = React.useState(() => createClient());
  const [service] = React.useState(() => createAlertsFaqsService({ supabase }));
  const { toast } = useToast();

  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [faqs, setFaqs] = React.useState<FAQ[]>([]);
  const [timeslots, setTimeslots] = React.useState<Timeslot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [alertData, faqData, timeslotData] = await Promise.all([
        service.fetchAlerts(),
        service.fetchFaqs(),
        service.fetchTimeslots(),
      ]);
      setAlerts(alertData);
      setFaqs(faqData);
      setTimeslots(timeslotData);
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Error Loading Data", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [service, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Alert operations
  const saveAlert = async (alertData: Omit<Alert, 'id' | 'created_at' | 'updated_at' | 'timeslot_name'>) => {
    try {
      await service.upsertAlert(alertData);
      toast({ title: "Alert Saved", description: "The alert has been successfully saved." });
      await loadData(); // Refresh list
    } catch (e: any) {
      toast({ title: "Error Saving Alert", description: e.message, variant: "destructive" });
      throw e;
    }
  };
  const removeAlert = async (id: number) => {
    try {
      await service.deleteAlert(id);
      toast({ title: "Alert Deleted", description: "The alert has been successfully deleted." });
      await loadData(); // Refresh list
    } catch (e: any) {
      toast({ title: "Error Deleting Alert", description: e.message, variant: "destructive" });
      throw e;
    }
  };

  // FAQ operations
  const saveFaq = async (faqData: Omit<FAQ, 'id' | 'created_at' | 'updated_at' | 'timeslot_name'>) => {
     try {
      await service.upsertFaq(faqData);
      toast({ title: "FAQ Saved", description: "The FAQ has been successfully saved." });
      await loadData(); // Refresh list
    } catch (e: any) {
      toast({ title: "Error Saving FAQ", description: e.message, variant: "destructive" });
      throw e;
    }
  };
  const removeFaq = async (id: number) => {
    try {
      await service.deleteFaq(id);
      toast({ title: "FAQ Deleted", description: "The FAQ has been successfully deleted." });
      await loadData(); // Refresh list
    } catch (e: any) {
      toast({ title: "Error Deleting FAQ", description: e.message, variant: "destructive" });
      throw e;
    }
  };

  return {
    alerts,
    faqs,
    timeslots,
    loading,
    error,
    saveAlert,
    removeAlert,
    saveFaq,
    removeFaq,
    refreshData: loadData,
  };
}
export type AlertsFaqsDataHook = ReturnType<typeof useAlertsFaqsData>;
