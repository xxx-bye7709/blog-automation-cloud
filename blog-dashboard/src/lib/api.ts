// src/lib/api.ts の改善版

interface PostData {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// 投稿の重複を防ぐための管理
const pendingRequests = new Map<string, boolean>();

export async function generatePost(
  endpoint: string,
  data?: any,
  options: {
    timeout?: number;
    retryCount?: number;
  } = {}
): Promise<ApiResponse> {
  const { timeout = 25000, retryCount = 1 } = options; // タイムアウトを25秒に延長
  const requestId = `${endpoint}-${Date.now()}`;
  
  // 重複リクエストのチェック
  if (pendingRequests.has(endpoint)) {
    console.log('Request already in progress for:', endpoint);
    return {
      success: false,
      error: 'リクエストは既に処理中です。しばらくお待ちください。'
    };
  }

  pendingRequests.set(endpoint, true);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // 成功をローカルストレージに記録（重複防止）
    const recentPosts = JSON.parse(localStorage.getItem('recentPosts') || '[]');
    recentPosts.push({
      id: requestId,
      endpoint,
      timestamp: Date.now(),
      title: result.title || 'Unknown'
    });
    
    // 最新10件のみ保持
    if (recentPosts.length > 10) {
      recentPosts.shift();
    }
    localStorage.setItem('recentPosts', JSON.stringify(recentPosts));

    return {
      success: true,
      data: result,
      message: '記事の生成に成功しました'
    };

  } catch (error: any) {
    console.error('API Error:', error);
    
    // タイムアウトエラーの場合
    if (error.name === 'AbortError') {
      // 実際には成功している可能性があるため、確認メッセージを表示
      return {
        success: false,
        error: '処理に時間がかかっています。記事は生成される可能性があります。1-2分後に確認してください。',
        data: { possibleSuccess: true }
      };
    }
    
    // その他のエラー
    return {
      success: false,
      error: error.message || 'エラーが発生しました'
    };
    
  } finally {
    // リクエスト状態をクリア
    setTimeout(() => {
      pendingRequests.delete(endpoint);
    }, 3000); // 3秒後にクリア
  }
}

// 最近の投稿をチェック（重複防止）
export function checkRecentPost(endpoint: string, timeWindow: number = 60000): boolean {
  const recentPosts = JSON.parse(localStorage.getItem('recentPosts') || '[]');
  const now = Date.now();
  
  return recentPosts.some((post: any) => 
    post.endpoint === endpoint && 
    (now - post.timestamp) < timeWindow
  );
}

// バッチ処理用の改善版
export async function batchGeneratePosts(count: number): Promise<ApiResponse> {
  try {
    // バッチ処理は別途タイムアウトを設定
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/batchGeneratePosts?count=${count}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // バッチ処理はタイムアウトを設定しない（Vercelの制限を回避できない）
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      data: await response.json(),
      message: `${count}件の記事生成を開始しました`
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'バッチ処理の開始に失敗しました。個別に生成してください。'
    };
  }
}

// メトリクス取得（これは高速なのでタイムアウト短め）
export async function getSystemMetrics(): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/getSystemMetrics`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      data: await response.json()
    };
  } catch (error: any) {
    console.error('Metrics fetch error:', error);
    return {
      success: false,
      error: 'メトリクスの取得に失敗しました',
      data: {
        totalPosts: 0,
        todayPosts: 0,
        successRate: 0,
        categories: {}
      }
    };
  }
}
