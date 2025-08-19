import { NextResponse } from 'next/server';

const FIREBASE_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
  'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

// GETメソッドを正しくエクスポート
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    
    console.log('Product search for:', query);
    
    if (!query) {
      return NextResponse.json({ 
        products: [],
        message: '検索キーワードを入力してください' 
      });
    }
    
    // Firebase Functionsへのリクエスト
    const firebaseUrl = `${FIREBASE_URL}/searchProductsForDashboard?keyword=${encodeURIComponent(query)}`;
    console.log('Calling Firebase:', firebaseUrl);
    
    const response = await fetch(firebaseUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Firebase error:', response.status);
      throw new Error(`Firebase returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`Found ${data.products?.length || 0} products`);
    
    // レスポンスの形式を保証
    return NextResponse.json({
      products: data.products || [],
      total: data.total || 0,
      message: data.message || null
    });
    
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        products: [],
        error: error.message || 'Failed to search products'
      },
      { status: 500 }
    );
  }
}

// POSTメソッドも追加（互換性のため）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query || body.keyword || '';
    
    // GETと同じ処理を実行
    const url = new URL(request.url);
    url.searchParams.set('query', query);
    
    // 内部的にGETメソッドを呼び出し
    const getRequest = new Request(url.toString(), {
      method: 'GET'
    });
    
    return GET(getRequest);
    
  } catch (error: any) {
    console.error('Search API POST error:', error);
    return NextResponse.json(
      { 
        products: [],
        error: error.message || 'Failed to search products'
      },
      { status: 500 }
    );
  }
}
