// app/page.tsx - 既存機能維持 + 新デザインシステム統合版
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { 
  FileText, Send, TrendingUp, 
  AlertCircle, CheckCircle, Loader2, Calendar,
  BarChart3, Settings, History, Zap, Download,
  Trash2, RefreshCw, ExternalLink, X, Sparkles,
  PlusCircle, Search, ChevronRight, Target
} from 'lucide-react';

// 正しい相対パス（../で一つ上のディレクトリへ）
import { 
  Card, 
  Button, 
  Badge, 
  QuickActionButton, 
  StatCard, 
  ThemeToggle 
} from '../components/common';  // ← ../に修正
import { useTheme } from '../lib/theme-context';  // ← ../に修正
import ProductSelectionUI from '../components/ProductSelectionUI';


// 以下、既存の型定義とクラス定義
interface Post {
  id: string | number;
  title: string;
  category: string;
  status: 'pending' | 'published' | 'failed';
  timestamp: string;
  url?: string;
  error?: string;
  imageUrl?: string;
  wordpressId?: number;
}

interface SystemMetrics {
  todayPosts?: number;
  monthlyPosts?: number;
  successRate?: number | string;
  metrics?: {
    totalPosts: number;
    successRate: string;
    averageTimeSeconds: string;
    postsPerHour: number;
    imageUploadSuccessRate: string;
  };
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

// === エラーハンドリングユーティリティ（既存のものを維持） ===
class ErrorHandler {
  static handleError(error: unknown, context?: string): string {
    if (context && !context.includes('fetchSystemMetrics')) {
      console.error(`Error in ${context}:`, error);
    }
    
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        return 'ネットワークエラーが発生しました。接続を確認してください。';
      }
      if (error.message.includes('タイムアウト')) {
        return error.message;
      }
      if (error.message.includes('HTTP Error')) {
        const status = error.message.match(/\d+/)?.[0];
        if (status === '404') return 'リソースが見つかりません';
        if (status === '500') return 'サーバーエラーが発生しました';
        if (status === '503') return 'サービスが一時的に利用できません';
      }
      return error.message;
    }
    
    return '予期しないエラーが発生しました';
  }
}

// === PostHistoryManager（既存のものを維持） ===
class PostHistoryManager {
  private storageKey = 'postHistory';
  private maxHistory = 100;
  
  getHistory(): Post[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const posts = JSON.parse(stored);
      if (!Array.isArray(posts)) {
        console.warn('Invalid history data, resetting...');
        return [];
      }
      
      return posts;
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  }
  
  private saveHistory(posts: Post[]): void {
    try {
      const toSave = posts.slice(0, this.maxHistory);
      localStorage.setItem(this.storageKey, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save history:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        const reduced = posts.slice(0, Math.floor(this.maxHistory / 2));
        localStorage.setItem(this.storageKey, JSON.stringify(reduced));
      }
    }
  }
  
  addPost(post: Omit<Post, 'timestamp'>) {
    const posts = this.getHistory();
    const newPost = { ...post, timestamp: new Date().toISOString() };
    posts.unshift(newPost);
    this.saveHistory(posts);
  }
  
  updatePostStatus(id: string | number, status: Post['status'], updates?: Partial<Post>) {
    const posts = this.getHistory();
    const index = posts.findIndex(p => p.id === id);
    if (index !== -1) {
      posts[index] = { ...posts[index], status, ...updates };
      this.saveHistory(posts);
    }
  }
  
  getTodayPostCount(): number {
    const today = new Date().toDateString();
    return this.getHistory().filter(p => 
      new Date(p.timestamp).toDateString() === today && p.status === 'published'
    ).length;
  }
  
  getMonthlyPostCount(): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return this.getHistory().filter(p => {
      const postDate = new Date(p.timestamp);
      return postDate.getMonth() === currentMonth && 
             postDate.getFullYear() === currentYear && 
             p.status === 'published';
    }).length;
  }
  
  getSuccessRate(): number {
    const posts = this.getHistory();
    if (posts.length === 0) return 100;
    const successful = posts.filter(p => p.status === 'published').length;
    return Math.round((successful / posts.length) * 100);
  }
  
  clearHistory() {
    localStorage.removeItem(this.storageKey);
  }
  
  exportToCSV(): string {
    const posts = this.getHistory();
    const headers = ['ID', 'Title', 'Category', 'Status', 'Timestamp', 'URL'];
    const rows = posts.map(p => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      p.category,
      p.status,
      p.timestamp,
      p.url || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// === カスタムフック（既存のものを維持） ===
function useMounted() {
  const mounted = useRef(true);
  
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  
  return mounted;
}

export default function Home() {
  const { isDark } = useTheme();  // ← これを追加
  const mounted = useMounted();
  const [isGenerating, setIsGenerating] = useState(false);
  // ↓ ここから置き換え
  const [selectedCategory, setSelectedCategory] = useState('entertainment');
  const [postCount, setPostCount] = useState(1);
  const [showProductSelection, setShowProductSelection] = useState(false);
  
  // クライアントサイドでのみlocalStorageから値を読み込む
  useEffect(() => {
    const savedCategory = localStorage.getItem('selectedCategory');
    const savedPostCount = localStorage.getItem('postCount');
    
    if (savedCategory) {
      setSelectedCategory(savedCategory);
    }
    
    if (savedPostCount) {
      const count = parseInt(savedPostCount, 10);
      if (!isNaN(count) && count >= 1 && count <= 20) {
        setPostCount(count);
      }
    }
  }, []); // 初回マウント時のみ実行
  // ↑ ここまで置き換え
  
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [localStats, setLocalStats] = useState({
    todayPosts: 0,
    monthlyPosts: 0,
    successRate: 100
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const FIREBASE_URL = 'https://asia-northeast1-blog-automation-system.cloudfunctions.net';
  const historyManager = useRef(new PostHistoryManager()).current;

  const categories = [
    { id: 'entertainment', name: 'エンタメ', icon: '🎬', color: 'from-purple-500 to-purple-600' },
    { id: 'anime', name: 'アニメ', icon: '🎌', color: 'from-pink-500 to-pink-600' },
    { id: 'game', name: 'ゲーム', icon: '🎮', color: 'from-green-500 to-green-600' },
    { id: 'movie', name: '映画', icon: '🎥', color: 'from-red-500 to-red-600' },
    { id: 'music', name: '音楽', icon: '🎵', color: 'from-blue-500 to-blue-600' },
    { id: 'tech', name: 'テクノロジー', icon: '💻', color: 'from-indigo-500 to-indigo-600' },
    { id: 'beauty', name: '美容', icon: '💄', color: 'from-pink-400 to-pink-500' },
    { id: 'food', name: 'グルメ', icon: '🍜', color: 'from-orange-500 to-orange-600' }
  ];

  // === 通知システム（既存のものを維持） ===
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 5000) => {
    const id = Date.now().toString();
    const notification: Notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        if (mounted.current) {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }
      }, duration);
    }
    
    return id;
  }, [mounted]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // === 以下、既存のすべての関数をそのまま維持 ===
  useEffect(() => {
    localStorage.setItem('selectedCategory', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    localStorage.setItem('postCount', postCount.toString());
  }, [postCount]);

  const loadLocalHistory = useCallback(() => {
    if (!mounted.current) return;
    
    try {
      const history = historyManager.getHistory();
      setRecentPosts(history.slice(0, 10));
      
      setLocalStats({
        todayPosts: historyManager.getTodayPostCount(),
        monthlyPosts: historyManager.getMonthlyPostCount(),
        successRate: historyManager.getSuccessRate()
      });
    } catch (error) {
      console.error('履歴読み込みエラー:', error);
      showNotification('履歴の読み込みに失敗しました', 'warning');
    }
  }, [historyManager, mounted, showNotification]);

  const fetchWithTimeout = useCallback(async (url: string, options: RequestInit = {}, timeout = 30000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`Request timeout: ${url} (${timeout}ms)`);
        throw new Error(`リクエストがタイムアウトしました（${timeout/1000}秒）`);
      }
      throw error;
    }
  }, []);

  const fetchSystemMetrics = useCallback(async (silent = false) => {
    if (!mounted.current) return;
    
    try {
      const response = await fetchWithTimeout(`${FIREBASE_URL}/getSystemMetrics`, {}, 10000);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (mounted.current) {
        setSystemMetrics(data);
      }
    } catch (error) {
      console.warn('Metrics fetch error:', error);
      if (!silent) {
        const message = ErrorHandler.handleError(error, 'fetchSystemMetrics');
        console.log('Using local metrics due to:', message);
      }
    }
  }, [mounted, fetchWithTimeout]);

  const generateArticle = useCallback(async (category = selectedCategory, retryCount = 0) => {
    if (isGenerating) {
      showNotification('すでに生成処理中です', 'warning');
      return;
    }

    setIsGenerating(true);
    const notificationId = showNotification('記事を生成中...', 'info', 0);
    const tempId = `temp_${Date.now()}`;
    
    historyManager.addPost({
      id: tempId,
      title: '生成中...',
      category: category,
      status: 'pending'
    });

    try {
      const functionName = category === 'random' 
        ? 'generateRandomArticle' 
        : `generate${category.charAt(0).toUpperCase() + category.slice(1)}Article`;
      
      const timeoutMs = retryCount > 0 ? 90000 : 60000;
      
      const response = await fetchWithTimeout(`${FIREBASE_URL}/${functionName}`, {
        method: 'GET',
      }, timeoutMs);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        historyManager.updatePostStatus(tempId, 'published', {
          title: data.title || `${categories.find(c => c.id === category)?.name}記事`,
          wordpressId: data.postId,
          url: data.url,
          imageUrl: data.imageUrl
        });
        
        removeNotification(notificationId);
        showNotification(`記事が投稿されました！ID: ${data.postId}`, 'success');
      } else {
        throw new Error(data.error || '投稿に失敗しました');
      }
    } catch (error) {
      const errorMessage = ErrorHandler.handleError(error, 'generateArticle');
      
      if (retryCount < 1 && errorMessage.includes('タイムアウト')) {
        removeNotification(notificationId);
        
        const retry = confirm('接続がタイムアウトしました。\nもう一度試みますか？\n\n※サーバーが混雑している可能性があります。');
        
        if (retry) {
          showNotification('再試行中...', 'info');
          setIsGenerating(false);
          setTimeout(() => {
            if (mounted.current) {
              generateArticle(category, retryCount + 1);
            }
          }, 1000);
          return;
        }
      }
      
      historyManager.updatePostStatus(tempId, 'failed', {
        error: errorMessage
      });
      
      removeNotification(notificationId);
      showNotification(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
      loadLocalHistory();
    }
  }, [selectedCategory, isGenerating, historyManager, categories, mounted, showNotification, removeNotification, loadLocalHistory, fetchWithTimeout]);

  const batchGenerate = useCallback(async () => {
    if (isGenerating) {
      showNotification('すでに生成処理中です', 'warning');
      return;
    }

    if (postCount < 1 || postCount > 20) {
      showNotification('生成数は1～20の間で指定してください', 'error');
      return;
    }

    setIsGenerating(true);
    const notificationId = showNotification(`${postCount}件の記事を生成中...`, 'info', 0);

    try {
      const response = await fetchWithTimeout(`${FIREBASE_URL}/batchGeneratePosts?count=${postCount}`, {
        method: 'GET',
      }, 180000);

      const data = await response.json();
      
      if (data.success && data.results) {
        data.results.forEach((result: any) => {
          if (result.success && result.postId) {
            historyManager.addPost({
              id: result.postId,
              title: result.title || '無題',
              category: result.category || 'unknown',
              status: 'published',
              url: result.url
            });
          }
        });
        
        removeNotification(notificationId);
        showNotification(`${data.generated || postCount}件の記事が投稿されました！`, 'success');
        loadLocalHistory();
        fetchSystemMetrics();
      } else {
        throw new Error(data.error || 'バッチ生成に失敗しました');
      }
    } catch (error) {
      const errorMessage = ErrorHandler.handleError(error, 'batchGenerate');
      removeNotification(notificationId);
      showNotification(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [postCount, isGenerating, historyManager, showNotification, removeNotification, loadLocalHistory, fetchSystemMetrics, fetchWithTimeout]);

  const exportHistory = useCallback(() => {
    try {
      const csv = historyManager.exportToCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `blog-history-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('履歴をエクスポートしました', 'success');
    } catch (error) {
      const errorMessage = ErrorHandler.handleError(error, 'exportHistory');
      showNotification(errorMessage, 'error');
    }
  }, [historyManager, showNotification]);

  const clearHistory = useCallback(() => {
    if (confirm('投稿履歴を全て削除します。\nこの操作は取り消せません。\n\n本当に削除しますか？')) {
      try {
        historyManager.clearHistory();
        loadLocalHistory();
        showNotification('履歴をクリアしました', 'success');
      } catch (error) {
        const errorMessage = ErrorHandler.handleError(error, 'clearHistory');
        showNotification(errorMessage, 'error');
      }
    }
  }, [historyManager, loadLocalHistory, showNotification]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const notificationId = showNotification('データを更新中...', 'info', 0);
    
    try {
      await Promise.all([
        loadLocalHistory(),
        fetchSystemMetrics(false)
      ]);
      removeNotification(notificationId);
      showNotification('データを更新しました', 'success');
    } catch (error) {
      removeNotification(notificationId);
      showNotification('更新に一部失敗しましたが、ローカルデータは更新されました', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadLocalHistory, fetchSystemMetrics, showNotification, removeNotification]);

  useEffect(() => {
    loadLocalHistory();
    fetchSystemMetrics(true);
    
    const metricsInterval = setInterval(() => {
      if (mounted.current) {
        fetchSystemMetrics(true);
      }
    }, 60000);
    
    const historyInterval = setInterval(() => {
      if (mounted.current) {
        loadLocalHistory();
      }
    }, 10000);
    
    return () => {
      clearInterval(metricsInterval);
      clearInterval(historyInterval);
    };
  }, [loadLocalHistory, fetchSystemMetrics, mounted]);

  const combinedMetrics = {
    todayPosts: systemMetrics?.todayPosts ?? localStats.todayPosts,
    monthlyPosts: systemMetrics?.monthlyPosts ?? localStats.monthlyPosts,
    successRate: systemMetrics?.successRate ?? localStats.successRate
  };

  // === 新しいデザインシステムを使用したUI ===
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* ヘッダー - 新デザイン */}
      <header className={`sticky top-0 z-50 border-b ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className={`text-2xl font-bold ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}>
                Blog Automation Dashboard
              </h1>
              <Badge variant={systemMetrics ? 'success' : 'warning'}>
                {systemMetrics ? 'Firebase接続済み' : 'ローカルモード'}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button 
                variant="secondary" 
                size="sm" 
                icon={RefreshCw}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                更新
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                icon={Download}
                onClick={exportHistory}
              >
                エクスポート
              </Button>
              <Link href="/schedule">
                <Button variant="secondary" size="sm" icon={Calendar}>
                  スケジュール
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 通知システム（既存のスタイルを維持） */}
      <div className="fixed top-6 right-6 z-50 space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              p-5 rounded-xl shadow-2xl backdrop-blur-sm flex items-center space-x-3 
              animate-slide-in-right max-w-md
              ${
                notification.type === 'success' ? 'bg-green-500/20 border border-green-500' :
                notification.type === 'error' ? 'bg-red-500/20 border border-red-500' :
                notification.type === 'warning' ? 'bg-yellow-500/20 border border-yellow-500' :
                'bg-blue-500/20 border border-blue-500'
              }
            `}
          >
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> :
             notification.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> :
             notification.type === 'warning' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> :
             <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />}
            <span className="flex-1">{notification.message}</span>
            {notification.duration !== 0 && (
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-white flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="p-6">
        {/* ステータスバー - 新デザイン */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  本日の投稿数
                </p>
                <p className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {combinedMetrics.todayPosts}件
                </p>
              </div>
              <div className={`h-10 w-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  月間投稿数
                </p>
                <p className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {combinedMetrics.monthlyPosts}件
                </p>
              </div>
              <div className={`h-10 w-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  成功率
                </p>
                <p className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {combinedMetrics.successRate}%
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              詳細を見る
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>

        {/* メトリクスカード - 新デザイン */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="本日の投稿数"
            value={combinedMetrics.todayPosts}
            change={12}
            icon={TrendingUp}
            color="bg-green-500"
          />
          <StatCard
            title="月間投稿数"
            value={combinedMetrics.monthlyPosts}
            icon={BarChart3}
            color="bg-blue-500"
          />
          <StatCard
            title="成功率"
            value={`${combinedMetrics.successRate}%`}
            icon={CheckCircle}
            color="bg-purple-500"
          />
          <StatCard
            title="システム状態"
            value="稼働中"
            icon={Zap}
            color="bg-yellow-500"
          />
        </div>

        {/* カテゴリー選択 - 新デザイン */}
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}>
            カテゴリー選択
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isDark 
                    ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
                    : 'bg-white border-gray-200 hover:border-blue-400'
                  }
                  ${selectedCategory === cat.id ? 'ring-2 ring-blue-500' : ''}
                  hover:shadow-lg active:scale-95
                `}
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <div className={`text-sm font-medium ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {cat.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* クイックアクション - 新デザイン */}
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}>
            クイックアクション
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickActionButton
              icon={FileText}
              title="記事生成"
              description={`${categories.find(c => c.id === selectedCategory)?.name}記事を生成`}
              color="bg-blue-500"
              onClick={() => generateArticle()}
            />
            <QuickActionButton
              icon={Zap}
              title="ランダム生成"
              description="ランダムカテゴリーで生成"
              color="bg-purple-500"
              onClick={() => generateArticle('random')}
            />
            <QuickActionButton
              icon={Calendar}
              title="スケジュール"
              description="投稿予約管理"
              color="bg-green-500"
              onClick={() => window.location.href = '/schedule'}
            />
            <QuickActionButton
              icon={Sparkles}
              title="バッチ生成"
              description={`${postCount}件まとめて生成`}
              color="bg-orange-500"
              onClick={batchGenerate}
            />
            <QuickActionButton
              icon={Target}
              title="商品記事"
              description="商品レビュー作成"
              color="bg-green-500"
              onClick={() => setShowProductSelection(true)}
            />
          </div>
        </div>

        {/* バッチ生成設定 */}
        <Card className="mb-6">
          <h3 className={`font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            バッチ生成設定
          </h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                生成数（1-20）
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={postCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= 1 && value <= 20) {
                    setPostCount(value);
                  }
                }}
                className={`
                  w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-300 text-gray-900'
                  }
                `}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={batchGenerate}
                disabled={isGenerating}
                variant="primary"
                icon={Zap}
              >
                バッチ生成実行
              </Button>
            </div>
          </div>
        </Card>

        {/* 投稿履歴 - 新デザイン */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-semibold ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              投稿履歴
            </h2>
            <Button 
              variant="danger" 
              size="sm"
              icon={Trash2}
              onClick={clearHistory}
            >
              履歴をクリア
            </Button>
          </div>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {recentPosts.length === 0 ? (
              <div className={`text-center py-8 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                まだ投稿がありません
              </div>
            ) : (
              recentPosts.map((post) => (
                <div
                  key={post.id}
                  className={`
                    p-4 rounded-lg transition-colors
                    ${isDark 
                      ? 'bg-gray-700/50 hover:bg-gray-700' 
                      : 'bg-gray-50 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        isDark ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-lg">{categories.find(c => c.id === post.category)?.icon}</span>
                        <Badge variant={
                          post.status === 'published' ? 'success' : 
                          post.status === 'failed' ? 'danger' : 'default'
                        }>
                          {post.status === 'published' ? '公開' : 
                           post.status === 'failed' ? '失敗' : '処理中'}
                        </Badge>
                        <span className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {new Date(post.timestamp).toLocaleString('ja-JP')}
                        </span>
                      </div>
                      {post.url && (
                        <a 
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center mt-2 text-blue-500 hover:text-blue-600"
                        >
                          記事を見る <ExternalLink className="w-4 h-4 ml-1" />
                        </a>
                      )}
                      {post.error && (
                        <div className="mt-2 text-sm text-red-500">
                          エラー: {post.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ローディングオーバーレイ */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className={isDark ? 'text-gray-100' : 'text-gray-900'}>
              記事を生成中...
            </p>
          </Card>
        </div>
      )}

      {/* CSSアニメーション（既存のものを維持） */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    
      {showProductSelection && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center flex-shrink-0`}>
        <h2 className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          商品記事作成
        </h2>
        <button
          onClick={() => setShowProductSelection(false)}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ProductSelectionUI />
      </div>
    </div>
  </div>
)}
    </div>
  );
}
