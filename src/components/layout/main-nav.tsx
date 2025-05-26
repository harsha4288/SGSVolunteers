
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAV_ITEMS, SITE_CONFIG } from "@/lib/constants";
import type { NavItem } from "@/lib/types";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserRole } from "@/hooks/use-user-role";

export function MainNav() {
  const pathname = usePathname();
  const { isAdmin, loading } = useUserRole();

  // Filter navigation items based on user role
  const filteredNavItems = React.useMemo(() => {
    if (loading) {
      // While loading, show all items except admin-only ones
      return APP_NAV_ITEMS.filter(item => !item.adminOnly);
    }

    return APP_NAV_ITEMS.filter(item => {
      if (item.adminOnly && !isAdmin) {
        return false;
      }
      return true;
    });
  }, [isAdmin, loading]);

  return (
    <ScrollArea className="flex-grow">
      <SidebarMenu>
        {filteredNavItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                variant="default"
                className={cn(
                  "w-full justify-start",
                  pathname === item.href && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                )}
                isActive={pathname === item.href}
                tooltip={{ children: item.title, side: "right", align: "center" }}
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                <span className="truncate">{item.title}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </ScrollArea>
  );
}
