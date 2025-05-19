"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReactNode } from "react"
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface TrendData {
  value: number
  label: string
  direction: "up" | "down" | "neutral"
}

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: TrendData
  isLoading?: boolean
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  isLoading = false,
}: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {isLoading ? <Skeleton className="h-4 w-32" /> : title}
        </CardTitle>
        {icon && (
          isLoading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              {icon}
            </div>
          )
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-28" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{description}</p>
              
              {trend && (
                <div className="flex items-center gap-1 text-xs font-medium">
                  <span
                    className={cn(
                      "flex items-center",
                      trend.direction === "up" && "text-emerald-600 dark:text-emerald-500",
                      trend.direction === "down" && "text-rose-600 dark:text-rose-500",
                      trend.direction === "neutral" && "text-amber-600 dark:text-amber-500"
                    )}
                  >
                    {trend.direction === "up" && <ArrowUp className="h-3 w-3 mr-1" />}
                    {trend.direction === "down" && <ArrowDown className="h-3 w-3 mr-1" />}
                    {trend.direction === "neutral" && <ArrowRight className="h-3 w-3 mr-1" />}
                    {trend.value !== 0 ? `${trend.value}%` : "--"}
                  </span>
                  <span className="text-muted-foreground">{trend.label}</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}