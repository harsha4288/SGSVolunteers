
import type { NavItem } from "@/lib/types";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Handshake,
  Shirt,
  ClipboardCheck,
  UserCog,
  CalendarClock,
  Shield
} from "lucide-react";

export const SITE_CONFIG = {
  name: "VolunteerVerse",
  description: "Volunteer Data Management Platform",
  url: "http://localhost:3000", // Replace with your actual URL
  ogImage: "http://localhost:3000/og.jpg", // Replace with your actual OG image URL
  links: {
    github: "https://github.com/your-repo", // Replace with your GitHub repo
  },
  logo: Handshake,
};

export const APP_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Volunteers",
    href: "/app/volunteers",
    icon: Users,
  },
  {
    title: "Assignments",
    href: "/app/assignments",
    icon: CalendarClock,
  },
  {
    title: "Volunteer Assignments",
    href: "/app/volunteer-assignments",
    icon: CalendarClock,
  },
  {
    title: "User Management",
    href: "/app/user-management",
    icon: UserCog,
  },
  {
    title: "AI Chatbot", // Renamed from AI Tagging
    href: "/app/ai-tagging",
    icon: Sparkles,
  },
  {
    title: "T-Shirts",
    href: "/app/tshirts",
    icon: Shirt,
  },
  {
    title: "Check-in System",
    href: "/app/check-in",
    icon: ClipboardCheck,
  },
  {
    title: "My Profile",
    href: "/app/profile",
    icon: UserCog,
  },
];

