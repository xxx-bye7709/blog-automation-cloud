const axios = require('axios');

class DMMApi {
  constructor() {
    this.apiId = process.env.DMM_API_ID || '';
    this.affiliateId = process.env.DMM_AFFILIATE_ID || '';
    this.baseUrl = 'https://api.dmm.com/affiliate/v3';
  }

  async searchProducts(params = {}) {
    try {
      const defaultParams = {
        api_id: this.apiId,
        affiliate_id: this.affiliateId,
        site: 'DMM.com',  // 必須パラメータ
        service: 'digital', // 必須パラメータ  
        floor: 'videoa',   // 動画のフロア
        hits: params.hits || 10,
        sort: params.sort || 'rank',
        output: 'json'
      };

      // キーワード検索
      if (params.keyword) {
        defaultParams.keyword = params.keyword;
      }

      // ジャンル指定
      if (params.genre_id) {
        defaultParams.genre_id = params.genre_id;
      }

      console.log('DMM API Request:', `${this.baseUrl}/ItemList`);
      console.log('Params:', {...defaultParams, api_id: 'hidden'});

      const response = await axios.get(`${this.baseUrl}/ItemList`, {
        params: defaultParams
      });

      return this.formatProducts(response.data);
    } catch (error) {
      console.error('DMM API Error:', error.response?.data || error.message);
      return { success: false, items: [], error: error.response?.data };
    }
  }

  async getProductsByGenre(genre, limit = 5) {
    const genreMap = {
      'anime': { service: 'digital', floor: 'anime' },
      'game': { service: 'digital', floor: 'pcgame' },
      'movie': { service: 'digital', floor: 'videoa' },
      'idol': { service: 'digital', floor: 'idol' },
      'vr': { service: 'digital', floor: 'vr' },
      'adult': { service: 'digital', floor: 'videoa' }
    };

    const genreConfig = genreMap[genre] || genreMap['movie'];
    
    try {
      const params = {
        api_id: this.apiId,
        affiliate_id: this.affiliateId,
        site: 'DMM.com',
        service: genreConfig.service,
        floor: genreConfig.floor,
        hits: limit,
        sort: 'rank',
        output: 'json'
      };

      const response = await axios.get(`${this.baseUrl}/ItemList`, {
        params: params
      });

      return this.formatProducts(response.data);
    } catch (error) {
      console.error('Genre search error:', error.response?.data || error.message);
      return { success: false, items: [] };
    }
  }

  async getTrendingProducts(category = 'all', limit = 10) {
    const params = {
      api_id: this.apiId,
      affiliate_id: this.affiliateId,
      site: 'DMM.com',
      service: 'digital',
      floor: 'videoa',
      hits: limit,
      sort: 'rank',
      output: 'json'
    };

    try {
      const response = await axios.get(`${this.baseUrl}/ItemList`, {
        params: params
      });
      return this.formatProducts(response.data);
    } catch (error) {
      console.error('Trending search error:', error.response?.data || error.message);
      return { success: false, items: [] };
    }
  }

  formatProducts(data) {
    if (!data?.result?.items || data.result.items.length === 0) {
      console.log('No items found in response');
      return { success: false, items: [] };
    }

    const items = data.result.items.map(item => ({
      id: item.content_id || item.product_id,
      title: item.title,
      price: item.prices?.price || item.price || '価格不明',
      imageUrl: item.imageURL?.large || item.imageURL?.small || '',
      affiliateUrl: item.affiliateURL || item.URL,
      description: item.iteminfo?.series?.[0]?.name || '',
      maker: item.iteminfo?.maker?.[0]?.name || '',
      rating: item.review?.average || 0,
      genre: item.iteminfo?.genre?.[0]?.name || ''
    }));

    return {
      success: true,
      items: items,
      total: data.result.total_count || items.length,
      page: data.result.first_position || 1
    };
  }

  generateAffiliateLink(productUrl, campaign = 'blog_auto') {
    if (!productUrl) return '';
    const separator = productUrl.includes('?') ? '&' : '?';
    return `${productUrl}${separator}mtc=${campaign}`;
  }

  generateProductHtml(product, style = 'card') {
    if (style === 'card') {
      return `
<div class="dmm-product-card" style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 8px;">
  <div style="display: flex; gap: 15px;">
    <div style="flex-shrink: 0;">
      <a href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer">
        <img src="${product.imageUrl}" alt="${product.title}" style="width: 150px; height: auto;">
      </a>
    </div>
    <div style="flex-grow: 1;">
      <h3 style="margin-top: 0;">
        <a href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer" style="color: #333; text-decoration: none;">
          ${product.title}
        </a>
      </h3>
      <p style="color: #666; font-size: 14px;">${product.description || ''}</p>
      <div style="margin-top: 10px;">
        <span style="color: #ff6b6b; font-size: 18px; font-weight: bold;">¥${product.price}</span>
        ${product.rating ? `<span style="margin-left: 10px;">⭐ ${product.rating}</span>` : ''}
      </div>
      <a href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer" 
         style="display: inline-block; margin-top: 10px; padding: 8px 20px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 4px;">
        詳細を見る
      </a>
    </div>
  </div>
</div>`;
    }
    return `<a href="${product.affiliateUrl}" target="_blank">${product.title}</a>`;
  }

  async insertProductsIntoArticle(content, category, options = {}) {
    const { productCount = 3, insertPosition = 'middle', style = 'card' } = options;
    const products = await this.getProductsByGenre(category, productCount);
    
    if (!products.items || products.items.length === 0) {
      return content;
    }

    const paragraphs = content.split('\n\n');
    const insertionPoints = [];

    if (insertPosition === 'top') {
      insertionPoints.push(1);
    } else if (insertPosition === 'bottom') {
      insertionPoints.push(paragraphs.length - 1);
    } else {
      const interval = Math.floor(paragraphs.length / (productCount + 1));
      for (let i = 0; i < productCount; i++) {
        insertionPoints.push((i + 1) * interval);
      }
    }

    let insertedCount = 0;
    insertionPoints.forEach((point, index) => {
      if (products.items[index]) {
        const productHtml = this.generateProductHtml(products.items[index], style);
        const adjustedPoint = point + insertedCount;
        paragraphs.splice(adjustedPoint, 0, productHtml);
        insertedCount++;
      }
    });

    return paragraphs.join('\n\n');
  }
}

module.exports = DMMApi;
