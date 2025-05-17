
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-14 max-w-screen-2xl items-center px-1 sm:px-6 lg:px-8">
        {isMobile && <SidebarTrigger className="mr-1 flex-shrink-0" />}
        <div className="flex-1 flex items-center overflow-hidden">
          {showEventSelector && (
            <div className="mr-2 flex-shrink-0 max-w-[180px] sm:max-w-none">
              <EventSelector className="w-full" />
            </div>
          )}
          {/* Add breadcrumbs or page title here if needed */}
        </div>
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0 ml-1">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
