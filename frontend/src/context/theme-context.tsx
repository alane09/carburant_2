"use client"

import { useData } from "@/context/data-context"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { userPreferences, updateUserPreference } = useData()
  const [theme, setThemeState] = useState<Theme>(userPreferences.theme || "system")
  
  // Update theme when user preferences change
  useEffect(() => {
    setThemeState(userPreferences.theme)
  }, [userPreferences.theme])
  
  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement
    
    root.classList.remove("light", "dark")
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])
  
  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = () => {
      const root = window.document.documentElement
      const systemTheme = mediaQuery.matches ? "dark" : "light"
      
      root.classList.remove("light", "dark")
      root.classList.add(systemTheme)
    }
    
    mediaQuery.addEventListener("change", handleChange)
    
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme])
  
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    updateUserPreference("theme", newTheme)
  }
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  
  return context
}
