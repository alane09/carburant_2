"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardYearSelectorProps {
  onChange?: (year: string) => void;
  onYearChange?: (year: string) => void;
  selectedYear?: string;
  className?: string;
}

export function DashboardYearSelector({ onChange, onYearChange, selectedYear: propSelectedYear, className = "" }: DashboardYearSelectorProps) {
  const [internalSelectedYear, setInternalSelectedYear] = useState<string>("");
  const currentYear = new Date().getFullYear();
  
  // Use either prop value or internal state
  const selectedYear = propSelectedYear !== undefined ? propSelectedYear : internalSelectedYear;
  
  // Generate available years (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 4 + i).toString());
  
  // Set default year to current on component mount if no selectedYear prop is provided
  useEffect(() => {
    if (propSelectedYear === undefined && internalSelectedYear === "") {
      const defaultYear = currentYear.toString();
      setInternalSelectedYear(defaultYear);
      if (onChange) onChange(defaultYear);
      if (onYearChange) onYearChange(defaultYear);
    }
  }, [currentYear, internalSelectedYear, onChange, onYearChange, propSelectedYear]);
  
  // Handle year change
  const handleYearChange = (year: string) => {
    if (propSelectedYear === undefined) {
      setInternalSelectedYear(year);
    }
    if (onChange) onChange(year);
    if (onYearChange) onYearChange(year);
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <Calendar className="text-muted-foreground w-4 h-4 mr-2" />
      <Select value={selectedYear} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder="Année" />
        </SelectTrigger>
        <SelectContent>
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
