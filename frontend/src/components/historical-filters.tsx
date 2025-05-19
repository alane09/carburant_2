'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HistoricalFiltersProps {
  onRegionChange: (region: string) => void;
  onYearChange: (year: string) => void;
}

export function HistoricalFilters({ onRegionChange, onYearChange }: HistoricalFiltersProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const regionsList = [
    'all',
    'Tunis',
    'Mjez Elbeb',
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => (currentYear - i).toString());

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    onRegionChange(value);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    onYearChange(value);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <Select value={selectedRegion} onValueChange={handleRegionChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select region" />
        </SelectTrigger>
        <SelectContent>
          {regionsList.map((region) => (
            <SelectItem key={region} value={region}>
              {region === 'all' ? 'All Regions' : region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedYear} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 