// app/page.tsx - TypeScriptエラー修正版
'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Send, TrendingUp, 
  AlertCircle, CheckCircle, Loader2, Calendar,
  BarChart3, Settings, History, Zap, Download,
  Trash2, RefreshCw, ExternalLink
} from 'lucide-react';
import { PostHistoryManager } from '@/lib/post-history';

// 型定義
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
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('entertainment');
  const [postCount, setPostCount] = useState(1);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [localStats, setLocalStats] = useState({
    todayPosts: 0,
    monthlyPosts: 0,
    successRate: 100
  });

  const FIREBASE_URL = 'https://asia-northeast1-blog-automation-system.cloudfunctions.net';
  const historyManager = new PostHistoryManager();

  const categories = [
    { id: 'entertainment', name: 'エンタメ', icon: '🎬', color: 'bg-purple-500' },
    { id: 'anime', name: 'アニメ', icon: '🎌', color: 'bg-pink-500' },
    { id: 'game', name: 'ゲーム', icon: '🎮', color: 'bg-green-500' },
    { id: 'movie', name: '映画', icon: '🎥', color: 'bg-red-500' },
    { id: 'music', name: '音楽', icon: '🎵', color: 'bg-blue-500' },
    { id: 'tech', name: 'テクノロジー', icon: '💻', color: 'bg-indigo-500' },
    { id: 'beauty', name: '美容', icon: '💄', color: 'bg-pink-400' },
    { id: 'food', name: 'グルメ', icon: '🍜', color: 'bg-orange-500' }
  ];

  // 履歴とメトリクスの読み込み
  useEffect(() => {
    loadLocalHistory();
    fetchSystemMetrics();
    
    const metricsInterval = setInterval(fetchSystemMetrics, 30000);
    const historyInterval = setInterval(loadLocalHistory, 5000);
    
    return () => {
      clearInterval(metricsInterval);
      clearInterval(historyInterval);
    };
  }, []);

  const loadLocalHistory = () => {
    const history = historyManager.getHistory();
    setRecentPosts(history.slice(0, 10)); // 最新10件表示
    
    setLocalStats({
      todayPosts: historyManager.getTodayPostCount(),
      monthlyPosts: historyManager.getMonthlyPostCount(),
      successRate: historyManager.getSuccessRate()
    });
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch(`${FIREBASE_URL}/getSystemMetrics`);
      const data = await response.json();
      setSystemMetrics(data);
    } catch (error) {
      console.error('メトリクス取得エラー:', error);
    }
  };

  const generateArticle = async (category = selectedCategory) => {
    setIsGenerating(true);
    showNotification('記事を生成中...', 'info');

    // 仮のIDを生成（タイムスタンプベース）
    const tempId = `temp_${Date.now()}`;
    
    // 履歴に「生成中」として追加
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
      
      const response = await fetch(`${FIREBASE_URL}/${functionName}`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.success) {
        // 成功時に履歴を更新
        historyManager.updatePostStatus(tempId, 'published', {
          title: data.title || `${categories.find(c => c.id === category)?.name}記事`,
          wordpressId: data.postId,
          url: data.url,
          imageUrl: data.imageUrl
        });
        
        showNotification(`記事が投稿されました！ID: ${data.postId}`, 'success');
      } else {
        // 失敗時に履歴を更新
        historyManager.updatePostStatus(tempId, 'failed', {
          error: data.error || '投稿に失敗しました'
        });
        
        showNotification('記事生成に失敗しました', 'error');
      }
      
      loadLocalHistory();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      historyManager.updatePostStatus(tempId, 'failed', {
        error: errorMessage
      });
      
      showNotification(`エラー: ${errorMessage}`, 'error');
      loadLocalHistory();
    } finally {
      setIsGenerating(false);
    }
  };

  const batchGenerate = async () => {
    setIsGenerating(true);
    showNotification(`${postCount}件の記事を生成中...`, 'info');

    try {
      const response = await fetch(`${FIREBASE_URL}/batchGeneratePosts?count=${postCount}`, {
        method: 'GET',
      });

      const data = await response.json();
      
      interface BatchResult {
        success: boolean;
        postId?: string;
        title?: string;
        category?: string;
        url?: string;
      }
      
      if (data.success && data.results) {
        // バッチ結果を履歴に追加
        data.results.forEach((result: BatchResult) => {
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
        
        showNotification(`${data.generated}件の記事が投稿されました！`, 'success');
        loadLocalHistory();
        fetchSystemMetrics();
      } else {
        showNotification('バッチ生成に失敗しました', 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showNotification(`エラー: ${errorMessage}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportHistory = () => {
    const csv = historyManager.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blog-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('履歴をエクスポートしました', 'success');
  };

  const clearHistory = () => {
    if (confirm('投稿履歴を全て削除しますか？この操作は取り消せません。')) {
      historyManager.clearHistory();
      loadLocalHistory();
      showNotification('履歴をクリアしました', 'success');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // メトリクスの統合（Firebase + ローカル）
  const combinedMetrics = {
    todayPosts: systemMetrics?.todayPosts || localStats.todayPosts,
    monthlyPosts: systemMetrics?.monthlyPosts || localStats.monthlyPosts,
    successRate: systemMetrics?.successRate || localStats.successRate
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* ヘッダー */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Blog Automation Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={loadLocalHistory}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="更新"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button 
                onClick={exportHistory}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="エクスポート"
              >
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 通知 */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-green-500/20 border border-green-500' :
          notification.type === 'error' ? 'bg-red-500/20 border border-red-500' :
          'bg-blue-500/20 border border-blue-500'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
           notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
           <Loader2 className="w-5 h-5 animate-spin" />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* メトリクスカード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">本日の投稿数</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold">{combinedMetrics.todayPosts}</div>
            <div className="text-sm text-gray-400 mt-1">目標: 20件</div>
            <div className="text-xs text-gray-500 mt-1">
              ローカル: {localStats.todayPosts} / サーバー: {systemMetrics?.todayPosts || '-'}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">月間投稿数</span>
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold">{combinedMetrics.monthlyPosts}</div>
            <div className="text-sm text-gray-400 mt-1">目標: 500件</div>
            <div className="text-xs text-gray-500 mt-1">
              ローカル: {localStats.monthlyPosts} / サーバー: {systemMetrics?.monthlyPosts || '-'}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">成功率</span>
              <CheckCircle className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold">{combinedMetrics.successRate}%</div>
            <div className="text-sm text-gray-400 mt-1">過去24時間</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">システム状態</span>
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold">稼働中</div>
            <div className="text-sm text-green-400 mt-1">● オンライン</div>
          </div>
        </div>

        {/* メインコントロール */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* クイックアクション */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Send className="w-5 h-5 mr-2" />
                クイックアクション
              </h2>

              {/* カテゴリー選択 */}
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-3 block">カテゴリー選択</label>
                <div className="grid grid-cols-4 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedCategory === cat.id
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-xs">{cat.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* アクションボタン */}
              <div className="space-y-4">
                <button
                  onClick={() => generateArticle()}
                  disabled={isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isGenerating ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-5 h-5 mr-2" />
                  )}
                  {isGenerating ? '生成中...' : `${categories.find(c => c.id === selectedCategory)?.name}記事を生成`}
                </button>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="text-sm text-gray-400 mb-2 block">バッチ生成数</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={postCount}
                      onChange={(e) => setPostCount(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-gray-400 mb-2 block">&nbsp;</label>
                    <button
                      onClick={batchGenerate}
                      disabled={isGenerating}
                      className="w-full py-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg font-bold hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50"
                    >
                      バッチ生成
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => generateArticle('random')}
                  disabled={isGenerating}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-bold hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50"
                >
                  <Zap className="w-5 h-5 mr-2 inline" />
                  ランダム記事生成
                </button>
              </div>
            </div>

           // page.tsx の「スケジュール設定」セクションを以下に置き換え

{/* スケジュール設定 */}
<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mt-6">
  <h2 className="text-xl font-bold mb-4 flex items-center">
    <Calendar className="w-5 h-5 mr-2" />
    スケジュール設定
  </h2>
  <div className="space-y-3">
    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
      <div>
        <div className="font-medium">自動投稿スケジューラー</div>
        <div className="text-sm text-gray-400">カテゴリーローテーションで自動投稿</div>
      </div>
      <Link 
        href="/schedule"
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2"
      >
        <Settings className="w-4 h-4" />
        設定画面へ
      </Link>
    </div>
    
    {/* スケジュールステータス表示（オプション） */}
    <div className="p-3 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/30 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-300">スケジュール稼働中</span>
        </div>
        <span className="text-xs text-gray-500">次回投稿: 1時間後</span>
      </div>
    </div>
  </div>
</div>

          {/* 最近の投稿 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  投稿履歴
                </h2>
                <button
                  onClick={clearHistory}
                  className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-red-400"
                  title="履歴をクリア"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <div key={post.id} className="p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1 line-clamp-2">
                            {post.title}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span>{categories.find(c => c.id === post.category)?.icon}</span>
                            <span>{new Date(post.timestamp).toLocaleString('ja-JP', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          {post.url && (
                            <a 
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center mt-1 text-xs text-blue-400 hover:text-blue-300"
                            >
                              記事を見る <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          )}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          post.status === 'published' 
                            ? 'bg-green-500/20 text-green-400'
                            : post.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {post.status === 'published' ? '公開' : 
                           post.status === 'failed' ? '失敗' : '処理中'}
                        </div>
                      </div>
                      {post.error && (
                        <div className="mt-2 text-xs text-red-400">
                          エラー: {post.error}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>まだ投稿がありません</p>
                  </div>
                )}
              </div>
            </div>

            {/* クイックリンク */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mt-6">
              <h2 className="text-xl font-bold mb-4">クイックリンク</h2>
              <div className="space-y-2">
                <a
                  href="https://www.entamade.jp/wp-admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>WordPress管理画面</span>
                    <span className="text-gray-400">→</span>
                  </div>
                </a>
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>Firebase Console</span>
                    <span className="text-gray-400">→</span>
                  </div>
                </a>
                <a
                  href="https://platform.openai.com/usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>OpenAI Usage</span>
                    <span className="text-gray-400">→</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
