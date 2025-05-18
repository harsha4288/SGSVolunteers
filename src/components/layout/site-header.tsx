
"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { EventSelector } from "@/components/layout/event-selector";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Only show event selector on relevant pages
  const showEventSelector = pathname.includes('/app/assignments') ||
                           pathname.includes('/app/volunteer-assignments') ||
                           pathname.includes('/app/check-in');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="flex h-14 items-center w-full">
        {/* Left section - leave space for the logo in the sidebar */}
        <div className="w-[3.5rem] md:w-[4rem] flex-shrink-0">
          {/* This space is intentionally left empty to avoid overlapping with the logo */}
        </div>

        {/* Mobile sidebar trigger - positioned to not overlap with logo */}
        {isMobile && (
          <div className="flex items-center ml-2">
            <SidebarTrigger className="flex-shrink-0" />
          </div>
        )}

        {/* Center section with event selector */}
        <div className="flex-1 flex justify-center items-center">
          {showEventSelector && (
            <div className="flex-shrink-0 max-w-[180px] sm:max-w-none">
              <EventSelector className="w-full" />
            </div>
          )}
        </div>

        {/* Right section with theme toggle and user nav */}
        <div className="fixed right-1 sm:right-6 lg:right-8 z-50 flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
