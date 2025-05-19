"use client"

import { useEffect } from "react"

export function HomeClient() {
  useEffect(() => {
    // Redirect to dashboard on client-side using window.location
    window.location.href = "/dashboard"
  }, [])
  
  // Return a loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Redirection vers le tableau de bord...</p>
    </div>
  )
}
