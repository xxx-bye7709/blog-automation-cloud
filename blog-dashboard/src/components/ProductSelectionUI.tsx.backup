'use client';

import React, { useState } from 'react';
import { 
  Search, ShoppingBag, Loader2, AlertCircle, 
  CheckCircle, ArrowUp, ArrowDown, X, 
  Star, Package, Send, RefreshCw, FileText,
  ChevronRight, Sparkles
} from 'lucide-react';

interface Product {
  id: string;
  contentId?: string;
  productId?: string;
  title: string;
  price: string;
  listPrice?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  affiliateUrl: string;
  description?: string;
  maker?: string;
  genre?: string;
  actress?: string;
  director?: string;
  rating?: number;
  reviewCount?: number;
  releaseDate?: string;
  duration?: string;
  sampleImages?: string[];
  sampleMovie?: string | null;
}

const ProductSelectionUI: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [articleType, setArticleType] = useState('review');
  const [autoPublish, setAutoPublish] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const API_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
    'https://asia-northeast1-blog-automation-system.cloudfunctions.net';

  const searchProducts = async () => {
    if (!keyword.trim()) {
      setError('キーワードを入力してください');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setSearchPerformed(true);
    
    try {
      const response = await fetch(
        `${API_URL}/searchProductsForDashboard?keyword=${encodeURIComponent(keyword)}&limit=20`
      );
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
        setSelectedProducts([]);
        if (data.products.length === 0) {
          setError('商品が見つかりませんでした。別のキーワードをお試しください。');
        }
      } else {
        setError(data.error || '検索エラーが発生しました');
      }
    } catch (err) {
      setError('検索中にエラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      if (isSelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        if (prev.length >= 10) {
          setError('選択できる商品は最大10個までです');
          return prev;
        }
        return [...prev, product];
      }
    });
    setError('');
  };

  const generateArticle = async () => {
    if (selectedProducts.length === 0) {
      setError('商品を選択してください');
      return;
    }
    
    setGenerating(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`${API_URL}/generateArticleFromDashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keyword,
          selectedProducts,
          articleType,
          autoPublish,
          category: 'entertainment'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(
          autoPublish 
            ? `記事を生成してWordPressに投稿しました！（${data.productCount}商品）` 
            : `記事を生成しました！（${data.productCount}商品）`
        );
        
        if (data.wordpressPost?.url) {
          window.open(data.wordpressPost.url, '_blank');
        }
        
        setSelectedProducts([]);
        setProducts([]);
        setKeyword('');
        setSearchPerformed(false);
      } else {
        setError(data.error || '記事生成エラーが発生しました');
      }
    } catch (err) {
      setError('記事生成中にエラーが発生しました');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const moveSelectedUp = (index: number) => {
    if (index === 0) return;
    const newSelected = [...selectedProducts];
    [newSelected[index - 1], newSelected[index]] = [newSelected[index], newSelected[index - 1]];
    setSelectedProducts(newSelected);
  };

  const moveSelectedDown = (index: number) => {
    if (index === selectedProducts.length - 1) return;
    const newSelected = [...selectedProducts];
    [newSelected[index], newSelected[index + 1]] = [newSelected[index + 1], newSelected[index]];
    setSelectedProducts(newSelected);
  };

  const articleTypes = [
    { value: 'review', label: 'レビュー記事', emoji: '📝' },
    { value: 'ranking', label: 'ランキング記事', emoji: '🏆' },
    { value: 'comparison', label: '比較記事', emoji: '📊' }
  ];

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-gray-100">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              商品選択記事作成
            </h1>
          </div>
          <p className="text-gray-400 ml-16">
            DMM商品を検索・選択して、自動で記事を生成します
          </p>
        </div>

        {/* メインコンテナ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: 検索と設定 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 検索セクション */}
            <div className="bg-[#232937] rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-400" />
                商品検索
              </h2>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
                    placeholder="キーワードを入力（例: DVD, アニメ, アイドル）"
                    className="flex-1 px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={searchProducts}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-medium transition-all flex items-center gap-2 min-w-[120px] justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>検索中</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        <span>検索</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 記事タイプ選択 */}
                <div className="grid grid-cols-3 gap-3">
                  {articleTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setArticleType(type.value)}
                      className={`
                        px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                        ${articleType === type.value
                          ? 'bg-purple-500/20 text-purple-300 border-2 border-purple-500'
                          : 'bg-[#1a1f2e] text-gray-400 border-2 border-gray-700 hover:border-gray-600'
                        }
                      `}
                    >
                      <span>{type.emoji}</span>
                      <span className="text-sm">{type.label}</span>
                    </button>
                  ))}
                </div>

                {/* WordPress自動投稿 */}
                <label className="flex items-center gap-3 p-3 bg-[#1a1f2e] rounded-xl cursor-pointer hover:bg-[#1f2433] transition-colors">
                  <input
                    type="checkbox"
                    checked={autoPublish}
                    onChange={(e) => setAutoPublish(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 bg-[#1a1f2e]"
                  />
                  <span className="text-gray-300">自動でWordPressに投稿</span>
                </label>
              </div>
            </div>

            {/* 検索結果 */}
            {searchPerformed && !loading && (
              <div className="bg-[#232937] rounded-2xl border border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-400" />
                    検索結果
                    <span className="text-sm text-gray-400">（{products.length}件）</span>
                  </h2>
                  {products.length > 0 && (
                    <button
                      onClick={() => {
                        setKeyword('');
                        setProducts([]);
                        setSearchPerformed(false);
                      }}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {products.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">商品が見つかりませんでした</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2">
                    {products.map((product) => {
                      const isSelected = selectedProducts.some(p => p.id === product.id);
                      return (
                        <div
                          key={product.id}
                          onClick={() => toggleProductSelection(product)}
                          className={`
                            relative rounded-xl p-4 cursor-pointer transition-all
                            ${isSelected 
                              ? 'bg-purple-500/10 border-2 border-purple-500' 
                              : 'bg-[#1a1f2e] border-2 border-gray-700 hover:border-gray-600'
                            }
                          `}
                        >
                          <div className="flex gap-4">
                            {product.thumbnailUrl && (
                              <img
                                src={product.thumbnailUrl}
                                alt={product.title}
                                className="w-20 h-28 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="font-medium text-white mb-1 line-clamp-2">
                                {product.title}
                              </h3>
                              <p className="text-pink-400 font-bold mb-1">
                                {product.price}
                              </p>
                              {product.rating && product.rating > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <span className="text-xs text-gray-400">
                                    {product.rating} ({product.reviewCount}件)
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className={`
                              w-6 h-6 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center
                              ${isSelected 
                                ? 'bg-purple-500 border-purple-500' 
                                : 'border-gray-600'
                              }
                            `}>
                              {isSelected && (
                                <CheckCircle className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 右側: 選択商品と生成ボタン */}
          <div className="space-y-6">
            {/* 選択中の商品 */}
            <div className="bg-[#232937] rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                選択中の商品
                <span className="ml-auto text-sm bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg">
                  {selectedProducts.length}/10
                </span>
              </h2>
              
              {selectedProducts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500 text-sm">
                    商品を選択してください
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                  {selectedProducts.map((product, index) => (
                    <div key={product.id} className="bg-[#1a1f2e] rounded-lg p-3 flex items-center gap-3">
                      <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {product.title}
                        </p>
                        <p className="text-xs text-pink-400">
                          {product.price}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {articleType === 'ranking' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSelectedUp(index);
                              }}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSelectedDown(index);
                              }}
                              disabled={index === selectedProducts.length - 1}
                              className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProductSelection(product);
                          }}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 生成ボタン */}
              <button
                onClick={generateArticle}
                disabled={generating || selectedProducts.length === 0}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-medium transition-all flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>記事生成中...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span>記事を生成</span>
                  </>
                )}
              </button>
            </div>

            {/* 通知エリア */}
            {(error || success) && (
              <div className="space-y-3">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-400 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </p>
                  </div>
                )}
                
                {success && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-sm text-green-400 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{success}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionUI;
