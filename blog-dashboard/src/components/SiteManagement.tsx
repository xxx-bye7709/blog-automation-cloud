// blog-dashboard/src/components/SiteManagement.tsx
'use client';

import { useState, useEffect } from 'react';

interface Site {
  siteId: string;
  siteName: string;
  siteUrl: string;
  enabled: boolean;
  isDefault: boolean;
  postCount: number;
  lastPostDate: string | null;
  dmmConfigured: boolean;
}

interface SiteStatsResponse {
  success: boolean;
  totalSites: number;
  activeSites: number;
  stats: Site[];
}

export default function SiteManagement() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSiteStatus();
    // 30秒ごとに自動更新
    const interval = setInterval(loadSiteStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadSiteStatus() {
    try {
      const response = await fetch(
        'https://asia-northeast1-blog-automation-system.cloudfunctions.net/getSiteStats'
      );
      const data: SiteStatsResponse = await response.json();
      
      if (data.success) {
        setSites(data.stats);
        setError(null);
      } else {
        setError('サイト情報の取得に失敗しました');
      }
    } catch (error) {
      console.error('サイト情報の取得エラー:', error);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">📊 WordPress サイト管理</h2>
        <div className="text-center text-gray-400 py-8">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">📊 WordPress サイト管理</h2>
        <div className="text-center text-red-400 py-8">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">📊 WordPress サイト管理</h2>
        <span className="text-sm text-gray-400">
          全{sites.length}サイト / アクティブ: {sites.filter(s => s.enabled).length}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sites.map(site => (
          <SiteCard key={site.siteId} site={site} />
        ))}
      </div>
    </div>
  );
}

function SiteCard({ site }: { site: Site }) {
  return (
    <div 
      className={`
        relative rounded-lg p-4 border transition-all duration-200 hover:scale-105
        ${site.enabled 
          ? 'bg-gray-700 border-green-600/30 hover:border-green-500' 
          : 'bg-gray-800 border-gray-600 opacity-75'
        }
      `}
    >
      {/* サイト名とデフォルトアイコン */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-white">{site.siteName}</h3>
        {site.isDefault && (
          <span className="text-yellow-400" title="デフォルトサイト">⭐</span>
        )}
      </div>
      
      {/* URL */}
      <p className="text-xs text-gray-400 mb-3 truncate" title={site.siteUrl}>
        {site.siteUrl}
      </p>
      
      {/* バッジ */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span 
          className={`
            inline-block px-2 py-1 text-xs rounded-full font-medium
            ${site.enabled 
              ? 'bg-green-600/20 text-green-400' 
              : 'bg-gray-600/20 text-gray-400'
            }
          `}
        >
          {site.enabled ? '✅ 有効' : '⏸️ 無効'}
        </span>
        
        {site.dmmConfigured && (
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-600/20 text-purple-400 font-medium">
            🔧 DMM
          </span>
        )}
      </div>
      
      {/* 統計情報 */}
      <div className="border-t border-gray-600 pt-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">投稿数</span>
          <span className="text-white font-medium">{site.postCount}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">最終投稿</span>
          <span className="text-white">
            {site.lastPostDate 
              ? new Date(site.lastPostDate).toLocaleDateString('ja-JP', {
                  month: 'numeric',
                  day: 'numeric'
                })
              : 'なし'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
