import { NextResponse } from 'next/server';

// Vercel無料プランは10秒、有料プランは60秒まで
export const maxDuration = 60; // 秒

const FIREBASE_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
  'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // カテゴリ別の関数を呼び出す
    const category = body.category || 'entertainment';
    const functionName = `generate${category.charAt(0).toUpperCase() + category.slice(1)}Article`;
    
    console.log(`Calling Firebase Function: ${functionName}`);
    
    const response = await fetch(`${FIREBASE_URL}/${functionName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // タイムアウトを50秒に設定（Vercelの制限より少し短く）
      signal: AbortSignal.timeout(50000),
    });

    if (!response.ok) {
      throw new Error(`Firebase returned ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: '記事が生成されました',
      postId: data.postId || null,
      title: data.title || null
    });
    
  } catch (error: any) {
    console.error('Generate API error:', error);
    
    // タイムアウトエラーの場合
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { 
          success: false,
          error: '処理に時間がかかっています。バックグラウンドで処理中です。',
          message: 'しばらく待ってからWordPressを確認してください。'
        },
        { status: 202 } // 202 Accepted
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate post'
      },
      { status: 500 }
    );
  }
}
