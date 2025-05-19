"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
    BarChart3,
    FileSpreadsheet,
    History,
    LineChart,
    Menu,
    Settings,
    UploadCloud,
    Gauge,
    Fuel,
    TrendingDown,
    Leaf,
    X,
    Car
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  description: string
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <BarChart3 className="h-5 w-5" />,
    description: "Overview of key metrics and KPIs"
  },
  {
    title: "Vehicle Tracking",
    href: "/vehicle-tracking",
    icon: <Car className="h-5 w-5" />,
    description: "Detailed vehicle performance tracking"
  },
  {
    title: "Fuel Usage",
    href: "/historical",
    icon: <Fuel className="h-5 w-5" />,
    description: "Track fuel consumption history"
  },
  {
    title: "Efficiency",
    href: "/ser",
    icon: <Gauge className="h-5 w-5" />,
    description: "Energy efficiency metrics and analysis"
  },
  {
    title: "Carbon Impact",
    href: "/reports",
    icon: <Leaf className="h-5 w-5" />,
    description: "Environmental impact reports"
  },
  {
    title: "Cost Analysis",
    href: "/reports",
    icon: <TrendingDown className="h-5 w-5" />,
    description: "Financial metrics and cost savings"
  },
  {
    title: "Import Data",
    href: "/upload",
    icon: <UploadCloud className="h-5 w-5" />,
    description: "Upload new fuel consumption data"
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    description: "Application configuration"
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12 border-r border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] shadow-sm transition-colors duration-300", className)}>
      <div className="space-y-6 py-6">
        <div className="px-3 py-2">
          <div className="flex items-center px-4 mb-6">
            <Fuel className="h-6 w-6 text-[#4CAF50] dark:text-[#48BB78] mr-2" />
            <h2 className="text-xl font-bold tracking-tight text-[#2D3748] dark:text-[#F7FAFC]">
              EnergyTrack
            </h2>
          </div>
          
          <div className="space-y-1 mt-6">
            {navItems.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-[#F3F4F6] dark:hover:bg-[#374151] hover:text-[#4CAF50] dark:hover:text-[#48BB78]",
                    pathname === item.href
                      ? "bg-[#F3F4F6] dark:bg-[#374151] text-[#4CAF50] dark:text-[#48BB78] font-semibold"
                      : "text-[#2D3748] dark:text-[#F7FAFC]"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-md",
                    pathname === item.href
                      ? "bg-[#4CAF50]/10 dark:bg-[#48BB78]/20"
                      : ""  
                  )}>
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden transition-transform hover:scale-110 duration-300"
        >
          <Menu className="h-5 w-5 text-[#2D3748] dark:text-[#F7FAFC]" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 border-r-0 bg-white dark:bg-[#2D3748]">
        <div className="p-6 flex justify-between items-center border-b border-[#E5E7EB] dark:border-[#4A5568]">
          <div className="flex items-center">
            <Fuel className="h-5 w-5 text-[#4CAF50] dark:text-[#48BB78] mr-2" />
            <h3 className="text-lg font-bold text-[#2D3748] dark:text-[#F7FAFC]">
              EnergyTrack
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="rounded-full transition-transform hover:scale-110 duration-300"
          >
            <X className="h-5 w-5 text-[#2D3748] dark:text-[#F7FAFC]" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="space-y-4 py-6">
            <div className="px-4 py-2">
              <div className="space-y-2">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-[#F3F4F6] dark:hover:bg-[#374151]",
                        pathname === item.href
                          ? "bg-[#F3F4F6] dark:bg-[#374151] text-[#4CAF50] dark:text-[#48BB78] font-semibold"
                          : "text-[#2D3748] dark:text-[#F7FAFC]"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-md",
                        pathname === item.href
                          ? "bg-[#4CAF50]/10 dark:bg-[#48BB78]/20"
                          : ""  
                      )}>
                        {item.icon}
                      </div>
                      <span>{item.title}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}