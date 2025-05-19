'use client';

import { useVehicleTypes } from '@/hooks/use-vehicles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DashboardHeaderProps {
  year: string;
  type: string;
  onFilterChange: (filters: { year?: string; type?: string }) => void;
}

export function DashboardHeader({ year, type, onFilterChange }: DashboardHeaderProps) {
  const { data: vehicleTypesRaw } = useVehicleTypes();
  const vehicleTypes = Array.isArray(vehicleTypesRaw) ? vehicleTypesRaw : [];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => (currentYear - i).toString());
  const vehicleTypeOptions = vehicleTypes.map((t) => ({ label: t, value: t }));

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analyse du parc</h2>
        <p className="text-muted-foreground">Filtrer par année et type de véhicule</p>
      </div>
      <div className="flex gap-2">
        <Select value={year} onValueChange={(v) => onFilterChange({ year: v })}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y === 'all' ? 'Toutes' : y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => onFilterChange({ type: v })}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {vehicleTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 