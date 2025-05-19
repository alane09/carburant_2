import { NextResponse } from 'next/server';
import { VehicleAPI } from '@/lib/api';

// Revalidate every 10 minutes
export const revalidate = 600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  try {
    // Get performance data
    const performanceData = await VehicleAPI.getPerformanceData({
      vehicleType: type,
      year: year || undefined,
      month: month || undefined
    });

    // Get vehicle records for the selected type and year
    const records = await VehicleAPI.getRecords({
      type: type !== 'all' ? type : undefined,
      year: year || undefined,
      mois: month || undefined,
      limit: 100, // Limit the number of records to avoid performance issues
    });

    // Get monthly aggregation data for charts
    const monthlyData = await VehicleAPI.getMonthlyAggregation({
      vehicleType: type,
      year: year || undefined
    });

    return NextResponse.json({
      success: true,
      data: {
        performance: performanceData,
        records: records,
        monthlyData: monthlyData
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
