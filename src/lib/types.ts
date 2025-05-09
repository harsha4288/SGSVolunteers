
export interface Volunteer {
  id: string; // Adding an ID for unique identification
  timestamp: string;
  emailAddress: string;
  firstName: string;
  lastName: string;
  phone: string;
  sevaDates: string; // Could be parsed into Date[] later if needed
  location: string;
  otherLocation?: string;
  isGitaMahayajnaFamily: "Yes" | "No" | string; // Keep as string for flexibility from source
  associationWithMahayajna: string;
  mahayajnaStudentName?: string;
  batch?: string;
  hospitality: "Yes" | "No" | string;
  additionalInfo?: string;
  gender: "Male" | "Female" | "Other" | string;
  allEventDaysFullTime: "Yes" | "No" | string;
  volCategory: string; // Volunteer Category
  availability: {
    "8thJulyEvening": boolean;
    "9thJulyMorning": boolean;
    "9thJulyEvening": boolean;
    "9thJulyAllDay": boolean;
    "10thJulyMorning": boolean;
    "10thJulyEvening": boolean;
    "10thJulyAllDay": boolean;
    "11thJulyMorning": boolean;
    "11thJulyEvening": boolean;
    "11thJulyAllDay": boolean;
    "12thJulyMorning": boolean;
    "12thJulyEvening": boolean;
    "12thJulyAllDay": boolean;
  };
  totalVolunteering: string; // Total hours or days
  seva: string; // Type of service/task
  allDays: "Yes" | "No" | string;
  // Specific session flags are captured in availability object
  tags?: string[]; // For AI-generated tags
}

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  external?: boolean;
}
