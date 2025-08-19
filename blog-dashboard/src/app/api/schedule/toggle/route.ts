import { NextResponse } from 'next/server';

const FIREBASE_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
  'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${FIREBASE_URL}/toggleSchedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Firebase returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Schedule toggle API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle schedule' },
      { status: 500 }
    );
  }
}
