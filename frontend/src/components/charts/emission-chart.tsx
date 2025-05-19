"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface EmissionChartProps {
  data: Array<{
    month: string;
    value: number;
  }>;
  title?: string;
  className?: string;
}

export function EmissionChart({ data, title, className }: EmissionChartProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const textColor = theme === "dark" ? "#94a3b8" : "#64748b";
  const gridColor = theme === "dark" ? "#334155" : "#e2e8f0";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title || "Émissions CO2"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="line" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="line">Évolution</TabsTrigger>
            <TabsTrigger value="bar">Comparaison</TabsTrigger>
          </TabsList>
          <TabsContent value="line" className="mt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="month"
                    stroke={textColor}
                    tick={{ fill: textColor }}
                  />
                  <YAxis
                    stroke={textColor}
                    tick={{ fill: textColor }}
                    label={{
                      value: "kg CO2",
                      angle: -90,
                      position: "insideLeft",
                      fill: textColor,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                      border: `1px solid ${gridColor}`,
                    }}
                    labelStyle={{ color: textColor }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="bar" className="mt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="month"
                    stroke={textColor}
                    tick={{ fill: textColor }}
                  />
                  <YAxis
                    stroke={textColor}
                    tick={{ fill: textColor }}
                    label={{
                      value: "kg CO2",
                      angle: -90,
                      position: "insideLeft",
                      fill: textColor,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                      border: `1px solid ${gridColor}`,
                    }}
                    labelStyle={{ color: textColor }}
                  />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 