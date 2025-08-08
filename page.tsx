// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Image, Send, Clock, TrendingUp, 
  AlertCircle, CheckCircle, Loader2, Calendar,
  BarChart3, Settings, History, Zap
} from 'lucide-react';

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('entertainment');
  const [postCount, setPostCount] = useState(1);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [notification, setNotification] = useState<any>(null);

  const FIREBASE_URL = 'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

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

  useEffect(() => {
    fetchSystemMetrics();
    const interval = setInterval(fetchSystemMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

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

    try {
      const functionName = category === 'random' 
        ? 'generateRandomArticle' 
        : `generate${category.charAt(0).toUpperCase() + category.slice(1)}Article`;
      
      const response = await fetch(`${FIREBASE_URL}/${functionName}`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification(`記事が投稿されました！ID: ${data.postId}`, 'success');
        setRecentPosts(prev => [{
          id: data.postId,
          title: data.title || '新規記事',
          category: category,
          timestamp: new Date().toLocaleString('ja-JP'),
          status: 'published'
        }, ...prev.slice(0, 4)]);
      } else {
        showNotification('記事生成に失敗しました', 'error');
      }
    } catch (error: any) {
      showNotification(`エラー: ${error.message}`, 'error');
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
      
      if (data.success) {
        showNotification(`${data.generated}件の記事が投稿されました！`, 'success');
        fetchSystemMetrics();
      } else {
        showNotification('バッチ生成に失敗しました', 'error');
      }
    } catch (error: any) {
      showNotification(`エラー: ${error.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
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
            <div className="text-3xl font-bold">{systemMetrics?.todayPosts || 0}</div>
            <div className="text-sm text-gray-400 mt-1">目標: 20件</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">月間投稿数</span>
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold">{systemMetrics?.monthlyPosts || 0}</div>
            <div className="text-sm text-gray-400 mt-1">目標: 500件</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">成功率</span>
              <CheckCircle className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold">{systemMetrics?.successRate || '100'}%</div>
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

            {/* スケジュール設定 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mt-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                スケジュール設定
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div>
                    <div className="font-medium">定期投稿</div>
                    <div className="text-sm text-gray-400">毎時30分に自動投稿</div>
                  </div>
                  <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    有効
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div>
                    <div className="font-medium">日次レポート</div>
                    <div className="text-sm text-gray-400">毎朝9時に送信</div>
                  </div>
                  <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    有効
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 最近の投稿 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <History className="w-5 h-5 mr-2" />
                最近の投稿
              </h2>
              <div className="space-y-3">
                {recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <div key={post.id} className="p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1 line-clamp-1">
                            {post.title}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span>{categories.find(c => c.id === post.category)?.icon}</span>
                            <span>{post.timestamp}</span>
                          </div>
                        </div>
                        <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                          公開
                        </div>
                      </div>
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
