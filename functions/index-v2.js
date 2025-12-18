// functions/index-v2.js - 販売用バージョン
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Firebase Admin初期化
admin.initializeApp();

// ConfigManagerとBlogToolV2を読み込み
const { getInstance: getConfigManager } = require('./lib/config-manager');
const BlogToolV2 = require('./lib/blog-tool-v2');

// グローバル変数
let configManager = null;
let isInitialized = false;

/**
 * システム初期化
 */
async function initializeSystem() {
  if (isInitialized) return true;
  
  try {
    configManager = getConfigManager();
    configManager.loadConfig();
    isInitialized = true;
    console.log('✅ システム初期化完了');
    return true;
  } catch (error) {
    console.error('❌ システム初期化エラー:', error);
    throw error;
  }
}

/**
 * ライセンス情報取得
 */
exports.getLicenseInfo = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    cors(req, res, async () => {
      try {
        await initializeSystem();
        
        const licenseStatus = configManager.licenseStatus;
        
        res.json({
          success: true,
          license: {
            type: licenseStatus.type,
            email: licenseStatus.email,
            features: licenseStatus.features,
            valid: licenseStatus.valid
          }
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  });

/**
 * 記事生成API
 */
exports.generateArticle = functions
  .region('asia-northeast1')
  .runWith({ 
    timeoutSeconds: 300,
    memory: '1GB'
  })
  .https.onRequest(async (req, res) => {
    cors(req, res, async () => {
      try {
        await initializeSystem();
        
        const { 
          category = 'entertainment',
          keyword = null,
          siteId = null,
          autoPost = true
        } = req.body;
        
        // BlogToolV2インスタンスを作成
        const blogTool = new BlogToolV2(siteId);
        
        // 記事生成
        const article = await blogTool.generateArticle(category, {
          keyword: keyword,
          generateImage: configManager.hasFeature('hasImageGeneration')
        });
        
        // WordPressへの投稿
        let postResult = null;
        if (autoPost) {
          postResult = await blogTool.postToWordPress(article);
        }
        
        res.json({
          success: true,
          article: {
            title: article.title,
            category: article.category,
            tags: article.tags
          },
          post: postResult,
          remainingToday: (await configManager.checkArticleLimit()).remaining
        });
        
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  });

/**
 * 商品レビュー記事生成API
 */
exports.generateProductReview = functions
  .region('asia-northeast1')
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB'
  })
  .https.onRequest(async (req, res) => {
    cors(req, res, async () => {
      try {
        await initializeSystem();
        
        const {
          products,
          keyword,
          siteId = null,
          autoPost = true
        } = req.body;
        
        if (!products || products.length === 0) {
          throw new Error('商品データが必要です');
        }
        
        // BlogToolV2インスタンスを作成
        const blogTool = new BlogToolV2(siteId);
        
        // 商品レビュー生成
        const article = await blogTool.generateProductReview(
          products,
          keyword,
          {
            useDmmApi: configManager.hasFeature('hasDmmApi')
          }
        );
        
        // WordPressへの投稿
        let postResult = null;
        if (autoPost) {
          postResult = await blogTool.postToWordPress(article);
        }
        
        res.json({
          success: true,
          article: {
            title: article.title,
            productCount: products.length
          },
          post: postResult,
          remainingToday: (await configManager.checkArticleLimit()).remaining
        });
        
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  });

/**
 * WordPress接続テスト
 */
exports.testConnection = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    cors(req, res, async () => {
      try {
        await initializeSystem();
        
        const { siteId = null } = req.query;
        
        const blogTool = new BlogToolV2(siteId);
        
        // 簡単な接続テスト（XML-RPC）
        const testResult = await new Promise((resolve, reject) => {
          blogTool.xmlrpcClient.methodCall(
            'wp.getUsersBlogs',
            [blogTool.wordpressUser, blogTool.wordpressPassword],
            (error, blogs) => {
              if (error) {
                reject(error);
              } else {
                resolve(blogs);
              }
            }
          );
        });
        
        res.json({
          success: true,
          message: 'WordPress接続成功',
          site: blogTool.siteName,
          url: blogTool.siteUrl,
          blogs: testResult
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          message: 'WordPress接続失敗'
        });
      }
    });
  });

/**
 * 設定されたサイト一覧を取得
 */
exports.getSites = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    cors(req, res, async () => {
      try {
        await initializeSystem();
        
        const sites = configManager.getAllWordPressSites();
        const maxSites = configManager.licenseStatus.features.maxSites;
        
        res.json({
          success: true,
          sites: sites.map(site => ({
            id: site.id,
            name: site.name,
            url: site.url,
            enabled: site.enabled,
            isDefault: site.isDefault
          })),
          maxSites: maxSites,
          canAddMore: sites.length < maxSites
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  });

/**
 * システム統計情報
 */
exports.getStats = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    cors(req, res, async () => {
      try {
        await initializeSystem();
        
        // 統計情報を取得（簡易実装）
        const stats = {
          todayArticles: await configManager.getTodayArticleCount(),
          monthArticles: 0, // TODO: 実装
          totalSites: configManager.getAllWordPressSites().length,
          licenseType: configManager.licenseStatus.type,
          limits: {
            dailyLimit: configManager.licenseStatus.features.maxArticlesPerDay,
            monthlyLimit: configManager.licenseStatus.features.maxArticlesPerMonth,
            sitesLimit: configManager.licenseStatus.features.maxSites
          }
        };
        
        res.json({
          success: true,
          stats: stats
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  });

/**
 * ヘルスチェック
 */
exports.healthCheck = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    cors(req, res, async () => {
      try {
        await initializeSystem();
        
        const checks = {
          license: configManager.licenseStatus?.valid || false,
          config: !!configManager.config,
          openai: !!configManager.getOpenAIConfig().apiKey,
          wordpress: configManager.getAllWordPressSites().length > 0
        };
        
        const allHealthy = Object.values(checks).every(v => v === true);
        
        res.json({
          success: true,
          healthy: allHealthy,
          checks: checks,
          version: '1.0.0'
        });
        
      } catch (error) {
        res.json({
          success: false,
          healthy: false,
          error: error.message,
          version: '1.0.0'
        });
      }
    });
  });

console.log('🚀 Blog Automation System - 販売用バージョン起動');
