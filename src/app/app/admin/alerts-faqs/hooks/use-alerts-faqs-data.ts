// src/app/app/admin/alerts-faqs/hooks/use-alerts-faqs-data.ts
"use client";

import * as React from 'react';
import { createClient } from '@/lib/supabase/client-ssr';
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
      // Fetch data without silently catching errors
      const alertsPromise = service.fetchAlerts();
      const faqsPromise = service.fetchFaqs();
      const timeslotsPromise = service.fetchTimeslots();

      // Wait for all promises and catch errors individually
      const [alertsResult, faqsResult, timeslotsResult] = await Promise.allSettled([
        alertsPromise,
        faqsPromise,
        timeslotsPromise
      ]);

      // Handle results and collect errors
      const errors: string[] = [];

      if (alertsResult.status === 'fulfilled') {
        setAlerts(alertsResult.value);
      } else {
        errors.push(`Alerts: ${alertsResult.reason?.message || 'Unknown error'}`);
        console.error('Error fetching alerts:', alertsResult.reason);
      }

      if (faqsResult.status === 'fulfilled') {
        setFaqs(faqsResult.value);
      } else {
        errors.push(`FAQs: ${faqsResult.reason?.message || 'Unknown error'}`);
        console.error('Error fetching FAQs:', faqsResult.reason);
      }

      if (timeslotsResult.status === 'fulfilled') {
        setTimeslots(timeslotsResult.value);
      } else {
        errors.push(`Timeslots: ${timeslotsResult.reason?.message || 'Unknown error'}`);
        console.error('Error fetching timeslots:', timeslotsResult.reason);
      }

      // Set error state if any errors occurred
      if (errors.length > 0) {
        setError(errors.join('; '));
        toast({
          title: "Error loading data",
          description: errors.join('\n'),
          variant: "destructive"
        });
      }
    } catch (e: any) {
      const errorMsg = e?.message || 'An unexpected error occurred';
      setError(errorMsg);
      console.error('Alerts/FAQs module data loading failed:', e);
      toast({
        title: "Error loading data",
        description: errorMsg,
        variant: "destructive"
      });
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
