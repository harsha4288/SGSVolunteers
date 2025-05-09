
"use client"

import type { FC, ReactNode } from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "light" | "dark"

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const initialState: ThemeProviderState = {
  theme: "system" as Theme, // Use "system" as a placeholder before hydration
  setTheme: () => null,
  toggleTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export const ThemeProvider: FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme === "system" ? "light" : defaultTheme; // Default to light on server if system
    }
    try {
      const storedTheme = localStorage.getItem(storageKey) as Theme | null
      if (storedTheme) {
        return storedTheme
      }
      return defaultTheme === "system" 
        ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" 
        : defaultTheme;
    } catch (e) {
      // Unsupported
      return defaultTheme === "system" ? "light" : defaultTheme;
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    let systemTheme: Theme = 'light';
    if (defaultTheme === "system") {
       systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
    }
    
    const currentTheme = theme === "system" ? systemTheme : theme;
    root.classList.add(currentTheme)

  }, [theme, defaultTheme])

  const setTheme = useCallback((newTheme: Theme) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, newTheme)
      } catch (e) {
        // Unsupported
      }
    }
    setThemeState(newTheme)
  }, [storageKey]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light")
  }, [theme, setTheme])

  // Effect to handle system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || defaultTheme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      // Only update if current theme is 'system' or effectively system
      if (theme === "system" || localStorage.getItem(storageKey) === "system") {
        setTheme(mediaQuery.matches ? "dark" : "light")
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [setTheme, defaultTheme, storageKey, theme])


  // This ensures that the theme is correctly set on the client after hydration
  // and avoids hydration mismatch if localStorage has a different theme than server default.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Re-evaluate theme after mount to ensure client-side value from localStorage is used
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    if (storedTheme) {
      setThemeState(storedTheme);
    } else if (defaultTheme === "system") {
      setThemeState(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } else {
      setThemeState(defaultTheme);
    }
  }, [storageKey, defaultTheme]);

  if (!mounted) {
    // Render null or a loading state until mounted to avoid hydration mismatch
    // Or, you can render children with a default theme class applied directly to body/html for SSR
    // For simplicity here, we assume children can handle a brief moment of un-themed content or a flash.
    // A better approach for SSR might involve a cookie or passing theme via server props.
     return <>{children}</>; // Or a loading spinner
  }


  return (
    <ThemeProviderContext.Provider {...props} value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
