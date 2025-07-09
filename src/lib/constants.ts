import type { NavItem } from "@/lib/types";
import {
  LayoutDashboard,
  Handshake,
  Shirt,
  UserCog,
  CalendarClock,
  Sparkles,
  ListChecks,
  BarChart2,
  AlertTriangle,
  Users,
} from "lucide-react";

export const SITE_CONFIG = {
  name: "Guru Pūrṇimā & Gītā Utsav Sēvā",
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
    title: "Assignments",
    href: "/app/assignments",
    icon: CalendarClock,
  },
  {
    title: "T-Shirts",
    href: "/app/tshirts",
    icon: Shirt,
  },
  {
    title: "Volunteers",
    href: "/app/volunteers",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Ask AI",
    href: "/app/ai-chat",
    icon: Sparkles,
  },
  {
    title: "Requirements",
    href: "/app/requirements",
    icon: ListChecks,
    adminOnly: true,
  },
  {
    title: "Reports",
    href: "/app/reports",
    icon: BarChart2,
    adminOnly: true,
  },
  {
    title: "Alerts & FAQs",
    href: "/app/admin/alerts-faqs",
    icon: AlertTriangle,
    adminOnly: true,
  },
  {
    title: "User Management",
    href: "/app/user-management",
    icon: UserCog,
    adminOnly: true,
  },
];

