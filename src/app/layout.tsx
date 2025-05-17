
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google'; // Using Inter as a common sans-serif font
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { DateOverrideProvider } from '@/components/providers/date-override-provider';
import { Toaster } from "@/components/ui/toaster"; // Shadcn Toaster
import { SITE_CONFIG } from '@/lib/constants';

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-geist-sans", // Keeping var name for potential Geist compatibility from globals
});

export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  // Add more metadata as needed, like icons, openGraph, etc.
  icons: {
    icon: "/favicon.ico", // Placeholder, ensure you have a favicon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider
          storageKey="volunteerverse-theme"
          defaultTheme="system"
        >
          <DateOverrideProvider>
            {children}
            <Toaster />
          </DateOverrideProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// Modified ThemeProvider props for compatibility with typical next-themes setup:
// attribute="class" -> applies theme class to <html>
// defaultTheme="system" -> uses system preference
// enableSystem -> allows system preference
// disableTransitionOnChange -> prevents style flashing on theme change
// If using custom ThemeProvider, adjust props accordingly. The current custom ThemeProvider uses localStorage.
// The provided ThemeProvider from theme-provider.tsx will manage this via its internal logic.
// We can simplify the ThemeProvider props here if using the custom one:
// <ThemeProvider defaultTheme="system" storageKey="volunteerverse-theme">
// The custom provider handles 'attribute' by directly manipulating document.documentElement.classList
// and 'enableSystem' / 'disableTransitionOnChange' are not direct props but concepts handled within its logic.

