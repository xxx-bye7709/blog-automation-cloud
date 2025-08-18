// src/lib/api.ts - APIルート経由版（CORSエラー対策）

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
  const { timeout = 25000, retryCount = 1 } = options;
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

    // Next.js APIルート経由でリクエスト（CORSエラー回避）
    const response = await fetch('/api/posts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint, data }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      // 成功をローカルストレージに記録（重複防止）
      const recentPosts = JSON.parse(localStorage.getItem('recentPosts') || '[]');
      recentPosts.push({
        id: requestId,
        endpoint,
        timestamp: Date.now(),
        title: result.data?.title || 'Unknown'
      });
      
      // 最新10件のみ保持
      if (recentPosts.length > 10) {
        recentPosts.shift();
      }
      localStorage.setItem('recentPosts', JSON.stringify(recentPosts));

      return {
        success: true,
        data: result.data,
        message: '記事の生成に成功しました'
      };
    } else {
      return {
        success: false,
        error: result.error || 'エラーが発生しました'
      };
    }

  } catch (error: any) {
    console.error('API Error:', error);
    
    // タイムアウトエラーの場合
    if (error.name === 'AbortError') {
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
    }, 3000);
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
    const response = await fetch('/api/posts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: `/batchGeneratePosts?count=${count}`,
        data: null
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: result.success,
      data: result.data,
      message: result.success ? `${count}件の記事生成を開始しました` : undefined,
      error: result.error
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'バッチ処理の開始に失敗しました。個別に生成してください。'
    };
  }
}

// メトリクス取得（APIルート経由）
export async function getSystemMetrics(): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/metrics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: result.success,
      data: result.data || {
        totalPosts: 0,
        todayPosts: 0,
        successRate: 0,
        categories: {}
      }
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
