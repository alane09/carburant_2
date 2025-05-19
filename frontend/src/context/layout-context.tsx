"use client"

import { useData } from "@/context/data-context"
import { createContext, useContext, useEffect, useState } from "react"

interface LayoutContextType {
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  visibleCards: string[]
  toggleCardVisibility: (cardId: string) => void
  setVisibleCards: (cards: string[]) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const { userPreferences, updateUserPreference } = useData()
  
  // Always start with a consistent state for server-side rendering
  // This prevents hydration mismatches
  const [isSidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(false)
  
  const [visibleCards, setVisibleCardsState] = useState<string[]>(
    userPreferences.dashboardLayout?.visibleCards || [
      "consumption",
      "efficiency",
      "emissions",
      "cost",
    ]
  )
  
  // Update layout when user preferences change
  useEffect(() => {
    setSidebarCollapsedState(userPreferences.dashboardLayout?.collapsedSidebar || false)
    setVisibleCardsState(
      userPreferences.dashboardLayout?.visibleCards || [
        "consumption",
        "efficiency",
        "emissions",
        "cost",
      ]
    )
  }, [userPreferences.dashboardLayout])
  
  // Initialize sidebar state when component mounts and sync with user preferences
  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined') return;
    
    // Get the user preference for sidebar state
    const preferredState = userPreferences.dashboardLayout?.collapsedSidebar || false;
    
    // Update the state if it doesn't match the preference
    if (isSidebarCollapsed !== preferredState) {
      setSidebarCollapsedState(preferredState);
    }
    
    // Apply the sidebar-collapsed class based on the preference
    if (preferredState) {
      document.documentElement.classList.add('sidebar-collapsed')
      document.documentElement.style.setProperty('--sidebar-width', '80px')
    } else {
      document.documentElement.classList.remove('sidebar-collapsed')
      document.documentElement.style.setProperty('--sidebar-width', '280px')
    }
  }, [userPreferences.dashboardLayout?.collapsedSidebar]) // Run when the preference changes
  
  const toggleSidebar = () => {
    const newValue = !isSidebarCollapsed
    setSidebarCollapsedState(newValue)
    
    // Update user preferences
    updateUserPreference("dashboardLayout", {
      ...userPreferences.dashboardLayout,
      collapsedSidebar: newValue,
    })
    
    // Add or remove the sidebar-collapsed class to the document for CSS selectors
    if (newValue) {
      document.documentElement.classList.add('sidebar-collapsed')
      document.documentElement.style.setProperty('--sidebar-width', '80px')
    } else {
      document.documentElement.classList.remove('sidebar-collapsed')
      document.documentElement.style.setProperty('--sidebar-width', '280px')
    }
  }
  
  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed)
    updateUserPreference("dashboardLayout", {
      ...userPreferences.dashboardLayout,
      collapsedSidebar: collapsed,
    })
    
    // Add or remove the sidebar-collapsed class to the document for CSS selectors
    if (collapsed) {
      document.documentElement.classList.add('sidebar-collapsed')
      document.documentElement.style.setProperty('--sidebar-width', '80px')
    } else {
      document.documentElement.classList.remove('sidebar-collapsed')
      document.documentElement.style.setProperty('--sidebar-width', '280px')
    }
  }
  
  const toggleCardVisibility = (cardId: string) => {
    const newVisibleCards = visibleCards.includes(cardId)
      ? visibleCards.filter((id) => id !== cardId)
      : [...visibleCards, cardId]
    
    setVisibleCardsState(newVisibleCards)
    updateUserPreference("dashboardLayout", {
      ...userPreferences.dashboardLayout,
      visibleCards: newVisibleCards,
    })
  }
  
  const setVisibleCards = (cards: string[]) => {
    setVisibleCardsState(cards)
    updateUserPreference("dashboardLayout", {
      ...userPreferences.dashboardLayout,
      visibleCards: cards,
    })
  }
  
  return (
    <LayoutContext.Provider
      value={{
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        visibleCards,
        toggleCardVisibility,
        setVisibleCards,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider")
  }
  
  return context
}
