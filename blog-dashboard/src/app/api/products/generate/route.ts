import { NextResponse } from 'next/server';

const FIREBASE_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
  'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

export async function POST(request: Request) {
  console.log('=== Product Generate API Called ===');
  
  try {
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // productIdを追加（DMMの場合はcontent_idを使用）
    const requestData = {
      ...body,
      productId: body.productId || body.products?.[0]?.content_id || 'manual-review',
      source: body.source || 'dmm',
      autoPost: true // WordPress自動投稿を有効化
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
      throw new Error(`Firebase error: ${response.status} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText, success: true };
    }

    // WordPressへの投稿確認
    if (data.postId) {
      console.log('✅ WordPress Post ID:', data.postId);
    }

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error: any) {
    console.error('❌ Generate API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
