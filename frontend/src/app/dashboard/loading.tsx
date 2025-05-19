"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white dark:bg-[#2D3748] shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-white dark:bg-[#2D3748] shadow-sm p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </div>
        
        <div className="rounded-lg border bg-white dark:bg-[#2D3748] shadow-sm p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
      
      <div className="rounded-lg border bg-white dark:bg-[#2D3748] shadow-sm p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2 border-b last:border-0">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
