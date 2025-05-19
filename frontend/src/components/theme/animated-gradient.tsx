"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface AnimatedGradientProps {
  className?: string
}

export function AnimatedGradient({ className }: AnimatedGradientProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Prevent hydration mismatch by only showing after component has mounted
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Don't render the gradient if the component hasn't mounted yet or if theme is light
  if (!mounted || theme === 'light') {
    return null
  }

  return (
    <div 
      className={cn(
        "fixed inset-0 -z-10 opacity-40 bg-gradient-to-br animate-gradient-shift",
        className
      )}
    >
      {/* Blurred gradient blobs */}
      <div className="absolute top-0 -left-4 h-72 w-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
      <div className="absolute top-0 -right-4 h-72 w-72 bg-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-32 left-20 h-72 w-72 bg-teal-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
    </div>
  )
}