'use client';

import { useState, useEffect } from 'react';

interface Site {
  id: string;
  name: string;
  url: string;
  hasDMM: boolean;
}

export default function ProductSelectionUI() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // サイト一覧を取得
  useEffect(() => {
    loadDMMSites();
  }, []);

  const loadDMMSites = async () => {
    try {
      const response = await fetch(
        'https://asia-northeast1-blog-automation-system.cloudfunctions.net/getDMMEnabledSites'
      );
      const data = await response.json();
      
      if (data.success && data.sites.length > 0) {
        setSites(data.sites);
        setSelectedSiteId(data.sites[0].id); // デフォルトで最初のサイトを選択
      }
    } catch (error) {
      console.error('Failed to load sites:', error);
      setMessage('サイト情報の取得に失敗しました');
    }
  };

  // 商品検索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage('検索キーワードを入力してください');
      return;
    }

    if (!selectedSiteId) {
      setMessage('サイトを選択してください');
      return;
    }

    setLoading(true);
    setMessage('検索中...');
    setProducts([]);

    try {
      const response = await fetch(
        `/api/products/search?query=${encodeURIComponent(searchQuery)}&siteId=${selectedSiteId}`
      );
      const data = await response.json();

      if (data.products && data.products.length > 0) {
        setProducts(data.products);
        setMessage(`${data.products.length}件の商品が見つかりました`);
      } else {
        setMessage('商品が見つかりませんでした（DMM APIが停止中の可能性があります）');
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage('検索エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 商品選択
  const toggleSelect = (product) => {
    const isSelected = selectedProducts.some(p =>
      (p.content_id && p.content_id === product.content_id) ||
      (p.title === product.title)
    );

    if (isSelected) {
      setSelectedProducts(selectedProducts.filter(p =>
        !((p.content_id && p.content_id === product.content_id) ||
          (p.title === product.title))
      ));
    } else {
      if (selectedProducts.length >= 5) {
        setMessage('選択できる商品は最大5個までです');
        return;
      }
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  // 記事生成
  const generateArticle = async () => {
    if (selectedProducts.length === 0) {
      setMessage('商品を選択してください');
      return;
    }

    if (!selectedSiteId) {
      setMessage('サイトを選択してください');
      return;
    }

    setLoading(true);
    setMessage('記事を生成中...');

    try {
      const response = await fetch('/api/products/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: selectedProducts,
          keyword: searchQuery,
          targetSiteId: selectedSiteId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ 記事が生成されました: ${data.title}`);
        setSelectedProducts([]);
        setProducts([]);
        setSearchQuery('');
      } else {
        setMessage(`エラー: ${data.error}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setMessage('記事生成エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">🛍️ 商品レビュー記事生成</h2>
      
      {/* サイト選択 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">投稿先サイト</label>
        <select
          value={selectedSiteId}
          onChange={(e) => setSelectedSiteId(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          disabled={sites.length === 0}
        >
          {sites.length === 0 ? (
            <option>DMM対応サイトなし</option>
          ) : (
            sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name} - {site.url}
              </option>
            ))
          )}
        </select>
      </div>

      {/* 検索ボックス */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="商品を検索..."
          className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !selectedSiteId}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600"
        >
          検索
        </button>
      </div>

      {/* メッセージ */}
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('エラー') ? 'bg-red-600' : 
          message.includes('✅') ? 'bg-green-600' : 'bg-gray-700'
        }`}>
          {message}
        </div>
      )}

      {/* 商品一覧 */}
      {products.length > 0 && (
        <div className="mb-4 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-2">商品一覧</h3>
          <div className="grid gap-2">
            {products.map((product, index) => (
              <div
                key={product.id || index}
                onClick={() => toggleSelect(product)}
                className={`p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 ${
                  selectedProducts.some(p => 
                    (p.content_id && p.content_id === product.content_id) ||
                    (p.title === product.title)
                  ) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="font-medium">{product.title}</div>
                <div className="text-sm text-gray-400">
                  {product.price} | {product.maker}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 選択中の商品 */}
      {selectedProducts.length > 0 && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <h3 className="text-lg font-semibold mb-2">
            選択中の商品 ({selectedProducts.length}/5)
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map((product, index) => (
              <span key={index} className="px-3 py-1 bg-blue-600 rounded-full text-sm">
                {product.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 記事生成ボタン */}
      <button
        onClick={generateArticle}
        disabled={loading || selectedProducts.length === 0 || !selectedSiteId}
        className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-600 font-semibold"
      >
        {loading ? '処理中...' : `記事を生成 ${selectedProducts.length > 0 ? `(${selectedProducts.length}商品)` : ''}`}
      </button>
    </div>
  );
}