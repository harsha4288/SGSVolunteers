
import * as React from "react";
import { SITE_CONFIG } from "@/lib/constants";
import { MainNav } from "@/components/layout/main-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { UserNav } from "@/components/layout/user-nav"; // For sidebar footer example
import { ThemeToggle } from "@/components/layout/theme-toggle"; // For sidebar footer example
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger, // For desktop sidebar collapse
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserCog, Settings } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const LogoIcon = SITE_CONFIG.logo;

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" collapsible="icon" side="left">
        <SidebarHeader className="p-4">
            <Link href="/app/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg bg-primary text-primary-foreground group-hover:bg-primary/90">
                <LogoIcon className="h-6 w-6" />
              </Button>
              <h1 className={cn(
                "text-xl font-semibold tracking-tight text-primary whitespace-nowrap duration-200 ease-linear",
                "group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:opacity-0"
                )}>
                {SITE_CONFIG.name}
              </h1>
            </Link>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
        <SidebarFooter className="p-2 flex-col gap-2">
          {/* Sidebar footer links */}
          <div className="group-data-[collapsible=icon]:hidden flex flex-col gap-1">
            <Link href="/app/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto mt-14">
          {children}
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
