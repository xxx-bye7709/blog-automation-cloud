// src/lib/api.ts
// ダッシュボードのAPI通信サービス

const FIREBASE_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
  'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

// 型定義
interface PostData {
  title?: string;
  postId?: string;
  createdAt?: string;
  [key: string]: unknown;
}

// APIレスポンス型定義
export interface SystemMetrics {
  todayCount: number;
  monthCount: number;
  totalCount: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  systemStatus: 'online' | 'offline';
  lastPost: PostData | null;
  serverTime: string;
  targets: {
    daily: number;
    monthly: number;
  };
}

export interface GenerateResponse {
  success: boolean;
  postId?: string;
  title?: string;
  url?: string;
  error?: string;
  message?: string;
  imageUrl?: string;
  category?: string;
  duration?: string;
  timestamp?: string;
  attachmentId?: number;
  focusKeyword?: string;
  metaDescription?: string;
}

// APIクライアント
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = FIREBASE_URL;
    console.log('API Service initialized with URL:', this.baseUrl);
  }

  // システムメトリクス取得
  async getSystemMetrics(): Promise<SystemMetrics | null> {
    try {
      console.log('Fetching system metrics from:', `${this.baseUrl}/getSystemMetrics`);
      
      const response = await fetch(`${this.baseUrl}/getSystemMetrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      if (!response.ok) {
        console.error('Failed to fetch metrics:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Metrics received:', data.data);
        return data.data;
      }
      
      console.warn('Metrics response not successful:', data);
      return null;
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      return null;
    }
  }

  // 記事生成
  async generateArticle(category: string): Promise<GenerateResponse> {
    try {
      let endpoint = 'testBlogPost';
      
      // カテゴリー別エンドポイント
      const categoryEndpoints: { [key: string]: string } = {
        entertainment: 'generateEntertainmentArticle',
        anime: 'generateAnimeArticle',
        game: 'generateGameArticle',
        movie: 'generateMovieArticle',
        music: 'generateMusicArticle',
        tech: 'generateTechArticle',
        beauty: 'generateBeautyArticle',
        food: 'generateFoodArticle',
        random: 'generateRandomArticle'
      };

      if (categoryEndpoints[category]) {
        endpoint = categoryEndpoints[category];
      }

      console.log(`Generating article: ${category} via ${endpoint}`);
      console.log(`Full URL: ${this.baseUrl}/${endpoint}`);

      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      if (!response.ok) {
        console.error('Failed to generate article:', response.status, response.statusText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      console.log('Article generation response:', data);
      
      return data;
    } catch (error) {
      console.error('Error generating article:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // バッチ生成
  async generateBatch(count: number, category?: string): Promise<GenerateResponse[]> {
    const results: GenerateResponse[] = [];
    
    console.log(`Starting batch generation: ${count} articles`);
    
    for (let i = 0; i < count; i++) {
      console.log(`Generating article ${i + 1}/${count}`);
      const result = await this.generateArticle(category || 'random');
      results.push(result);
      
      // 1秒待機（レート制限対策）
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`Batch generation complete: ${successCount}/${count} successful`);
    
    return results;
  }

  // 投稿履歴取得（将来の実装用）
  async getPostHistory(): Promise<PostData[]> {
    try {
      // TODO: Firebase Functionsに履歴取得エンドポイントを追加
      console.log('Post history endpoint not yet implemented');
      return [];
    } catch (error) {
      console.error('Error fetching post history:', error);
      return [];
    }
  }

  // テスト接続
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection to Firebase Functions...');
      const metrics = await this.getSystemMetrics();
      if (metrics) {
        console.log('✅ Connection successful!');
        return true;
      }
      console.warn('⚠️ Connection established but no data received');
      return false;
    } catch (error) {
      console.error('❌ Connection failed:', error);
      return false;
    }
  }
}

// シングルトンインスタンス
const apiService = new ApiService();

// 初期接続テスト（開発時のみ）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  apiService.testConnection();
}

export default apiService;
