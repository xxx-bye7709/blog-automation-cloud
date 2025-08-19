import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
  'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('API Route: searchProducts called with:', body);
    
    const response = await fetch(`${FIREBASE_FUNCTIONS_URL}/searchProducts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firebase function error:', errorText);
      return NextResponse.json(
        { error: `Firebase function error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
