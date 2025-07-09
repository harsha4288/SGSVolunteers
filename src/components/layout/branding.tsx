"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface BrandingProps {
  className?: string;
  showDescription?: boolean;
  variant?: "full" | "compact";
}

export function Branding({ 
  className, 
  showDescription = true, 
  variant = "full" 
}: BrandingProps) {
  const isCompact = variant === "compact";
  
  return (
    <div className={cn(
      "flex items-center gap-3",
      isCompact ? "gap-2" : "gap-3",
      className
    )}>
      {/* SGSGF Logo */}
      <div className="flex-shrink-0">
        <Image
          src="/assets/SGSGF-logo-2024-gradient.png"
          alt="SGS Gita Foundation Logo"
          width={isCompact ? 32 : 40}
          height={isCompact ? 32 : 40}
          className="object-contain"
        />
      </div>
      
      {/* Text content */}
      <div className="flex flex-col">
        <h1 className={cn(
          "font-semibold text-primary tracking-tight",
          isCompact ? "text-sm" : "text-lg"
        )}>
          Guru Pūrṇimā & Gītā Utsav Sēvā
        </h1>
        {showDescription && (
          <p className={cn(
            "text-muted-foreground leading-tight",
            isCompact ? "text-xs" : "text-sm"
          )}>
            Volunteer Data Management Platform
          </p>
        )}
      </div>
    </div>
  );
}

export function BrandingLink({ 
  href = "/app/dashboard", 
  className,
  ...props 
}: BrandingProps & { href?: string }) {
  return (
    <Link 
      href={href}
      className={cn(
        "group hover:opacity-80 transition-opacity duration-200",
        className
      )}
    >
      <Branding {...props} />
    </Link>
  );
}

export function SidebarBranding({ 
  href = "/app/dashboard", 
  className 
}: { href?: string; className?: string }) {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-2 group-data-[collapsible=icon]:justify-center hover:opacity-80 transition-opacity duration-200",
        className
      )}
    >
      {/* Logo - always visible */}
      <div className="flex-shrink-0">
        <Image
          src="/assets/SGSGF-logo-2024-gradient.png"
          alt="SGS Gita Foundation Logo"
          width={32}
          height={32}
          className="object-contain"
        />
      </div>
      
      {/* Text - hidden when sidebar is collapsed */}
      <div className="flex flex-col group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:opacity-0 transition-opacity duration-200">
        <h1 className="text-lg font-semibold text-primary tracking-tight">
          Guru Pūrṇimā & Gītā Utsav Sēvā
        </h1>
      </div>
    </Link>
  );
}