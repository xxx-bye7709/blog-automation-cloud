// src/app/api/products/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_URL = 'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');
    const limit = searchParams.get('limit') || '20';

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: 'キーワードが必要です' },
        { status: 400 }
      );
    }

    // Firebase Functionsにリクエスト
    const response = await fetch(
      `${FIREBASE_URL}/searchProductsForDashboard?keyword=${encodeURIComponent(keyword)}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: '検索エラーが発生しました' },
      { status: 500 }
    );
  }
}

// src/app/api/products/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_URL = 'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Firebase Functionsにリクエスト
    const response = await fetch(
      `${FIREBASE_URL}/generateArticleFromDashboard`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { success: false, error: '記事生成エラーが発生しました' },
      { status: 500 }
    );
  }
}

// src/app/api/posts/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_URL = 'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

export async function POST(request: NextRequest) {
  try {
    const { endpoint, data } = await request.json();
    
    const response = await fetch(
      `${FIREBASE_URL}${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Generate post error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'エラーが発生しました' 
      },
      { status: 500 }
    );
  }
}

// src/app/api/metrics/route.ts
import { NextResponse } from 'next/server';

const FIREBASE_URL = 'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

export async function GET() {
  try {
    const response = await fetch(
      `${FIREBASE_URL}/getSystemMetrics`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Metrics fetch error:', error);
    return NextResponse.json(
      { 
        success: false,
        data: {
          totalPosts: 0,
          todayPosts: 0,
          successRate: 0,
          categories: {}
        }
      },
      { status: 500 }
    );
  }
}
