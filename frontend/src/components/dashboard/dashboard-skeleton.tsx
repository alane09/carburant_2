"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex flex-wrap gap-3 mb-4 md:mb-0">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        
        <Skeleton className="h-9 w-28" />
      </div>
      
      {/* Metrics Skeleton */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[140px] w-full" />
        ))}
      </div>
      
      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-lg mx-auto" />
        
        {/* Charts Skeleton */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[380px] w-full" />
            <Skeleton className="h-[380px] w-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[380px] w-full" />
            <Skeleton className="h-[380px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
