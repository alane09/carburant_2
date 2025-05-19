"use client";

import { Suspense } from 'react';
import { DashboardContent } from './dashboard-content';
import { DashboardSkeleton } from './dashboard-skeleton';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}


