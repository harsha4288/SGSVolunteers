// src/app/app/admin/alerts-faqs/page.tsx
"use client";

// Disable static generation for admin pages
export const dynamic = 'force-dynamic';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, AlertTriangle, HelpCircle, AlertCircle as AlertIcon } from 'lucide-react'; // Renamed AlertCircle to AlertIcon
import { useAlertsFaqsData } from './hooks/use-alerts-faqs-data';
import { AlertsFaqsTable } from './components/alerts-faqs-table';
import { AlertFaqForm } from './components/alert-faq-form';
import type { Alert, FAQ } from './types';
import { Skeleton } from '@/components/ui/skeleton'; // Added Skeleton
import { Alert as ShadcnAlert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added ShadcnAlert


export default function AlertsFaqsPage() {
  const {
    alerts,
    faqs,
    timeslots,
    loading,
    error,
    saveAlert,
    removeAlert,
    saveFaq,
    removeFaq,
    refreshData,
  } = useAlertsFaqsData();

  const [formMode, setFormMode] = React.useState<'alert' | 'faq'>('alerts'); // Default to 'alerts' to match Tabs
  const [formOpen, setFormOpen] = React.useState(false);
  const [currentItem, setCurrentItem] = React.useState<Partial<Alert> | Partial<FAQ> | null>(null);

  const handleAddNew = (mode: 'alert' | 'faq') => {
    setFormMode(mode);
    setCurrentItem(null);
    setFormOpen(true);
  };

  const handleEdit = (item: Alert | FAQ, mode: 'alert' | 'faq') => {
    setFormMode(mode);
    setCurrentItem(item);
    setFormOpen(true);
  };

  const handleSubmitForm = async (data: any) => {
    if (formMode === 'alert') {
      await saveAlert(data as Omit<Alert, 'id' | 'created_at' | 'updated_at' | 'timeslot_name'>);
    } else {
      await saveFaq(data as Omit<FAQ, 'id' | 'created_at' | 'updated_at' | 'timeslot_name'>);
    }
  };

  // Skeleton for initial page load
  if (loading && alerts.length === 0 && faqs.length === 0 && timeslots.length === 0 && !error) {
    return (
      <div className="container mx-auto py-3 px-2 space-y-3">
        <Card className="mb-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><Skeleton className="h-6 w-64" /><Skeleton className="h-4 w-80 mt-1" /></div>
            <Skeleton className="h-10 w-36" />
          </CardHeader>
        </Card>
        <Skeleton className="h-10 w-1/2 lg:w-1/3 mb-4" /> {/* TabsList Skeleton */}
        <Card><CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64 mt-1" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      </div>
    );
  }


  if (error) {
    return (
      <div className="container mx-auto p-4">
        <ShadcnAlert variant="destructive">
          <AlertIcon className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            There was a problem fetching alerts and FAQs: {error}. Please try refreshing the page or contact support if the issue persists.
            <Button onClick={() => refreshData()} variant="link" className="ml-2">Try again</Button>
          </AlertDescription>
        </ShadcnAlert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-3 px-2 space-y-3">
      <Card className="mb-4">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
                <CardTitle>Manage Alerts & FAQs</CardTitle>
                <CardDescription>Create, edit, and delete system-wide alerts and FAQs for volunteers.</CardDescription>
            </div>
             <Button onClick={() => handleAddNew(formMode)} size="sm" className="w-full sm:w-auto">
                <PlusCircle className="h-4 w-4 mr-2" /> Add New {formMode === 'alerts' ? 'Alert' : 'FAQ'}
            </Button>
        </CardHeader>
      </Card>

      <Tabs defaultValue="alerts" onValueChange={(value) => setFormMode(value as 'alert' | 'faq')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3">
          <TabsTrigger value="alerts" className="flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Alerts</TabsTrigger>
          <TabsTrigger value="faqs" className="flex items-center gap-2"><HelpCircle className="h-4 w-4"/>FAQs</TabsTrigger>
        </TabsList>
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Current Alerts</CardTitle>
              <CardDescription>System alerts visible to volunteers. {loading && alerts.length > 0 && "(Refreshing...)"}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertsFaqsTable<Alert>
                data={alerts}
                dataType="alert"
                onEdit={(item) => handleEdit(item, 'alert')}
                onDelete={removeAlert}
                loading={loading && alerts.length === 0} // Only show table-level loading if no data yet
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="faqs">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Manage the list of FAQs available to volunteers. {loading && faqs.length > 0 && "(Refreshing...)"}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertsFaqsTable<FAQ>
                data={faqs}
                dataType="faq"
                onEdit={(item) => handleEdit(item, 'faq')}
                onDelete={removeFaq}
                loading={loading && faqs.length === 0} // Only show table-level loading if no data yet
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {formOpen && ( // Ensure form is only rendered when open to re-initialize with new data
        <AlertFaqForm
          mode={formMode === 'alerts' ? 'alert' : 'faq'} // Pass correct mode to form
          formOpen={formOpen}
          setFormOpen={setFormOpen}
          initialData={currentItem}
          onSubmit={handleSubmitForm}
          timeslots={timeslots}
        />
      )}
    </div>
  );
}
