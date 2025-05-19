import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { InfoIcon, MoreHorizontal, RotateCcw } from "lucide-react"
import { ReactNode, useState } from "react"

/**
 * Consolidated ChartCard component
 * Combines features from both implementations in src/components/dashboard and src/app/dashboard
 */
interface ChartCardProps {
  title: string
  description?: string
  className?: string
  children: ReactNode
  action?: ReactNode
  actions?: ReactNode // Alternative name used in app/dashboard implementation
  isLoading?: boolean
  delay?: number
  isEmpty?: boolean
  emptyMessage?: string
  onRefresh?: () => void
  infoTooltip?: string
}

export function ChartCard({
  title,
  description,
  className,
  children,
  action,
  actions, // Support both action and actions prop
  isLoading = false,
  delay = 0,
  isEmpty = false,
  emptyMessage = "Aucune donnée disponible",
  onRefresh,
  infoTooltip,
}: ChartCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Use either action or actions prop (actions has priority)
  const actionContent = actions || action;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: delay * 0.1,
        ease: [0.22, 1, 0.36, 1] // easeOutQuart
      }}
      className={cn("h-full", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={cn(
        "h-full relative border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] transition-all duration-300",
        "hover:shadow-md overflow-hidden",
        isHovered ? "shadow-md" : "shadow-sm"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-[#2D3748] dark:text-[#F7FAFC]">
                {title}
              </CardTitle>
              
              {infoTooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon size={16} className="text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">{infoTooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button 
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full hover:bg-muted/80"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <RotateCcw 
                    size={16} 
                    className={cn(
                      "text-muted-foreground",
                      isLoading && "animate-spin"
                    )}
                  />
                  <span className="sr-only">Actualiser</span>
                </Button>
              )}
              {action}
            </div>
          </div>
          {description && (
            <CardDescription className="text-sm text-[#6B7280] dark:text-[#A0AEC0] mt-1">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={cn(
          "p-0 h-[calc(100%-60px)] transition-all duration-300",
          isLoading ? "opacity-50" : "opacity-100"
        )}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4CAF50] dark:border-[#48BB78]"></div>
            </div>
          ) : isEmpty ? (
            <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30 mb-3">
                <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
              </svg>
              <p className="text-muted-foreground font-medium">{emptyMessage}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Essayez de modifier les filtres</p>
              
              {onRefresh && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefresh}
                  className="mt-3"
                >
                  <RotateCcw size={14} className="mr-1" /> 
                  Actualiser
                </Button>
              )}
            </div>
          ) : (
            <div className="h-full w-full">
              {children}
            </div>
          )}
        </CardContent>
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-pulse" />
        )}
      </Card>
    </motion.div>
  )
}
