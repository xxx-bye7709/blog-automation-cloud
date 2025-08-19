import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
  'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(`${FIREBASE_FUNCTIONS_URL}/generateProductArticle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

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
  } catch (error: any) {
    console.error('Article generation error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - 記事生成に時間がかかっています。しばらくしてから再度お試しください。' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    );
  }
}
