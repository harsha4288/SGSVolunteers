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

  // Filter for active alerts (e.g., based on start_date and end_date)
  // For simplicity, we'll just take the latest few for now.
  const activeAlerts = alerts
    .filter(alert => {
        // Basic filtering: no end_date or end_date is in the future
        // and no start_date or start_date is in the past
        const now = new Date();
        // Alert is considered active if:
        // 1. No end_date OR end_date is in the future
        // 2. No start_date OR start_date is in the past
        const isNotEnded = !alert.end_date || new Date(alert.end_date) >= now;
        const isStarted = !alert.start_date || new Date(alert.start_date) <= now;
        return isNotEnded && isStarted;
    })
    .slice(0, 3); // Show top 3 active alerts

  const recentFaqs = faqs.slice(0, 3); // Show top 3 recent FAQs

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
  
  const hasContent = activeAlerts.length > 0 || recentFaqs.length > 0;

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
        {!hasContent && <p className="text-muted-foreground text-center py-4">No current alerts or FAQs.</p>}
        
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

        {recentFaqs.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 mt-4 flex items-center"><HelpCircle className="h-4 w-4 mr-2 text-blue-500"/>Recent FAQs</h4>
            <ul className="space-y-2">
              {recentFaqs.map(faq => (
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
