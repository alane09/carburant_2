"use client"

import { Line, Bar, Pie } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
)

// Enhanced color palette with better contrast and accessibility
const CHART_COLORS = {
  primary: [
    '#1E40AF', // Deep Blue
    '#B91C1C', // Deep Red
    '#166534', // Deep Green
    '#6B21A8', // Deep Purple
    '#C2410C', // Deep Orange
    '#0F766E', // Deep Teal
    '#9D174D', // Deep Pink
    '#3730A3', // Deep Indigo
    '#854D0E', // Deep Amber
    '#065F46', // Deep Emerald
    '#5B21B6', // Deep Violet
    '#9F1239', // Deep Rose
  ],
  hover: [
    '#1E3A8A', // Darker Blue
    '#991B1B', // Darker Red
    '#14532D', // Darker Green
    '#581C87', // Darker Purple
    '#9A3412', // Darker Orange
    '#0D5D5A', // Darker Teal
    '#831843', // Darker Pink
    '#312E81', // Darker Indigo
    '#713F12', // Darker Amber
    '#064E3B', // Darker Emerald
    '#4C1D95', // Darker Violet
    '#881337', // Darker Rose
  ],
  background: [
    '#DBEAFE', // Light Blue
    '#FEE2E2', // Light Red
    '#DCFCE7', // Light Green
    '#F3E8FF', // Light Purple
    '#FFEDD5', // Light Orange
    '#CCFBF1', // Light Teal
    '#FCE7F3', // Light Pink
    '#E0E7FF', // Light Indigo
    '#FEF3C7', // Light Amber
    '#D1FAE5', // Light Emerald
    '#EDE9FE', // Light Violet
    '#FCE7F3', // Light Rose
  ]
};

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
  }[]
}

interface ChartProps {
  data: ChartData
  title: string
  options?: ChartOptions<'pie' | 'line' | 'bar'>
}

export function LineChart({ data, title, options }: ChartProps) {
  // Sort data chronologically if labels are months
  const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const sortedData = {
    ...data,
    labels: data.labels.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)),
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      borderColor: CHART_COLORS.primary[index % CHART_COLORS.primary.length],
      backgroundColor: CHART_COLORS.primary[index % CHART_COLORS.primary.length],
      tension: 0.4, // Smooth curve
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
      fill: false
    }))
  };

  return (
    <div className="w-full h-[300px] bg-white rounded-lg shadow-md p-4">
      <Line
        data={sortedData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: title,
              font: {
                size: 16,
                weight: 'bold'
              },
              padding: 20
            },
            legend: {
              position: 'top' as const,
              labels: {
                usePointStyle: true,
                padding: 20
              }
            },
            tooltip: {
              position: 'nearest',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              padding: 12,
              cornerRadius: 4,
              displayColors: true
            },
            ...options?.plugins,
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          }
        }}
      />
    </div>
  )
}

export function BarChart({ data, title, options }: ChartProps) {
  // Sort data chronologically if labels are months
  const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const sortedData = {
    ...data,
    labels: data.labels.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)),
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: CHART_COLORS.primary[index % CHART_COLORS.primary.length],
      borderColor: CHART_COLORS.primary[index % CHART_COLORS.primary.length],
      hoverBackgroundColor: CHART_COLORS.hover[index % CHART_COLORS.hover.length],
      borderWidth: 2,
      borderRadius: 6,
      barPercentage: 0.8,
      categoryPercentage: 0.9,
    }))
  };

  return (
    <div className="w-full h-[300px] bg-white rounded-lg shadow-md p-4">
      <Bar
        data={sortedData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: title,
              font: {
                size: 16,
                weight: 'bold'
              },
              padding: 20
            },
            legend: {
              position: 'top' as const,
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  weight: 'bold'
                }
              }
            },
            tooltip: {
              position: 'nearest',
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13,
                weight: 'bold'
              },
              padding: 12,
              cornerRadius: 6,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
                }
              }
            },
            ...options?.plugins,
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  weight: 'bold'
                }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                font: {
                  weight: 'bold'
                },
                callback: function(value) {
                  return value.toLocaleString();
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }}
      />
    </div>
  )
}

export function PieChart({ data, title, options }: ChartProps) {
  // Apply distinct colors to the data
  const coloredData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: CHART_COLORS.primary,
      borderColor: '#FFFFFF',
      borderWidth: 2,
    }))
  };

  // Split labels into two rows
  const firstRowLabels = data.labels.slice(0, 6);
  const secondRowLabels = data.labels.slice(6);

  return (
    <div className="w-full h-[400px] bg-white rounded-lg shadow-md p-4">
      <div className="h-[300px]">
        <Pie
          data={coloredData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                bottom: 100 // Add padding for the labels below
              }
            },
            plugins: {
              title: {
                display: true,
                text: title,
                font: {
                  size: 16,
                  weight: 'bold'
                }
              },
              legend: {
                display: false // Hide the default legend
              },
              datalabels: {
                display: false // Hide the percentage labels on the pie
              },
              tooltip: {
                position: 'nearest',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: {
                  size: 14,
                  weight: 'bold'
                },
                bodyFont: {
                  size: 13
                },
                padding: 12,
                cornerRadius: 4,
                displayColors: true
              },
              ...options?.plugins,
            },
          }}
        />
      </div>
      
      {/* Custom legend with two rows */}
      <div className="flex flex-col gap-4 mt-4">
        {/* First row */}
        <div className="flex justify-center gap-6">
          {firstRowLabels.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: CHART_COLORS.primary[index] }}
              />
              <span className="text-sm font-medium" style={{ color: CHART_COLORS.primary[index] }}>
                {label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Second row */}
        <div className="flex justify-center gap-6">
          {secondRowLabels.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: CHART_COLORS.primary[index + 6] }}
              />
              <span className="text-sm font-medium" style={{ color: CHART_COLORS.primary[index + 6] }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 