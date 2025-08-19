import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
  'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

export async function POST(request: NextRequest) {
  console.log('=== API Route Called: /api/products/search ===');
  
  try {
    // リクエストボディを取得
    const body = await request.json();
    console.log('Request body:', body);
    
    // Firebase Functions URLを構築
    const firebaseUrl = `${FIREBASE_FUNCTIONS_URL}/searchProducts`;
    console.log('Calling Firebase URL:', firebaseUrl);
    
    // Firebase Functionsにリクエストを送信
    const response = await fetch(firebaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Firebase response status:', response.status);
    
    // レスポンスのテキストを取得
    const responseText = await response.text();
    console.log('Firebase response text:', responseText);

    if (!response.ok) {
      console.error('Firebase function error - Status:', response.status);
      console.error('Firebase function error - Response:', responseText);
      
      // JSONとしてパースを試みる
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { error: responseText || `Firebase function error: ${response.status}` };
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: errorData.error || `Firebase function error: ${response.status}`,
          details: errorData
        },
        { status: response.status }
      );
    }

    // 成功レスポンスをパース
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed response data:', data);
    } catch (e) {
      console.error('Failed to parse successful response:', e);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid response format from Firebase' 
        },
        { status: 500 }
      );
    }

    // 成功レスポンスを返す
    return NextResponse.json({
      success: true,
      products: data.products || [],
      ...data
    });
    
  } catch (error: any) {
    console.error('=== API Route Error ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to search products',
        errorType: error.name,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
