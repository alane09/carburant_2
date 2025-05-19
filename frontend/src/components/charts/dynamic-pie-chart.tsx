"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface DynamicPieChartProps {
  data: any[];
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  unit?: string;
}

export default function DynamicPieChart({
  data,
  dataKey = "value",
  nameKey = "name",
  colors = [
    "#3B82F6", // blue-500
    "#10B981", // emerald-500
    "#F59E0B", // amber-500
    "#EF4444", // red-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
    "#06B6D4", // cyan-500
    "#F97316", // orange-500
  ],
  unit = "",
}: DynamicPieChartProps) {
  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-sm">{data[nameKey]}</p>
          <p className="text-base">
            <span className="font-medium">{data[dataKey].toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</span>
            {unit && <span> {unit}</span>}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          labelLine={true}
          label={({ name, percent }: { name: string; percent: number }) => 
            `${name}: ${(percent * 100).toFixed(1)}%`
          }
          outerRadius={100}
          innerRadius={40}
          paddingAngle={2}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
          animationDuration={1000}
          animationBegin={0}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]} 
              stroke="hsl(var(--background))" 
              strokeWidth={1} 
            />
          ))}
        </Pie>
        <Tooltip 
          content={<CustomTooltip />} 
          wrapperStyle={{ outline: 'none' }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          formatter={(value: string) => <span className="text-sm font-medium">{value}</span>}
          layout="horizontal"
          iconSize={10}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
