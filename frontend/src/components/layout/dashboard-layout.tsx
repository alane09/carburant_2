"use client"

import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useLayout } from "@/context/layout-context"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Bell, Search } from "lucide-react"
import { ReactNode } from "react"
import { CollapsibleSidebar } from "./collapsible-sidebar"
import { Logo } from "@/components/ui/logo"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isSidebarCollapsed } = useLayout()

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#171923]">
      {/* Sidebar */}
      <CollapsibleSidebar />

      {/* Main Content */}
      <div 
        style={{ 
          marginLeft: isSidebarCollapsed ? '80px' : '280px',
          width: isSidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)',
          transition: 'all 0.3s ease-in-out'
        }}
        className="flex flex-col"
      >
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#1A202C] px-4 shadow-sm">
          {/* Logo */}
          <div className="flex items-center">
            <Logo className="h-8" />
            <span className="text-lg font-semibold text-[#4B5563] dark:text-[#E2E8F0] hidden md:inline-block ml-2">
              Dashboard
            </span>
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] dark:text-[#718096]" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="h-10 w-64 rounded-md border border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] pl-10 pr-4 text-sm text-[#4B5563] dark:text-[#E2E8F0] placeholder:text-[#9CA3AF] dark:placeholder:text-[#718096] focus:border-[#4CAF50] dark:focus:border-[#48BB78] focus:outline-none focus:ring-1 focus:ring-[#4CAF50] dark:focus:ring-[#48BB78]"
              />
            </div>

            {/* Notifications */}
            <button className="relative rounded-full p-2 text-[#6B7280] hover:bg-[#F3F4F6] dark:text-[#A0AEC0] dark:hover:bg-[#2D3748]">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-[#4CAF50] dark:bg-[#48BB78]"></span>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile */}
            <button className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-[#4CAF50] dark:bg-[#48BB78] text-white flex items-center justify-center text-sm font-medium">
                AF
              </div>
              <span className="hidden text-sm font-medium text-[#4B5563] dark:text-[#E2E8F0] md:block">
                Admin
              </span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <motion.main 
          className="flex-1 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}