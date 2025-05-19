"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string;
  description: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  footer?: React.ReactNode;
  className?: string;
}

export default function DashboardCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  footer,
  className,
}: DashboardCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="text-sm font-medium">{title}</div>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          <span>{description}</span>
          {trend && (
            <div className="ml-2 flex items-center">
              {trend === "up" ? (
                <TrendingUp className="mr-1 h-3 w-3 text-destructive" />
              ) : trend === "down" ? (
                <TrendingDown className="mr-1 h-3 w-3 text-emerald-500" />
              ) : null}
              <span
                className={cn({
                  "text-destructive": trend === "up",
                  "text-emerald-500": trend === "down",
                })}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
