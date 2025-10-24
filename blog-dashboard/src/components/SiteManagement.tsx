'use client';

import { useState, useEffect } from 'react';

interface Site {
  siteId: string;
  siteName: string;
  siteUrl: string;
  enabled: boolean;
  isDefault: boolean;
  postCount?: number;
  lastPostDate?: string | null;
  dmmConfigured?: boolean;
}

export default function SiteManagement() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadSiteStatus();
    const interval = setInterval(loadSiteStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadSiteStatus() {
    try {
      const response = await fetch(
        'https://asia-northeast1-blog-automation-system.cloudfunctions.net/getSiteStats'
      );
      
      const data = await response.json();
      console.log('Loaded sites:', data);
      
      if (data.success && data.stats) {
        setSites(data.stats);
        setError(null);
      } else {
        setSites([]);
        setError('データ取得エラー');
      }
    } catch (error) {
      console.error('Error:', error);
      setSites([]);
      setError('ネットワークエラー');
    } finally {
      setLoading(false);
    }
  }

  const handleAddSite = async (formData: any) => {
    try {
      const response = await fetch(
        'https://asia-northeast1-blog-automation-system.cloudfunctions.net/addWordPressSite',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            skipConnectionTest: true,
            categories: ['entertainment', 'anime', 'game']
          })
        }
      );

      const result = await response.json();
      
      if (result.success) {
        alert('✅ サイトが追加されました');
        setShowAddForm(false);
        loadSiteStatus();
      } else {
        alert(`❌ エラー: ${result.error}`);
      }
    } catch (error) {
      alert('❌ 通信エラー');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">📊 WordPress サイト管理</h2>
        <span className="text-sm text-gray-400">
          全{sites.length}サイト / アクティブ: {sites.filter(s => s.enabled).length}
        </span>
      </div>

      <div className="mb-4">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ➕ 新規サイト追加
          </button>
        ) : (
          <AddSiteFormSimple 
            onSubmit={handleAddSite}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">読み込み中...</div>
      ) : error ? (
        <div className="text-center text-red-400 py-8">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sites.map(site => (
            <SiteCard key={site.siteId} site={site} onUpdate={loadSiteStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddSiteFormSimple({ onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    siteId: '',
    name: '',
    url: '',
    username: '',
    password: '',
    dmmApiKey: '',
    dmmAffiliateId: ''
  });

  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-4">新規サイト追加</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="サイトID"
          value={formData.siteId}
          onChange={(e) => setFormData({...formData, siteId: e.target.value})}
          className="px-3 py-2 bg-gray-600 text-white rounded"
        />
        <input
          type="text"
          placeholder="サイト名"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="px-3 py-2 bg-gray-600 text-white rounded"
        />
        <input
          type="url"
          placeholder="URL"
          value={formData.url}
          onChange={(e) => setFormData({...formData, url: e.target.value})}
          className="px-3 py-2 bg-gray-600 text-white rounded"
        />
        <input
          type="text"
          placeholder="ユーザー名"
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          className="px-3 py-2 bg-gray-600 text-white rounded"
        />
        <input
          type="password"
          placeholder="パスワード"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          className="px-3 py-2 bg-gray-600 text-white rounded"
        />
        <input
          type="text"
          placeholder="DMM API ID"
          value={formData.dmmApiKey}
          onChange={(e) => setFormData({...formData, dmmApiKey: e.target.value})}
          className="px-3 py-2 bg-gray-600 text-white rounded"
        />
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit(formData)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          追加
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

function SiteCard({ site, onUpdate }: { site: Site; onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: site.siteName,
    url: site.siteUrl,
    dmmApiKey: '',
    dmmAffiliateId: '',
    enabled: site.enabled
  });

  const handleUpdate = async () => {
    try {
      const response = await fetch(
        'https://asia-northeast1-blog-automation-system.cloudfunctions.net/updateSiteConfig',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId: site.siteId,
            ...editData
          })
        }
      );

      const result = await response.json();
      
      if (result.success) {
        alert('✅ 更新しました');
        setIsEditing(false);
        onUpdate();
      } else {
        alert(`❌ エラー: ${result.error}`);
      }
    } catch (error) {
      alert('❌ 更新エラー');
    }
  };

  if (isEditing) {
    return (
      <div className="bg-gray-700 rounded-lg p-4 border border-blue-500">
        <h3 className="font-semibold text-white mb-3">編集: {site.siteName}</h3>
        
        <div className="space-y-2 mb-3">
          <input
            type="text"
            placeholder="サイト名"
            value={editData.name}
            onChange={(e) => setEditData({...editData, name: e.target.value})}
            className="w-full px-2 py-1 text-sm bg-gray-600 text-white rounded"
          />
          <input
            type="url"
            placeholder="URL"
            value={editData.url}
            onChange={(e) => setEditData({...editData, url: e.target.value})}
            className="w-full px-2 py-1 text-sm bg-gray-600 text-white rounded"
          />
          <input
            type="text"
            placeholder="DMM API ID（オプション）"
            value={editData.dmmApiKey}
            onChange={(e) => setEditData({...editData, dmmApiKey: e.target.value})}
            className="w-full px-2 py-1 text-sm bg-gray-600 text-white rounded"
          />
          <input
            type="text"
            placeholder="DMMアフィリエイトID（オプション）"
            value={editData.dmmAffiliateId}
            onChange={(e) => setEditData({...editData, dmmAffiliateId: e.target.value})}
            className="w-full px-2 py-1 text-sm bg-gray-600 text-white rounded"
          />
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={editData.enabled}
              onChange={(e) => setEditData({...editData, enabled: e.target.checked})}
              className="mr-2"
            />
            有効
          </label>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleUpdate}
            className="flex-1 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            保存
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      relative rounded-lg p-4 border transition-all duration-200 hover:scale-105
      ${site.enabled
        ? 'bg-gray-700 border-green-600/30 hover:border-green-500'
        : 'bg-gray-800 border-gray-600 opacity-75'
      }
    `}>
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        title="編集"
      >
        ✏️
      </button>

      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-white">{site.siteName}</h3>
        {site.isDefault && (
          <span className="text-yellow-400" title="デフォルトサイト">⭐</span>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-3 truncate" title={site.siteUrl}>
        {site.siteUrl}
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`
          inline-block px-2 py-1 text-xs rounded-full font-medium
          ${site.enabled
            ? 'bg-green-600/20 text-green-400'
            : 'bg-gray-600/20 text-gray-400'
          }
        `}>
          {site.enabled ? '✅ 有効' : '⏸️ 無効'}
        </span>

        {site.dmmConfigured && (
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-600/20 text-purple-400 font-medium">
            🔧 DMM
          </span>
        )}
      </div>

      <div className="border-t border-gray-600 pt-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">投稿数</span>
          <span className="text-white font-medium">{site.postCount || 0}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">最終投稿</span>
          <span className="text-white">
            {site.lastPostDate || 'なし'}
          </span>
        </div>
      </div>
    </div>
  );
}