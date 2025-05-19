"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface LogoProps {
  className?: string
  iconOnly?: boolean
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which logo to use based on theme and iconOnly prop
  const getLogoSrc = () => {
    const isDark = resolvedTheme === 'dark'
    
    if (iconOnly) {
      return isDark ? '/images/coficab-icon-dark.svg' : '/images/coficab-icon-light.svg'
    } else {
      return isDark ? '/images/coficab-logo-dark.svg' : '/images/coficab-logo-light.svg'
    }
  }

  // During SSR or before hydration, use a default logo to prevent mismatch
  if (!mounted) {
    return (
      <div className={cn("flex items-center", className)}>
        <img 
          src={iconOnly ? "/images/coficab-icon-light.svg" : "/images/coficab-logo-light.svg"} 
          alt="COFICAB ENERGIX Dashboard" 
          className={cn("w-auto transition-all duration-200", iconOnly ? "h-8" : "h-10")} 
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src={getLogoSrc()} 
        alt="COFICAB ENERGIX Dashboard" 
        className={cn("w-auto transition-all duration-200", iconOnly ? "h-8" : "h-10")} 
      />
    </div>
  );
}
