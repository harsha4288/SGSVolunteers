"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminNavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface AdminNavProps {
  items: AdminNavItem[];
  className?: string;
}

/**
 * Reusable admin navigation component
 * Provides tab-based navigation for admin-only modules
 * Follows consistent design patterns across the application
 */
export function AdminNav({ items, className }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center space-x-1 bg-muted/30 rounded-lg p-1", className)}>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        
        return (
          <Link key={item.href} href={item.href} passHref>
            <Button
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex items-center gap-2 transition-colors",
                isActive 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              <span className="font-medium">{item.title}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
