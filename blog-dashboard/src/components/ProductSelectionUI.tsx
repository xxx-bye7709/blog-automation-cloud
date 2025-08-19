'use client';

import { useState } from 'react';
import { Search, Package, X } from 'lucide-react';

export default function ProductSelectionUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const searchProducts = async () => {
    if (!searchQuery.trim()) {
      setMessage('検索キーワードを入力してください');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/products/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      setProducts(data.products || []);
      setMessage(data.products?.length ? `${data.products.length}件見つかりました` : '商品が見つかりませんでした');
    } catch (error) {
      console.error('Search error:', error);
      setMessage('検索エラーが発生しました');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const generateReview = async () => {
    if (selectedProducts.length === 0) {
      setMessage('商品を選択してください');
      return;
    }

    setLoading(true);
    setMessage('記事生成中...');

    try {
      const response = await fetch('/api/products/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: selectedProducts,
          keyword: searchQuery,
          source: 'dmm'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ 記事生成成功！');
        setSelectedProducts([]);
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        setMessage(`エラー: ${data.error || '生成失敗'}`);
      }
    } catch (error) {
      setMessage('記事生成エラー');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* トリガーボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
      >
        <Package className="w-6 h-6" />
      </button>

      {/* モーダル */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* ヘッダー */}
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">商品記事作成</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-gray-700 p-1 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* コンテンツ */}
            <div className="p-6">
              {/* 検索バー */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
                  placeholder="商品検索キーワード"
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={searchProducts}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Search className="w-5 h-5 inline mr-2" />
                  検索
                </button>
              </div>

              {/* メッセージ */}
              {message && (
                <div className={`p-3 rounded-lg mb-4 ${
                  message.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {message}
                </div>
              )}

              {/* 商品リスト */}
              <div className="max-h-96 overflow-y-auto border rounded-lg p-2 mb-4">
                {products.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">商品を検索してください</p>
                ) : (
                  products.map((product, idx) => (
                    <label
                      key={idx}
                      className="flex items-start p-3 hover:bg-gray-50 cursor-pointer border-b"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, product]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(p => p !== product));
                          }
                        }}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.title}</h4>
                        <p className="text-sm text-gray-600">{product.description || product.comment}</p>
                        <p className="text-sm text-green-600 mt-1">{product.price}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {/* アクションボタン */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  選択: {selectedProducts.length}件
                </span>
                <button
                  onClick={generateReview}
                  disabled={loading || selectedProducts.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? '生成中...' : '商品レビュー作成'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
