import { NextResponse } from 'next/server';

const FIREBASE_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
  'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

export async function GET() {
  try {
    // getSystemMetricsまたはgetStats
    const response = await fetch(`${FIREBASE_URL}/getSystemMetrics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Firebase returned ${response.status}`);
    }

    const data = await response.json();
    console.log('Metrics data:', data);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Metrics API error:', error);
    // デフォルト値を返す
    return NextResponse.json({
      todayCount: 0,
      weekCount: 0,
      monthCount: 0,
      totalCount: 0,
      lastPost: null,
      systemStatus: 'error'
    });
  }
}
