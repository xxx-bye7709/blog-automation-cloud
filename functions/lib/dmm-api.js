// lib/dmm-api.js - 修正版

const axios = require('axios');

class DMMApi {
  constructor() {
    this.apiId = process.env.DMM_API_ID;
    this.affiliateId = process.env.DMM_AFFILIATE_ID;
    this.baseUrl = 'https://api.dmm.com/affiliate/v3/ItemList';
    
    console.log('DMM API initialized with:', {
      apiId: this.apiId ? `${this.apiId.substring(0, 8)}...` : 'NOT SET',
      affiliateId: this.affiliateId || 'NOT SET'
    });
  }

  async searchProducts(params = {}) {
    try {
      const searchParams = {
        api_id: this.apiId,
        affiliate_id: this.affiliateId,
        site: 'FANZA',  // FANZAサイトを使用
        service: 'digital',  // デジタルサービス
        floor: 'videoa',  // 動画フロア（アニメ・ゲーム等含む）
        keyword: params.keyword || 'アニメ',
        hits: params.hits || 20,
        sort: params.sort || 'rank',  // 人気順
        output: 'json'
      };

      console.log('DMM API Request params:', {
        ...searchParams,
        api_id: searchParams.api_id ? 'SET' : 'NOT SET'
      });

      const response = await axios.get(this.baseUrl, {
        params: searchParams,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Firebase Functions)',
          'Accept': 'application/json'
        }
      });

      console.log('DMM API Response status:', response.status);
      console.log('DMM API Response structure:', {
        hasData: !!response.data,
        hasResult: !!response.data?.result,
        resultCount: response.data?.result?.result_count,
        itemsCount: response.data?.result?.items?.length
      });

      // レスポンスの処理
      if (response.data && response.data.result) {
        const items = response.data.result.items || [];
        console.log(`DMM API: Found ${items.length} items`);
        
        // 商品データを整形して返す
        return items.map(item => ({
          contentId: item.content_id,
          productId: item.product_id,
          title: item.title,
          URL: item.URL,
          affiliateURL: item.affiliateURL || item.affiliateUrl || item.URL,
          imageURL: {
            small: item.imageURL?.small,
            large: item.imageURL?.large
          },
          prices: {
            price: item.prices?.price || item.price || '価格不明',
            list_price: item.prices?.list_price
          },
          iteminfo: {
            genre: item.iteminfo?.genre || [],
            series: item.iteminfo?.series || [],
            maker: item.iteminfo?.maker || [],
            actress: item.iteminfo?.actress || [],
            director: item.iteminfo?.director || [],
            label: item.iteminfo?.label || []
          },
          sample: {
            movie: item.sampleMovieURL?.size_720_480 || item.sampleMovieURL?.size_560_360,
            image: item.sampleImageURL?.sample_s || []
          },
          review: {
            count: item.review?.count || 0,
            average: item.review?.average || 0
          }
        }));
      }

      // 結果がない場合
      console.log('DMM API: No results found');
      return [];

    } catch (error) {
      console.error('DMM API Error:', error.message);
      
      if (error.response) {
        console.error('DMM API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // エラーメッセージの詳細を確認
        if (error.response.status === 403) {
          throw new Error('DMM API access denied. Please check API ID and Affiliate ID.');
        } else if (error.response.status === 400) {
          throw new Error('DMM API bad request. Check parameters.');
        }
      }
      
      throw error;
    }
  }

  // 複数のフロアで検索を試みる
  async searchProductsMultiFloor(params = {}) {
    const floors = [
      { service: 'digital', floor: 'videoa' },     // 動画（アニメ等）
      { service: 'digital', floor: 'anime' },      // アニメ専門
      { service: 'digital', floor: 'pcgame' },     // PCゲーム
      { service: 'mono', floor: 'dvd' },           // DVD
      { service: 'digital', floor: 'doujin' }      // 同人
    ];
    
    for (const floorConfig of floors) {
      try {
        console.log(`Trying floor: ${floorConfig.service}/${floorConfig.floor}`);
        
        const searchParams = {
          api_id: this.apiId,
          affiliate_id: this.affiliateId,
          site: 'FANZA',
          service: floorConfig.service,
          floor: floorConfig.floor,
          keyword: params.keyword || 'アニメ',
          hits: params.hits || 20,
          sort: params.sort || 'rank',
          output: 'json'
        };
        
        const response = await axios.get(this.baseUrl, {
          params: searchParams,
          timeout: 10000
        });
        
        if (response.data?.result?.items?.length > 0) {
          console.log(`Found ${response.data.result.items.length} items in ${floorConfig.floor}`);
          return this.formatProducts(response.data.result.items);
        }
      } catch (error) {
        console.log(`No results in ${floorConfig.floor}: ${error.message}`);
      }
    }
    
    return [];
  }
  
  // 商品データのフォーマット処理
  formatProducts(items) {
    return items.map(item => ({
      contentId: item.content_id,
      productId: item.product_id,
      title: item.title,
      URL: item.URL,
      affiliateURL: item.affiliateURL || item.affiliateUrl || item.URL,
      imageURL: {
        small: item.imageURL?.small,
        large: item.imageURL?.large
      },
      prices: {
        price: item.prices?.price || item.price || '価格不明',
        list_price: item.prices?.list_price
      },
      iteminfo: {
        genre: item.iteminfo?.genre || [],
        series: item.iteminfo?.series || [],
        maker: item.iteminfo?.maker || [],
        actress: item.iteminfo?.actress || [],
        director: item.iteminfo?.director || [],
        label: item.iteminfo?.label || []
      },
      sample: {
        movie: item.sampleMovieURL?.size_720_480 || item.sampleMovieURL?.size_560_360,
        image: item.sampleImageURL?.sample_s || []
      },
      review: {
        count: item.review?.count || 0,
        average: item.review?.average || 0
      }
    }));
  }

  // ジャンルIDで検索
  async searchByGenreId(genreId, params = {}) {
    try {
      const searchParams = {
        api_id: this.apiId,
        affiliate_id: this.affiliateId,
        site: 'FANZA',
        service: 'digital',
        floor: 'videoa',
        genre_id: genreId,  // ジャンルIDで検索
        hits: params.hits || 20,
        sort: params.sort || 'rank',
        output: 'json'
      };

      const response = await axios.get(this.baseUrl, {
        params: searchParams,
        timeout: 10000
      });

      if (response.data?.result?.items) {
        return this.formatProducts(response.data.result.items);
      }
      
      return [];
    } catch (error) {
      console.error('Genre search error:', error.message);
      return [];
    }
  }

  // テスト用：利用可能なジャンルを取得
  async getAvailableGenres() {
    try {
      const genreUrl = 'https://api.dmm.com/affiliate/v3/GenreSearch';
      const response = await axios.get(genreUrl, {
        params: {
          api_id: this.apiId,
          affiliate_id: this.affiliateId,
          floor_id: '43',  // videoa のフロアID
          output: 'json'
        }
      });
      
      return response.data?.result || [];
    } catch (error) {
      console.error('Genre fetch error:', error.message);
      return [];
    }
  }
}

// index.js に追加する DMM API診断関数

exports.testDMMApi = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 120 })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    
    try {
      console.log('=== DMM API Diagnostic Test ===');
      
      const DMMApi = require('./lib/dmm-api');
      const dmmApi = new DMMApi();
      
      const results = {
        timestamp: new Date().toISOString(),
        config: {
          hasApiId: !!process.env.DMM_API_ID,
          hasAffiliateId: !!process.env.DMM_AFFILIATE_ID,
          apiIdPrefix: process.env.DMM_API_ID ? process.env.DMM_API_ID.substring(0, 8) : null,
          affiliateId: process.env.DMM_AFFILIATE_ID
        },
        tests: []
      };
      
      // Test 1: 基本的なキーワード検索
      console.log('Test 1: Basic keyword search');
      try {
        const test1 = await dmmApi.searchProducts({
          keyword: '動画',
          hits: 5
        });
        results.tests.push({
          name: 'Basic search (動画)',
          success: true,
          count: test1.length,
          firstTitle: test1[0]?.title || null
        });
      } catch (error) {
        results.tests.push({
          name: 'Basic search (動画)',
          success: false,
          error: error.message,
          statusCode: error.response?.status
        });
      }
      
      // Test 2: 複数フロア検索
      console.log('Test 2: Multi-floor search');
      try {
        const test2 = await dmmApi.searchProductsMultiFloor({
          keyword: 'アニメ',
          hits: 5
        });
        results.tests.push({
          name: 'Multi-floor search (アニメ)',
          success: true,
          count: test2.length,
          firstTitle: test2[0]?.title || null
        });
      } catch (error) {
        results.tests.push({
          name: 'Multi-floor search (アニメ)',
          success: false,
          error: error.message
        });
      }
      
      // Test 3: 異なるサービスでの検索
      console.log('Test 3: Different service search');
      const testKeywords = ['DVD', 'ゲーム', 'アイドル', '映画'];
      for (const keyword of testKeywords) {
        try {
          const testResult = await dmmApi.searchProducts({
            keyword: keyword,
            hits: 3
          });
          results.tests.push({
            name: `Keyword search (${keyword})`,
            success: true,
            count: testResult.length,
            firstTitle: testResult[0]?.title || null
          });
        } catch (error) {
          results.tests.push({
            name: `Keyword search (${keyword})`,
            success: false,
            error: error.message
          });
        }
      }
      
      // Test 4: ジャンル一覧取得
      console.log('Test 4: Get available genres');
      try {
        const genres = await dmmApi.getAvailableGenres();
        results.tests.push({
          name: 'Get genres',
          success: true,
          count: genres.length || 0
        });
      } catch (error) {
        results.tests.push({
          name: 'Get genres',
          success: false,
          error: error.message
        });
      }
      
      // 結果サマリー
      const successCount = results.tests.filter(t => t.success).length;
      const totalCount = results.tests.length;
      
      results.summary = {
        totalTests: totalCount,
        successfulTests: successCount,
        failedTests: totalCount - successCount,
        successRate: `${Math.round((successCount / totalCount) * 100)}%`
      };
      
      // 推奨事項
      results.recommendations = [];
      
      if (successCount === 0) {
        results.recommendations.push('❌ DMM APIが完全に機能していません。API IDとアフィリエイトIDを確認してください。');
        results.recommendations.push('DMM APIダッシュボードでAPIキーの有効性を確認してください。');
      } else if (successCount < totalCount) {
        results.recommendations.push('⚠️ 一部のDMM API機能が動作していません。');
        results.recommendations.push('特定のフロアやサービスへのアクセス権限を確認してください。');
      } else {
        results.recommendations.push('✅ DMM APIは正常に動作しています。');
      }
      
      // 成功した検索があれば、その設定を推奨
      const successfulTests = results.tests.filter(t => t.success && t.count > 0);
      if (successfulTests.length > 0) {
        results.recommendations.push(`推奨キーワード: ${successfulTests[0].name}`);
      }
      
      console.log('=== DMM API Test Complete ===');
      res.status(200).json(results);
      
    } catch (error) {
      console.error('DMM API test error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  });

module.exports = DMMApi;
