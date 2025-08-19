import { NextResponse } from 'next/server';

const FIREBASE_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
  'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

export async function GET() {
  try {
    const response = await fetch(`${FIREBASE_URL}/getSchedule`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Firebase returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Schedule get API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get schedule' },
      { status: 500 }
    );
  }
}
