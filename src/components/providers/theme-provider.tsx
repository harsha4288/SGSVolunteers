
"use client"

import type { FC, ReactNode } from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  resolvedTheme: "light", // Default to light before hydration
  setTheme: () => null,
  toggleTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export const ThemeProvider: FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "system",
  storageKey = "guru-purnima-gita-utsav-seva-theme", // Updated storageKey
  ...props
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }
    try {
      return (localStorage.getItem(storageKey) as Theme | null) || defaultTheme;
    } catch (e) {
      return defaultTheme;
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
     if (typeof window === "undefined") return "light"; // Sensible default for SSR
     const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
     if (theme === "system") return systemPreference;
     return theme;
  });
  

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const currentEffectiveTheme = theme === "system" ? systemPreference : theme;

    root.classList.remove("light", "dark");
    root.classList.add(currentEffectiveTheme);
    setResolvedTheme(currentEffectiveTheme);

    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {
      // Local storage might be disabled
    }
  }, [theme, storageKey]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    // If current theme is system, toggle based on resolved system theme
    // Otherwise, toggle between light and dark
    const currentEffectiveTheme = theme === "system" 
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;

    setTheme(currentEffectiveTheme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  // Effect to handle system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") { // Only update if the user preference is 'system'
        const newSystemPreference = mediaQuery.matches ? "dark" : "light";
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(newSystemPreference);
        setResolvedTheme(newSystemPreference);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]); // Rerun if theme changes (e.g., from system to light/dark)


  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Ensure client-side theme is fully resolved after mount
    const storedTheme = (localStorage.getItem(storageKey) as Theme | null) || defaultTheme;
    setThemeState(storedTheme);
    
    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setResolvedTheme(storedTheme === "system" ? systemPreference : storedTheme);

  }, [storageKey, defaultTheme]);

  if (!mounted) {
     // To prevent hydration mismatch, render children, but theme application is handled by useEffect.
     // The <html> tag will not have a theme class SSR, but will get it on client mount.
     // suppressHydrationWarning on <html> helps here.
    return <>{children}</>;
  }

  return (
    <ThemeProviderContext.Provider {...props} value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  // Return 'resolvedTheme' for components that need the actual light/dark value
  // 'theme' can be used if needing to know if 'system' is selected.
  return context;
}

