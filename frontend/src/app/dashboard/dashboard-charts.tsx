'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyAggregation } from '@/types/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardChartsProps {
  data: MonthlyAggregation;
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  // Transform data for charts
  const chartData = Object.entries(data).map(([month, values]) => ({
    month,
    consommationL: values.totalConsommationL,
    consommationTEP: values.totalConsommationTEP,
    coutDT: values.totalCoutDT,
    kilometrage: values.totalKilometrage,
    produitsTonnes: values.totalProduitsTonnes,
    ipeL100km: values.averageIpeL100km,
    ipeL100TonneKm: values.averageIpeL100TonneKm,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Consumption (L)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="consommationL"
                  stroke="#8884d8"
                  name="Consumption (L)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost (DT)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="coutDT"
                  stroke="#82ca9d"
                  name="Cost (DT)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ipeL100km"
                  stroke="#ffc658"
                  name="IPE (L/100km)"
                />
                <Line
                  type="monotone"
                  dataKey="ipeL100TonneKm"
                  stroke="#ff8042"
                  name="IPE (L/100TonneKm)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 