"use client"

import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

const metricCardVariants = cva(
  "relative overflow-hidden rounded-lg border p-5 shadow-sm transition-all duration-300 hover:shadow-lg group",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-[#1E293B] border-l-4 border-l-primary border-t-0 border-r-[#E5E7EB] border-b-[#E5E7EB] dark:border-r-[#2D3748] dark:border-b-[#2D3748]",
        green: "bg-gradient-to-br from-white to-green-50 dark:from-[#1E293B] dark:to-green-900/10 border-l-4 border-l-green-500 border-t-0 border-r-[#E5E7EB] border-b-[#E5E7EB] dark:border-r-[#2D3748] dark:border-b-[#2D3748]",
        blue: "bg-gradient-to-br from-white to-blue-50 dark:from-[#1E293B] dark:to-blue-900/10 border-l-4 border-l-blue-500 border-t-0 border-r-[#E5E7EB] border-b-[#E5E7EB] dark:border-r-[#2D3748] dark:border-b-[#2D3748]",
        amber: "bg-gradient-to-br from-white to-amber-50 dark:from-[#1E293B] dark:to-amber-900/10 border-l-4 border-l-amber-500 border-t-0 border-r-[#E5E7EB] border-b-[#E5E7EB] dark:border-r-[#2D3748] dark:border-b-[#2D3748]",
        red: "bg-gradient-to-br from-white to-red-50 dark:from-[#1E293B] dark:to-red-900/10 border-l-4 border-l-red-500 border-t-0 border-r-[#E5E7EB] border-b-[#E5E7EB] dark:border-r-[#2D3748] dark:border-b-[#2D3748]",
        purple: "bg-gradient-to-br from-white to-purple-50 dark:from-[#1E293B] dark:to-purple-900/10 border-l-4 border-l-purple-500 border-t-0 border-r-[#E5E7EB] border-b-[#E5E7EB] dark:border-r-[#2D3748] dark:border-b-[#2D3748]",
        // Add flat style from previous implementation
        flat: "bg-white dark:bg-[#1A202C] border border-[#E5E7EB] dark:border-[#4A5568]",
      },
      size: {
        default: "w-full h-[140px]",
        sm: "w-full h-[120px]",
        lg: "w-full h-[180px]",
        auto: "w-full", // Auto height option
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface MetricCardProps extends VariantProps<typeof metricCardVariants> {
  title: string
  value: string | number
  unit?: string
  icon?: React.ReactNode
  description?: string
  trend?: {
    value: number
    label: string
  }
  className?: string
  sparklineData?: number[]
  delay?: number
  isLoading?: boolean
}

/**
 * MetricCard - Consolidated component that combines functionality from StatCard and KPICard
 * Used for displaying metrics/KPIs in dashboard views
 */
export function MetricCard({
  title,
  value,
  unit,
  icon,
  description,
  trend,
  variant,
  size,
  className,
  sparklineData,
  delay = 0,
  isLoading = false,
  ...props
}: MetricCardProps) {
  // Determine trend icon and color
  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value > 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400"><path d="m18 9-6-6-6 6"/><path d="M12 3v18"/></svg>
      );
    } else if (trend.value < 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400"><path d="m18 15-6 6-6-6"/><path d="M12 3v18"/></svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M5 12h14"/></svg>
      );
    }
  };
  
  const trendColor = trend
    ? trend.value > 0
      ? "text-green-600 dark:text-green-400"
      : trend.value < 0
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground"
    : "";
  
  // Render sparkline if data is provided
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min;
    const width = 100; // width of the sparkline
    const height = 30; // height of the sparkline
    
    // Generate points for the sparkline
    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="absolute bottom-3 right-3 opacity-30 group-hover:opacity-50 transition-opacity">
        <svg width={width} height={height} className="overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke={trend && trend.value >= 0 ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };
    
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.1 }}
      className={cn(metricCardVariants({ variant, size }), className)}
      {...props}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {icon && <span className="text-foreground/80 group-hover:text-primary transition-colors">{icon}</span>}
              {title}
            </h3>
            {trend && (
              <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", 
                trend.value > 0 ? "bg-green-100 dark:bg-green-900/20" : 
                trend.value < 0 ? "bg-red-100 dark:bg-red-900/20" : 
                "bg-gray-100 dark:bg-gray-800/30"
              )}>
                {getTrendIcon()}
                <span className={trendColor}>{Math.abs(trend.value)}%</span>
                {trend.label && <span className="text-muted-foreground ml-1">{trend.label}</span>}
              </div>
            )}
          </div>
          
          <div className="flex items-baseline">
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            {unit && <div className="ml-1 text-sm font-medium text-muted-foreground">{unit}</div>}
          </div>
          
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        
        {renderSparkline()}
      </div>
    </motion.div>
  )
}
