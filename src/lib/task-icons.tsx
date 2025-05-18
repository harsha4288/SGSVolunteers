import {
  Users,
  HeartPulse,
  HelpCircle,
  Home,
  Utensils,
  Smartphone,
  BookMarked,
  Cookie,
  Ticket,
  ShieldCheck,
  Megaphone,
  Truck,
  Wrench,
  Mic2,
  Camera,
  Palette,
  Music,
  Shirt,
  Coffee,
  Leaf,
  Tent,
  Landmark,
  LucideIcon,
  LucideProps
} from "lucide-react";

// Interface for task icon configuration
export interface TaskIconConfig {
  icon: React.ComponentType<LucideProps>;
  color: string;
  darkColor: string;
  bgColor: string;
  darkBgColor: string;
  label: string;
}

// Map task names to their icon configurations
export const taskIcons: Record<string, TaskIconConfig> = {
  // Common tasks
  "Crowd Mgmt": {
    icon: Users,
    color: "#1e40af", // blue-800
    darkColor: "#60a5fa", // blue-400
    bgColor: "#dbeafe", // blue-100
    darkBgColor: "rgba(37, 99, 235, 0.2)", // blue-600 with opacity
    label: "CM"
  },
  "Health": {
    icon: HeartPulse,
    color: "#b91c1c", // red-800
    darkColor: "#f87171", // red-400
    bgColor: "#fee2e2", // red-100
    darkBgColor: "rgba(220, 38, 38, 0.2)", // red-600 with opacity
    label: "H"
  },
  "Helpdesk": {
    icon: HelpCircle,
    color: "#4338ca", // indigo-800
    darkColor: "#818cf8", // indigo-400
    bgColor: "#e0e7ff", // indigo-100
    darkBgColor: "rgba(79, 70, 229, 0.2)", // indigo-600 with opacity
    label: "HD"
  },
  "Hospitality": {
    icon: Home,
    color: "#7c2d12", // amber-900
    darkColor: "#fbbf24", // amber-400
    bgColor: "#fef3c7", // amber-100
    darkBgColor: "rgba(217, 119, 6, 0.2)", // amber-600 with opacity
    label: "HO"
  },
  "Maha Prasad": {
    icon: Utensils,
    color: "#065f46", // emerald-800
    darkColor: "#34d399", // emerald-400
    bgColor: "#d1fae5", // emerald-100
    darkBgColor: "rgba(5, 150, 105, 0.2)", // emerald-600 with opacity
    label: "MP"
  },
  "Mobile": {
    icon: Smartphone,
    color: "#3730a3", // violet-800
    darkColor: "#a78bfa", // violet-400
    bgColor: "#ede9fe", // violet-100
    darkBgColor: "rgba(124, 58, 237, 0.2)", // violet-600 with opacity
    label: "M"
  },
  "Reserve": {
    icon: BookMarked,
    color: "#1e3a8a", // blue-900
    darkColor: "#93c5fd", // blue-300
    bgColor: "#dbeafe", // blue-100
    darkBgColor: "rgba(37, 99, 235, 0.2)", // blue-600 with opacity
    label: "R"
  },
  "Snacks": {
    icon: Cookie,
    color: "#713f12", // yellow-900
    darkColor: "#facc15", // yellow-400
    bgColor: "#fef9c3", // yellow-100
    darkBgColor: "rgba(202, 138, 4, 0.2)", // yellow-600 with opacity
    label: "S"
  },
  "Tickets": {
    icon: Ticket,
    color: "#7e22ce", // purple-700
    darkColor: "#c084fc", // purple-400
    bgColor: "#f3e8ff", // purple-100
    darkBgColor: "rgba(147, 51, 234, 0.2)", // purple-600 with opacity
    label: "T"
  },
  "Security": {
    icon: ShieldCheck,
    color: "#134e4a", // teal-900
    darkColor: "#2dd4bf", // teal-400
    bgColor: "#ccfbf1", // teal-100
    darkBgColor: "rgba(13, 148, 136, 0.2)", // teal-600 with opacity
    label: "SE"
  },
  "Announcements": {
    icon: Megaphone,
    color: "#9f1239", // rose-800
    darkColor: "#fb7185", // rose-400
    bgColor: "#ffe4e6", // rose-100
    darkBgColor: "rgba(225, 29, 72, 0.2)", // rose-600 with opacity
    label: "A"
  },
  "Logistics": {
    icon: Truck,
    color: "#3f3f46", // zinc-700
    darkColor: "#a1a1aa", // zinc-400
    bgColor: "#f4f4f5", // zinc-100
    darkBgColor: "rgba(82, 82, 91, 0.2)", // zinc-600 with opacity
    label: "L"
  },
  "Technical": {
    icon: Wrench,
    color: "#374151", // gray-700
    darkColor: "#9ca3af", // gray-400
    bgColor: "#f3f4f6", // gray-100
    darkBgColor: "rgba(75, 85, 99, 0.2)", // gray-600 with opacity
    label: "TE"
  },
  "Audio": {
    icon: Mic2,
    color: "#701a75", // fuchsia-900
    darkColor: "#e879f9", // fuchsia-400
    bgColor: "#fae8ff", // fuchsia-100
    darkBgColor: "rgba(192, 38, 211, 0.2)", // fuchsia-600 with opacity
    label: "AU"
  },
  "Photography": {
    icon: Camera,
    color: "#0f172a", // slate-900
    darkColor: "#94a3b8", // slate-400
    bgColor: "#f1f5f9", // slate-100
    darkBgColor: "rgba(71, 85, 105, 0.2)", // slate-600 with opacity
    label: "PH"
  },
  "Decoration": {
    icon: Palette,
    color: "#831843", // pink-900
    darkColor: "#f472b6", // pink-400
    bgColor: "#fce7f3", // pink-100
    darkBgColor: "rgba(219, 39, 119, 0.2)", // pink-600 with opacity
    label: "DE"
  },
  "Cultural": {
    icon: Music,
    color: "#7f1d1d", // red-900
    darkColor: "#f87171", // red-400
    bgColor: "#fee2e2", // red-100
    darkBgColor: "rgba(220, 38, 38, 0.2)", // red-600 with opacity
    label: "CU"
  },
  "T-Shirts": {
    icon: Shirt,
    color: "#1e3a8a", // blue-900
    darkColor: "#93c5fd", // blue-300
    bgColor: "#dbeafe", // blue-100
    darkBgColor: "rgba(37, 99, 235, 0.2)", // blue-600 with opacity
    label: "TS"
  },
  "Refreshments": {
    icon: Coffee,
    color: "#78350f", // amber-900
    darkColor: "#fbbf24", // amber-400
    bgColor: "#fef3c7", // amber-100
    darkBgColor: "rgba(217, 119, 6, 0.2)", // amber-600 with opacity
    label: "RE"
  },
  "Garden": {
    icon: Leaf,
    color: "#14532d", // green-900
    darkColor: "#4ade80", // green-400
    bgColor: "#dcfce7", // green-100
    darkBgColor: "rgba(22, 163, 74, 0.2)", // green-600 with opacity
    label: "GA"
  },
  "Accommodation": {
    icon: Tent,
    color: "#713f12", // yellow-900
    darkColor: "#facc15", // yellow-400
    bgColor: "#fef9c3", // yellow-100
    darkBgColor: "rgba(202, 138, 4, 0.2)", // yellow-600 with opacity
    label: "AC"
  },
  "Registration": {
    icon: Landmark,
    color: "#1e40af", // blue-800
    darkColor: "#60a5fa", // blue-400
    bgColor: "#dbeafe", // blue-100
    darkBgColor: "rgba(37, 99, 235, 0.2)", // blue-600 with opacity
    label: "RG"
  }
};

// Function to get task icon config with fallback
export function getTaskIconConfig(taskName: string | undefined | null): TaskIconConfig {
  if (!taskName) {
    return {
      icon: HelpCircle,
      color: "#6b7280", // gray-500
      darkColor: "#9ca3af", // gray-400
      bgColor: "#f3f4f6", // gray-100
      darkBgColor: "rgba(75, 85, 99, 0.2)", // gray-600 with opacity
      label: "?"
    };
  }

  // Try to find an exact match
  if (taskIcons[taskName]) {
    return taskIcons[taskName];
  }

  // Try to find a partial match
  const partialMatch = Object.keys(taskIcons).find(key => 
    taskName.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(taskName.toLowerCase())
  );
  
  if (partialMatch) {
    return taskIcons[partialMatch];
  }

  // Create a fallback based on the first two letters
  const label = taskName.length > 1 
    ? `${taskName[0].toUpperCase()}${taskName[1].toLowerCase()}`
    : taskName[0].toUpperCase();

  return {
    icon: HelpCircle,
    color: "#6b7280", // gray-500
    darkColor: "#9ca3af", // gray-400
    bgColor: "#f3f4f6", // gray-100
    darkBgColor: "rgba(75, 85, 99, 0.2)", // gray-600 with opacity
    label
  };
}
