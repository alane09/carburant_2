import { cn } from "@/lib/utils"
import { ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface DashboardGridProps {
  children: ReactNode
  className?: string
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6",
      className
    )}>
      {children}
    </div>
  )
}

interface DashboardRowProps {
  children: ReactNode
  className?: string
  reversed?: boolean
}

export function DashboardRow({ 
  children, 
  className,
  reversed = false 
}: DashboardRowProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6",
      reversed && "lg:grid-flow-dense",
      className
    )}>
      {children}
    </div>
  )
}

interface DashboardSectionProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export function DashboardSection({ 
  title, 
  description, 
  children, 
  className,
  actions,
  collapsible = false,
  defaultCollapsed = false
}: DashboardSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <section 
      className={cn(
        "space-y-4 mb-8 animate-in fade-in-50 border border-border rounded-lg p-4", 
        className
      )}
      aria-labelledby={title ? title.toLowerCase().replace(/\s+/g, '-') : undefined}
    >
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            {title && (
              <h2 
                id={title.toLowerCase().replace(/\s+/g, '-')}
                className="text-xl font-semibold tracking-tight"
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            {collapsible && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                <span className="sr-only">{isCollapsed ? "Expand" : "Collapse"}</span>
              </Button>
            )}
          </div>
        </div>
      )}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
        )}
      >
        {children}
      </div>
    </section>
  )
}

interface DashboardContainerProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

export function DashboardContainer({ 
  children, 
  className,
  fullWidth = false
}: DashboardContainerProps) {
  return (
    <div className={cn(
      "w-full mx-auto px-4 sm:px-6 lg:px-8",
      !fullWidth && "max-w-[1440px]",
      className
    )}>
      {children}
    </div>
  )
}

interface DashboardSidebarProps {
  children: ReactNode
  className?: string
  sticky?: boolean
}

export function DashboardSidebar({
  children,
  className,
  sticky = false
}: DashboardSidebarProps) {
  return (
    <aside className={cn(
      "w-full md:w-64 lg:w-72 shrink-0",
      sticky && "md:sticky md:top-16 md:self-start md:h-[calc(100vh-4rem)]",
      className
    )}>
      <div className={cn(
        "space-y-4",
        sticky && "md:max-h-[calc(100vh-5rem)] md:overflow-auto md:pb-10"
      )}>
        {children}
      </div>
    </aside>
  )
}

interface DashboardContentProps {
  children: ReactNode
  className?: string
}

export function DashboardContent({
  children,
  className
}: DashboardContentProps) {
  return (
    <main className={cn(
      "flex-1 min-w-0",
      className
    )}>
      {children}
    </main>
  )
}

interface DashboardLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  className?: string
  sidebarPosition?: "left" | "right"
}

export function DashboardLayout({
  children,
  sidebar,
  className,
  sidebarPosition = "left"
}: DashboardLayoutProps) {
  return (
    <div className={cn(
      "flex flex-col md:flex-row gap-6",
      sidebarPosition === "right" && "md:flex-row-reverse",
      className
    )}>
      {sidebar && (
        <DashboardSidebar sticky>{sidebar}</DashboardSidebar>
      )}
      <DashboardContent>{children}</DashboardContent>
    </div>
  )
}
