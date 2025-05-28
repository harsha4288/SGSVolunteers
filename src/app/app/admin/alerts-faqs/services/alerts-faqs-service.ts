// src/app/app/admin/alerts-faqs/services/alerts-faqs-service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Alert as DbAlert, FAQ as DbFAQ, InsertAlert, InsertFAQ } from '@/lib/types/supabase';
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
    const { data, error } = await supabase
      .from('time_slots')
      .select('id, slot_name')
      .order('slot_name');

    if (error) handleError(error, 'fetch timeslots');
    return (data || []).map(ts => ({
      id: ts.id,
      name: ts.slot_name
    }));
  };

  // Alerts CRUD
  const fetchAlerts = async (): Promise<Alert[]> => {
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        time_slot:timeslot_id_filter (
          slot_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) handleError(error, 'fetch alerts');

    return (data || []).map(alert => ({
      ...alert,
      time_slot_id_filter: alert.timeslot_id_filter,
      timeslot_name: alert.time_slot?.slot_name
    })) as Alert[];
  };

  const upsertAlert = async (alertData: Omit<Alert, 'id' | 'created_at' | 'updated_at' | 'timeslot_name'>): Promise<Alert> => {
    // Map the data to match the database schema
    const dbData: InsertAlert = {
      title: alertData.title,
      content: alertData.content || null,
      category: alertData.category || null,
      timeslot_id_filter: alertData.time_slot_id_filter || null,
      start_date: alertData.start_date || null,
      end_date: alertData.end_date || null,
      active: alertData.active ?? true,
    };

    const { data, error } = await supabase
      .from('alerts')
      .upsert(dbData)
      .select(`
        *,
        time_slot:timeslot_id_filter (
          slot_name
        )
      `)
      .single();

    if (error) handleError(error, 'upsert alert');

    return {
      ...data!,
      time_slot_id_filter: data!.timeslot_id_filter,
      timeslot_name: data!.time_slot?.slot_name
    } as Alert;
  };

  const deleteAlert = async (id: number): Promise<void> => {
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (error) handleError(error, 'delete alert');
  };

  // FAQs CRUD
  const fetchFaqs = async (): Promise<FAQ[]> => {
    const { data, error } = await supabase
      .from('faqs')
      .select(`
        *,
        time_slot:timeslot_id_filter (
          slot_name
        )
      `)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) handleError(error, 'fetch FAQs');

    return (data || []).map(faq => ({
      ...faq,
      time_slot_id_filter: faq.timeslot_id_filter,
      timeslot_name: faq.time_slot?.slot_name
    })) as FAQ[];
  };

  const upsertFaq = async (faqData: Omit<FAQ, 'id' | 'created_at' | 'updated_at' | 'timeslot_name'>): Promise<FAQ> => {
    // Map the data to match the database schema
    const dbData: InsertFAQ = {
      question: faqData.question,
      answer: faqData.answer,
      category: faqData.category || null,
      timeslot_id_filter: faqData.time_slot_id_filter || null,
      sort_order: faqData.sort_order ?? 0,
      active: faqData.active ?? true,
    };

    const { data, error } = await supabase
      .from('faqs')
      .upsert(dbData)
      .select(`
        *,
        time_slot:timeslot_id_filter (
          slot_name
        )
      `)
      .single();

    if (error) handleError(error, 'upsert FAQ');

    return {
      ...data!,
      time_slot_id_filter: data!.timeslot_id_filter,
      timeslot_name: data!.time_slot?.slot_name
    } as FAQ;
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
