const fetch = require('node-fetch');

class DMMApi {
  constructor() {
    this.apiId = process.env.DMM_API_ID || '';
    this.affiliateId = process.env.DMM_AFFILIATE_ID || 'your-affiliate-id';
    this.apiUrl = 'https://api.dmm.com/affiliate/v3/ItemList';
  }

  async searchProducts(params = {}) {
    try {
      console.log('DMM API search params:', params);
      
      if (!this.apiId) {
        console.log('DMM API ID not configured, returning dummy data');
        return this.getDummyProducts(params.keyword || 'test');
      }

      const queryParams = new URLSearchParams({
        api_id: this.apiId,
        affiliate_id: this.affiliateId,
        keyword: params.keyword || '',
        hits: params.hits || 10,
        sort: params.sort || 'rank',
        output: 'json'
      });

      const response = await fetch(`${this.apiUrl}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`DMM API error: ${response.status}`);
      }

      const data = await response.json();
      return this.formatProducts(data.result?.items || []);
      
    } catch (error) {
      console.error('DMM API error:', error);
      return this.getDummyProducts(params.keyword || 'test');
    }
  }

  async getProductDetails(productId) {
    try {
      console.log('Getting product details for:', productId);
      
      if (!this.apiId) {
        return this.getDummyProductDetails(productId);
      }

      const queryParams = new URLSearchParams({
        api_id: this.apiId,
        affiliate_id: this.affiliateId,
        content_id: productId,
        output: 'json'
      });

      const response = await fetch(`${this.apiUrl}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`DMM API error: ${response.status}`);
      }

      const data = await response.json();
      const items = data.result?.items || [];
      return items[0] || this.getDummyProductDetails(productId);
      
    } catch (error) {
      console.error('Error getting product details:', error);
      return this.getDummyProductDetails(productId);
    }
  }

  /**
   * 商品データをレビュー用に準備
   */
  prepareReviewData(product) {
    if (!product) {
      product = this.getDummyProductDetails('test-001');
    }

    return {
      title: product.title || 'テスト商品',
      description: product.description || product.comment || '商品の説明',
      price: product.price || product.prices?.price || '価格未定',
      image_url: product.image_url || product.imageURL?.large || '',
      affiliate_url: product.affiliate_url || product.affiliateURL || '#',
      category: product.category || product.category_name || 'カテゴリ未設定',
      maker: product.maker || product.maker_name || 'メーカー未設定',
      features: this.extractFeatures(product),
      pros: this.generatePros(product),
      cons: this.generateCons(product),
      rating: this.generateRating(product),
      review_summary: this.generateReviewSummary(product)
    };
  }

  /**
   * 商品HTMLを生成（新規追加メソッド）
   */
  generateProductHtml(product, options = {}) {
    try {
      console.log('Generating product HTML for:', product.title || 'Product');
      
      // 商品データの検証と準備
      const productData = this.prepareReviewData(product);
      
      const html = `
        <div class="dmm-product-box">
          <h3>${productData.title}</h3>
          
          ${productData.image_url ? `
          <div class="product-image">
            <img src="${productData.image_url}" alt="${productData.title}" loading="lazy" />
          </div>` : ''}
          
          <div class="product-info">
            <table class="product-table">
              <tr>
                <th>価格</th>
                <td>${productData.price}</td>
              </tr>
              <tr>
                <th>メーカー</th>
                <td>${productData.maker}</td>
              </tr>
              <tr>
                <th>カテゴリ</th>
                <td>${productData.category}</td>
              </tr>
              ${productData.rating ? `
              <tr>
                <th>評価</th>
                <td>${this.formatRating(productData.rating)}</td>
              </tr>` : ''}
            </table>
            
            <div class="product-description">
              <p>${productData.description}</p>
            </div>
            
            ${productData.features && productData.features.length > 0 ? `
            <div class="product-features">
              <h4>特徴</h4>
              <ul>
                ${productData.features.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>` : ''}
            
            ${productData.affiliate_url && productData.affiliate_url !== '#' ? `
            <div class="product-cta">
              <a href="${productData.affiliate_url}" 
                 class="dmm-button" 
                 target="_blank" 
                 rel="nofollow noopener">
                詳細を見る
              </a>
            </div>` : ''}
          </div>
        </div>
        
        <style>
          .dmm-product-box {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            background: #f9f9f9;
          }
          .dmm-product-box h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.2em;
          }
          .product-image {
            text-align: center;
            margin: 15px 0;
          }
          .product-image img {
            max-width: 300px;
            height: auto;
            border-radius: 4px;
          }
          .product-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          .product-table th {
            background: #e0e0e0;
            padding: 8px;
            text-align: left;
            width: 30%;
          }
          .product-table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          .product-features ul {
            list-style: none;
            padding: 0;
          }
          .product-features li {
            padding: 5px 0;
            padding-left: 20px;
            position: relative;
          }
          .product-features li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #4CAF50;
          }
          .dmm-button {
            display: inline-block;
            padding: 12px 30px;
            background: #ff6b6b;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 15px;
            transition: background 0.3s;
          }
          .dmm-button:hover {
            background: #ff5252;
          }
          @media (max-width: 768px) {
            .product-image img {
              max-width: 100%;
            }
            .product-table th {
              width: 40%;
            }
          }
        </style>
      `;
      
      return html;
      
    } catch (error) {
      console.error('Error generating product HTML:', error);
      return '<div class="dmm-product-box"><p>商品情報の表示エラー</p></div>';
    }
  }

  /**
   * 複数商品のHTMLを生成
   */
  generateMultipleProductsHtml(products, options = {}) {
    try {
      if (!products || products.length === 0) {
        return '<p>関連商品が見つかりませんでした。</p>';
      }
      
      const title = options.title || 'おすすめ商品';
      let html = `
        <div class="dmm-products-section">
          <h2>${title}</h2>
          <div class="products-grid">
      `;
      
      products.forEach((product, index) => {
        if (index < (options.limit || 3)) {
          html += this.generateProductHtml(product, options);
        }
      });
      
      html += `
          </div>
        </div>
        
        <style>
          .dmm-products-section {
            margin: 30px 0;
          }
          .products-grid {
            display: grid;
            gap: 20px;
          }
          @media (min-width: 768px) {
            .products-grid {
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            }
          }
        </style>
      `;
      
      return html;
      
    } catch (error) {
      console.error('Error generating multiple products HTML:', error);
      return '';
    }
  }

  /**
   * 記事に商品を挿入
   */
  insertProductsIntoArticle(articleContent, products, position = 'middle') {
    try {
      const productsHtml = this.generateMultipleProductsHtml(products, {
        title: 'この記事で紹介した商品',
        limit: 3
      });
      
      if (position === 'middle') {
        // 記事の中間に挿入
        const paragraphs = articleContent.split('</p>');
        if (paragraphs.length > 3) {
          const insertIndex = Math.floor(paragraphs.length / 2);
          paragraphs.splice(insertIndex, 0, productsHtml);
          return paragraphs.join('</p>');
        }
      } else if (position === 'end') {
        // 記事の最後に挿入
        const lastH2 = articleContent.lastIndexOf('</h2>');
        if (lastH2 !== -1) {
          return articleContent.slice(0, lastH2 + 5) + productsHtml + articleContent.slice(lastH2 + 5);
        }
      }
      
      // デフォルト: 最後に追加
      return articleContent + productsHtml;
      
    } catch (error) {
      console.error('Error inserting products into article:', error);
      return articleContent;
    }
  }

  // ヘルパーメソッド
  extractFeatures(product) {
    const features = [];
    
    if (product.features) {
      return product.features;
    }
    
    // デフォルトの特徴
    features.push('高品質な仕上がり');
    features.push('使いやすいデザイン');
    
    if (product.price && product.price.includes('円')) {
      const priceNum = parseInt(product.price.replace(/[^0-9]/g, ''));
      if (priceNum < 3000) {
        features.push('手頃な価格');
      }
    }
    
    return features;
  }

  generatePros(product) {
    return [
      '品質が高い',
      '価格が手頃',
      'デザインが優れている'
    ];
  }

  generateCons(product) {
    return [
      '在庫が限られている場合がある',
      '人気商品のため売り切れることがある'
    ];
  }

  generateRating(product) {
    if (product.rating) return product.rating;
    return 4.0 + Math.random() * 0.5; // 4.0-4.5の範囲
  }

  formatRating(rating) {
    const stars = '⭐'.repeat(Math.floor(rating));
    const halfStar = (rating % 1 >= 0.5) ? '✨' : '';
    return `${stars}${halfStar} (${rating.toFixed(1)}/5.0)`;
  }

  generateReviewSummary(product) {
    return `${product.title || 'この商品'}は、${product.category || 'カテゴリ'}において優れた選択肢の一つです。`;
  }

  formatProducts(items) {
    return items.map(item => ({
      content_id: item.content_id,
      title: item.title,
      description: item.comment || '',
      price: item.prices?.price || '',
      image_url: item.imageURL?.large || item.imageURL?.small || '',
      affiliate_url: item.affiliateURL || '',
      category: item.category_name || '',
      maker: item.maker_name || '',
      rating: item.review?.average || null
    }));
  }

  getDummyProducts(keyword) {
    return [
      {
        content_id: 'dummy-001',
        title: `${keyword}関連商品1`,
        description: `${keyword}に関連する商品の説明文です。優れた品質と機能性を兼ね備えています。`,
        price: '1,980円',
        image_url: 'https://via.placeholder.com/300x400',
        affiliate_url: '#',
        category: 'テストカテゴリ',
        maker: 'テストメーカー',
        rating: 4.5
      },
      {
        content_id: 'dummy-002',
        title: `${keyword}関連商品2`,
        description: `${keyword}の別の商品説明です。コストパフォーマンスに優れた人気商品。`,
        price: '2,980円',
        image_url: 'https://via.placeholder.com/300x400',
        affiliate_url: '#',
        category: 'テストカテゴリ',
        maker: 'テストメーカー',
        rating: 4.2
      }
    ];
  }

  getDummyProductDetails(productId) {
    return {
      content_id: productId,
      title: `テスト商品 ${productId}`,
      description: 'これはテスト用の商品説明です。実際の商品データはDMM APIから取得されます。',
      comment: '優れた品質と機能性を兼ね備えた商品です。',
      price: '2,980円',
      prices: { price: '2,980円' },
      image_url: 'https://via.placeholder.com/500x500',
      imageURL: { large: 'https://via.placeholder.com/500x500' },
      affiliate_url: '#',
      affiliateURL: '#',
      category: 'テストカテゴリ',
      category_name: 'テストカテゴリ',
      maker: 'テストメーカー',
      maker_name: 'テストメーカー',
      rating: 4.3
    };
  }
}

module.exports = DMMApi;
