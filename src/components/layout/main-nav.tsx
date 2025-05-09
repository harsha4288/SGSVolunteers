
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

export function MainNav() {
  const pathname = usePathname();

  return (
    <ScrollArea className="flex-grow">
      <SidebarMenu>
        {APP_NAV_ITEMS.map((item) => (
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
