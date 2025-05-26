// src/app/app/admin/alerts-faqs/services/alerts-faqs-service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import type { Alert, FAQ, Timeslot } from '../types';

interface AlertsFaqsServiceProps {
  supabase: SupabaseClient<Database>;
}

export function createAlertsFaqsService({ supabase }: AlertsFaqsServiceProps) {
  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    throw new Error(`Failed to ${context.toLowerCase()}. ${error.message}`);
  };

  // Fetch Timeslots for dropdowns
  const fetchTimeslots = async (): Promise<Timeslot[]> => {
    const { data, error } = await supabase.from('timeslots').select('id, name').order('name');
    if (error) handleError(error, 'fetch timeslots');
    return data || [];
  };
  
  // Alerts CRUD
  const fetchAlerts = async (): Promise<Alert[]> => {
    const { data, error } = await supabase.from('alerts')
      .select('*, timeslots (name)') // Join with timeslots to get name
      .order('created_at', { ascending: false });
    if (error) handleError(error, 'fetch alerts');
    return (data?.map(a => ({...a, timeslot_name: a.timeslots?.name})) || []) as Alert[];
  };

  const upsertAlert = async (alertData: Omit<Alert, 'id' | 'created_at' | 'updated_at' | 'timeslot_name'>): Promise<Alert> => {
    const { data, error } = await supabase.from('alerts').upsert(alertData).select().single();
    if (error) handleError(error, 'upsert alert');
    return data as Alert;
  };

  const deleteAlert = async (id: number): Promise<void> => {
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (error) handleError(error, 'delete alert');
  };

  // FAQs CRUD
  const fetchFaqs = async (): Promise<FAQ[]> => {
    const { data, error } = await supabase.from('faqs')
      .select('*, timeslots (name)') // Join with timeslots to get name
      .order('created_at', { ascending: false });
    if (error) handleError(error, 'fetch FAQs');
    return (data?.map(f => ({...f, timeslot_name: f.timeslots?.name})) || []) as FAQ[];
  };

  const upsertFaq = async (faqData: Omit<FAQ, 'id' | 'created_at' | 'updated_at' | 'timeslot_name'>): Promise<FAQ> => {
    const { data, error } = await supabase.from('faqs').upsert(faqData).select().single();
    if (error) handleError(error, 'upsert FAQ');
    return data as FAQ;
  };

  const deleteFaq = async (id: number): Promise<void> => {
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) handleError(error, 'delete FAQ');
  };

  return {
    fetchTimeslots,
    fetchAlerts,
    upsertAlert,
    deleteAlert,
    fetchFaqs,
    upsertFaq,
    deleteFaq,
  };
}
