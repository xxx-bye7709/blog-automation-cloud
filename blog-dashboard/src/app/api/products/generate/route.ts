// blog-dashboard/src/app/api/products/generate/route.ts

import { NextResponse } from 'next/server';

const FIREBASE_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
  'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

export async function POST(request: Request) {
  console.log('=== Product Generate API Called ===');
  
  try {
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Firebase Functionsに送信するデータを準備
    const requestData = {
      productId: body.productId || 'manual-review',
      keyword: body.keyword || body.products?.[0]?.title || 'レビュー',
      autoPost: true, // 常にWordPressに投稿
      productData: {
        title: body.products?.[0]?.title || body.title || 'テスト商品',
        description: body.products?.[0]?.description || body.description || '',
        price: body.products?.[0]?.price || body.price || '価格未定',
        category: body.category || 'レビュー',
        features: body.products?.[0]?.features || '',
        rating: body.products?.[0]?.rating || 4.0
      }
    };
    
    const firebaseUrl = `${FIREBASE_URL}/generateProductReview`;
    console.log('Calling Firebase URL:', firebaseUrl);
    console.log('Request data:', requestData);
    
    const response = await fetch(firebaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const responseText = await response.text();
    console.log('Firebase status:', response.status);
    console.log('Firebase response:', responseText.substring(0, 500));

    if (!response.ok) {
      // エラーレスポンスでもテキストを返す
      console.error('Firebase error:', responseText);
      return NextResponse.json({
        success: false,
        error: `Firebase error: ${response.status}`,
        details: responseText.substring(0, 200)
      }, { status: 500 });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // JSONパースエラーの場合もエラーとして扱う
      console.error('JSON parse error:', e);
      return NextResponse.json({
        success: false,
        error: 'Invalid response from Firebase',
        details: responseText.substring(0, 200)
      }, { status: 500 });
    }

    // WordPressへの投稿確認
    if (data.postId) {
      console.log('✅ WordPress Post ID:', data.postId);
      console.log('✅ WordPress URL:', data.postUrl);
    }

    return NextResponse.json({
      success: true,
      ...data
    });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}