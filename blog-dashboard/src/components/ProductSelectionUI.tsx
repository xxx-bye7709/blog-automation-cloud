'use client';

import { useState } from 'react';
import { Search, Package, AlertCircle, CheckCircle } from 'lucide-react';

export default function ProductSelectionUI() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 商品検索（GETメソッドを使用）
  const searchProducts = async () => {
    if (!searchQuery.trim()) {
      setError('検索キーワードを入力してください');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // GETリクエストを送信
      const response = await fetch(`/api/products/search?query=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`検索エラー: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setProducts(data.products || []);
      
      if (!data.products || data.products.length === 0) {
        setMessage('商品が見つかりませんでした');
      } else {
        setMessage(`${data.products.length}件の商品が見つかりました`);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || '検索中にエラーが発生しました');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 商品選択の切り替え
  const toggleProductSelection = (product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.content_id === product.content_id);
      if (isSelected) {
        return prev.filter(p => p.content_id !== product.content_id);
      } else {
        return [...prev, product];
      }
    });
  };

  // レビュー記事生成
  const generateReview = async () => {
    if (selectedProducts.length === 0) {
      setError('商品を選択してください');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/products/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: selectedProducts,
          keyword: searchQuery,
          source: 'dmm'
        }),
      });

      if (!response.ok) {
        throw new Error(`生成エラー: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessage('✅ レビュー記事の生成に成功しました！');
      
      // 成功後、選択をクリア
      setSelectedProducts([]);
      
      // 結果の詳細を表示
      if (data.postId) {
        setMessage(`✅ WordPress投稿完了！ Post ID: ${data.postId}`);
      }
    } catch (error) {
      console.error('Generate error:', error);
      setError(error.message || '記事生成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Package className="mr-2" />
          商品選択による記事生成
        </h2>

        {/* 検索フォーム */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
              placeholder="商品検索キーワード（例：アニメ、ゲーム）"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={searchProducts}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span className="ml-2">検索</span>
            </button>
          </div>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="mr-2" />
            {message}
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="mr-2" />
            {error}
          </div>
        )}

        {/* 商品リスト */}
        {products.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">検索結果</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {products.map((product, index) => (
                <div
                  key={product.content_id || index}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProducts.some(p => p.content_id === product.content_id)
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleProductSelection(product)}
                >
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={selectedProducts.some(p => p.content_id === product.content_id)}
                      onChange={() => {}}
                      className="mr-3 mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{product.title || 'タイトルなし'}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {product.description || product.comment || '説明なし'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-green-600 font-semibold">
                          {product.price || '価格未定'}
                        </span>
                        {product.category && (
                          <span className="text-gray-500">{product.category}</span>
                        )}
                        {product.maker && (
                          <span className="text-gray-500">{product.maker}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 選択商品数と生成ボタン */}
        {selectedProducts.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-700">
              選択中: {selectedProducts.length}件の商品
            </span>
            <button
              onClick={generateReview}
              disabled={loading}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '生成中...' : '選択した商品でレビュー記事を生成'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
