// src/app/app/dashboard/components/alerts-faqs-panel.tsx
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlertsFaqsData } from '@/app/app/admin/alerts-faqs/hooks/use-alerts-faqs-data'; // Adjust path as needed
import { AlertTriangle, HelpCircle, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export function AlertsFaqsPanel() {
  // Use the existing hook, it fetches both alerts and FAQs
  const { alerts, faqs, loading, error } = useAlertsFaqsData();

  const now = new Date();

  const activeAlerts = alerts
    .filter(alert => {
      // Must be active
      if (!alert.active) return false;
      
      // Date filtering
      const hasStartDate = alert.start_date && new Date(alert.start_date) > now;
      const hasEndDate = alert.end_date && new Date(alert.end_date) < now;
      
      return !hasStartDate && !hasEndDate; // Not yet started OR already ended
    })
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()) // Sort by most recent
    .slice(0, 3);

  const activeFaqs = faqs
    .filter(faq => faq.active) // Must be active
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()) // Sort by sort_order then most recent
    .slice(0, 3);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications & FAQs</CardTitle>
          <CardDescription>Latest updates and common questions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-8 w-3/4 mt-2" />
          <Skeleton className="h-6 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Notifications & FAQs</CardTitle></CardHeader>
        <CardContent><p className="text-destructive">Could not load alerts/FAQs: {error}</p></CardContent>
      </Card>
    );
  }
  
  const hasContent = activeAlerts.length > 0 || activeFaqs.length > 0; // Changed recentFaqs to activeFaqs

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications & FAQs</CardTitle>
        <CardDescription>Latest updates and common questions. 
          <Link href="/app/admin/alerts-faqs" legacyBehavior>
            <a className="text-xs text-blue-500 hover:underline ml-1 group inline-flex items-center">
              Manage all <ExternalLink className="h-3 w-3 ml-1 group-hover:underline"/>
            </a>
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasContent && <p className="text-muted-foreground text-center py-4">No active alerts or FAQs.</p>} {/* Updated text */}
        
        {activeAlerts.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center"><AlertTriangle className="h-4 w-4 mr-2 text-yellow-500"/>Current Alerts</h4>
            <ul className="space-y-2">
              {activeAlerts.map(alert => (
                <li key={`alert-${alert.id}`} className="text-xs p-2 bg-secondary rounded-md">
                  <div className="font-medium mb-0.5">{alert.title} {alert.category && <Badge variant="outline" className="ml-2 text-xs font-normal">{alert.category}</Badge>}</div>
                  {alert.content && <p className="text-muted-foreground truncate max-w-md">{alert.content}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeFaqs.length > 0 && ( // Changed recentFaqs to activeFaqs
          <div>
            <h4 className="text-sm font-semibold mb-2 mt-4 flex items-center"><HelpCircle className="h-4 w-4 mr-2 text-blue-500"/>Active FAQs</h4> {/* Updated text */}
            <ul className="space-y-2">
              {activeFaqs.map(faq => ( // Changed recentFaqs to activeFaqs
                <li key={`faq-${faq.id}`} className="text-xs p-2 bg-secondary rounded-md">
                  <div className="font-medium mb-0.5">{faq.question} {faq.category && <Badge variant="outline" className="ml-2 text-xs font-normal">{faq.category}</Badge>}</div>
                   <p className="text-muted-foreground truncate max-w-md">{faq.answer}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
