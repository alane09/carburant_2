"use client";

import ChartErrorBoundary from "@/components/charts/chart-error-boundary";
import EmptyState from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  height?: number;
}

export default function ChartContainer({
  title,
  children,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "Aucune donnée disponible",
  className,
  header,
  footer,
  height = 250,
}: ChartContainerProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {header}
      </CardHeader>
      <CardContent className="px-2">
        <ChartErrorBoundary>
          <div style={{ height: `${height}px` }}>
            {isLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isEmpty ? (
              <EmptyState message={emptyMessage} />
            ) : (
              children
            )}
          </div>
        </ChartErrorBoundary>
        {footer}
      </CardContent>
    </Card>
  );
}
