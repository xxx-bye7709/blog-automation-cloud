// API通信用のユーティリティ関数
// Next.js APIルート経由でFirebase Functionsにアクセス

const API_TIMEOUT = 25000; // 25秒のタイムアウト

// 共通のfetch wrapper
async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('リクエストがタイムアウトしました。もう一度お試しください。');
    }
    throw error;
  }
}

// 商品検索（APIルート経由）
export async function searchProducts(query: string) {
  try {
    const response = await fetchWithTimeout('/api/products/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const text = await response.text();
    
    if (!response.ok) {
      let error;
      try {
        error = JSON.parse(text);
      } catch {
        error = { error: text || 'Unknown error' };
      }
      throw new Error(error.error || `検索に失敗しました: ${response.status}`);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error('サーバーからの応答が不正です');
    }
  } catch (error: any) {
    console.error('商品検索エラー:', error);
    throw new Error(error.message || '商品検索に失敗しました');
  }
}

// 商品記事生成（APIルート経由）
export async function generateProductArticle(productData: any) {
  try {
    const response = await fetchWithTimeout('/api/products/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    const text = await response.text();
    
    if (!response.ok) {
      let error;
      try {
        error = JSON.parse(text);
      } catch {
        error = { error: text || 'Unknown error' };
      }
      throw new Error(error.error || `記事生成に失敗しました: ${response.status}`);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error('サーバーからの応答が不正です');
    }
  } catch (error: any) {
    console.error('記事生成エラー:', error);
    throw new Error(error.message || '記事生成に失敗しました');
  }
}

// ダッシュボード用記事生成（APIルート経由）
export async function generateArticle(topic: string, keywords: string[]) {
  try {
    const response = await fetchWithTimeout('/api/posts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, keywords }),
    });

    const text = await response.text();
    
    if (!response.ok) {
      let error;
      try {
        error = JSON.parse(text);
      } catch {
        error = { error: text || 'Unknown error' };
      }
      throw new Error(error.error || `記事生成に失敗しました: ${response.status}`);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error('サーバーからの応答が不正です');
    }
  } catch (error: any) {
    console.error('記事生成エラー:', error);
    throw new Error(error.message || '記事生成に失敗しました');
  }
}

// メトリクス取得（APIルート経由）
export async function fetchMetrics() {
  try {
    const response = await fetchWithTimeout('/api/metrics', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`メトリクス取得に失敗しました: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('メトリクス取得エラー:', error);
    // エラー時はデフォルト値を返す
    return {
      totalPosts: 0,
      monthlyPosts: 0,
      weeklyPosts: 0,
      scheduledPosts: 0,
      categories: []
    };
  }
}

// スケジュール取得（APIルート経由）
export async function getScheduleStatus() {
  try {
    const response = await fetchWithTimeout('/api/schedule/get', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`スケジュール取得に失敗しました: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('スケジュール取得エラー:', error);
    // エラー時はデフォルト値を返す
    return {
      enabled: false,
      schedule: '10:00',
      lastRun: null,
      nextRun: null
    };
  }
}

// スケジュール設定（APIルート経由）
export async function setSchedule(schedule: string) {
  try {
    const response = await fetchWithTimeout('/api/schedule/set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ schedule }),
    });

    if (!response.ok) {
      throw new Error(`スケジュール設定に失敗しました: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('スケジュール設定エラー:', error);
    throw new Error(error.message || 'スケジュール設定に失敗しました');
  }
}

// スケジュール有効/無効切り替え（APIルート経由）
export async function toggleSchedule(enabled: boolean) {
  try {
    const response = await fetchWithTimeout('/api/schedule/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled }),
    });

    if (!response.ok) {
      throw new Error(`スケジュール切り替えに失敗しました: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('スケジュール切り替えエラー:', error);
    throw new Error(error.message || 'スケジュール切り替えに失敗しました');
  }
}

// スケジュール手動実行（APIルート経由）
export async function runScheduledPost() {
  try {
    const response = await fetchWithTimeout('/api/schedule/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const text = await response.text();
    
    if (!response.ok) {
      let error;
      try {
        error = JSON.parse(text);
      } catch {
        error = { error: text || 'Unknown error' };
      }
      throw new Error(error.error || `手動実行に失敗しました: ${response.status}`);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error('サーバーからの応答が不正です');
    }
  } catch (error: any) {
    console.error('手動実行エラー:', error);
    throw new Error(error.message || '手動実行に失敗しました');
  }
}
