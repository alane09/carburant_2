"use client"

import { useLayout } from "@/context/layout-context"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  FileText,
  History,
  Home,
  LineChart,
  Menu,
  Settings,
  Upload,
  X,
  Car,
} from "lucide-react"
// Import Logo component
import dynamic from 'next/dynamic'
import Image from "next/image"
import LOGO from "../../../public/COFICAB_LOGO .jpeg"
// Use dynamic import with SSR disabled to prevent hydration issues
const Logo = dynamic(() => import('@/components/ui/logo').then(mod => mod.Logo), {
  ssr: false,
})
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  className?: string
}

export function CollapsibleSidebar({ className }: SidebarProps) {
  const { isSidebarCollapsed, toggleSidebar } = useLayout()
  const pathname = usePathname()

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "Vehicules",
      href: "/analyse-vehicules",
      icon: <Car className="h-5 w-5" />,
    },
    {
      name: "Historique",
      href: "/historical",
      icon: <History className="h-5 w-5" />,
    },
    {
      name: "SER",
      href: "/ser",
      icon: <LineChart className="h-5 w-5" />,
    },
    {
      name: "Rapports",
      href: "/reports",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Upload",
      href: "/upload",
      icon: <Upload className="h-5 w-5" />,
    },
    {
      name: "Paramètres",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  // Use a consistent initial state for both server and client rendering
  // to prevent hydration mismatches
  return (
    <motion.div
      initial={false} // Disable initial animation to prevent hydration mismatch
      animate={{ width: isSidebarCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "fixed left-0 top-0 z-20 flex h-full flex-col border-r border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#1A202C] shadow-sm",
        className
      )}
      style={{
        width: "280px" // Use a fixed width for initial render to ensure consistency
      }}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {isSidebarCollapsed ? (
            <Logo iconOnly={true} className="h-8 w-8" />
          ) : (
            <>
              <Logo iconOnly={true} className="h-8 w-8" />
              <span className="text-lg font-bold text-[#2D3748] dark:text-[#F7FAFC]">
                COFICAB ENERGIX
              </span>
            </>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="ml-auto rounded-full p-2 text-[#6B7280] hover:bg-[#F3F4F6] dark:text-[#A0AEC0] dark:hover:bg-[#2D3748] transition-colors"
        >
          {isSidebarCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-[#F3F4F6] text-[#4CAF50] dark:bg-[#2D3748] dark:text-[#48BB78]"
                  : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#4CAF50] dark:text-[#A0AEC0] dark:hover:bg-[#2D3748] dark:hover:text-[#48BB78]"
              )}
            >
              <div className="mr-3 flex-shrink-0">{item.icon}</div>
              {!isSidebarCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-[#E5E7EB] dark:border-[#4A5568] p-4">
        {!isSidebarCollapsed && (
          <div className="text-xs text-[#6B7280] dark:text-[#A0AEC0]">
            <Image
            src={LOGO}
            alt="Logo"
            width={100}
            height={100}
            />      
                  
            <p>COFICAB ENERGIX</p>
            <p className="mt-1"> @2025 </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
