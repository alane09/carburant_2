'use client';

import { useState } from 'react';
import { useVehicles, useMonthlyAggregation } from '@/hooks/use-vehicles';
import { DashboardHeader } from './dashboard-header';
import { DashboardTabs } from './dashboard-tabs';
import { DashboardCharts } from './dashboard-charts';
import { DashboardTable } from './dashboard-table';
import { toast } from 'sonner';

export function DashboardContent() {
  const [year, setYear] = useState('all');
  const [type, setType] = useState('all');
  const [tab, setTab] = useState('overview');

  // Fetch data based on current filters
  const { data: vehicles, isLoading: isLoadingVehicles } = useVehicles({
    type: type !== 'all' ? type : undefined,
    mois: year !== 'all' ? year : undefined,
  });

  const { data: monthlyData, isLoading: isLoadingMonthly } = useMonthlyAggregation(
    type !== 'all' ? type : 'all'
  );

  // Handle filter changes
  const handleFilterChange = (newFilters: { year?: string; type?: string; tab?: string }) => {
    if (newFilters.year) setYear(newFilters.year);
    if (newFilters.type) setType(newFilters.type);
    if (newFilters.tab) setTab(newFilters.tab);
  };

  if (isLoadingVehicles || isLoadingMonthly) {
    return <div>Loading...</div>;
  }

  if (!vehicles || !monthlyData) {
    toast.error('Failed to load dashboard data');
    return <div>Error loading data</div>;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        year={year}
        type={type}
        onFilterChange={handleFilterChange}
      />
      
      <DashboardTabs
        activeTab={tab}
        onTabChange={(newTab) => handleFilterChange({ tab: newTab })}
      />
      
      <div className="grid gap-6">
        <DashboardCharts data={monthlyData} />
        <DashboardTable data={vehicles} />
      </div>
    </div>
  );
} 