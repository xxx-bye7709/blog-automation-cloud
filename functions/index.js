// functions/index.js - Firebase Functions v4形式（CORS対応版）
const functions = require('firebase-functions');

// CORS設定を追加
const cors = require('cors')({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://www.entamade.jp',
    /^https:\/\/.*\.vercel\.app$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// 遅延読み込み用の変数
let BlogAutomationTool;
let ImageGenerator;
let PerformanceSystem;
let WordPressMediaManager;

// 初期化関数
function loadModules() {
  if (!BlogAutomationTool) {
    BlogAutomationTool = require('./lib/blog-tool');
  }
  if (!ImageGenerator) {
    ImageGenerator = require('./lib/image-generator');
  }
  if (!PerformanceSystem) {
    PerformanceSystem = require('./lib/performance-system');
  }
  if (!WordPressMediaManager) {
    WordPressMediaManager = require('./lib/wordpress-media-manager');
  }
}

// グローバルインスタンス
let performanceSystem;
let mediaManager;

// サービス初期化
function initializeServices() {
  loadModules();
  if (!performanceSystem) {
    performanceSystem = new PerformanceSystem();
  }
  if (!mediaManager) {
    mediaManager = new WordPressMediaManager();
  }
}

// ヘルパー関数
const generateArticleForCategory = async (category) => {
  loadModules();
  const blogTool = new BlogAutomationTool();
  const article = await blogTool.generateArticle(category);
  const result = await blogTool.postToWordPress(article);
  return result;
};

// === 既存の記事生成関数（8カテゴリー） ===

// エンタメ記事生成
exports.generateEntertainmentArticle = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const result = await generateArticleForCategory('entertainment');
        res.json({ success: true, ...result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

// システムメトリクス取得
exports.getSystemMetrics = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        initializeServices();
        
        const demoMetrics = {
          totalPosts: 245,
          successRate: '98.5%',
          averageTimeSeconds: '25.3s',
          postsPerHour: 2.1,
          imageUploadSuccessRate: '95%',
          todayPosts: 12,
          monthlyPosts: 245,
          lastPost: new Date().toISOString()
        };
        
        const metrics = performanceSystem ? performanceSystem.getMetrics() : demoMetrics;
        const health = performanceSystem ? performanceSystem.isHealthy() : true;
        
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          health,
          metrics: metrics || demoMetrics,
          todayPosts: metrics.todayPosts || 12,
          monthlyPosts: metrics.monthlyPosts || 245,
          successRate: metrics.successRate || '98.5',
          target: {
            daily: 17,
            monthly: 500,
            currentRate: `${metrics.postsPerHour || 2.1} posts/hour`
          }
        });
      } catch (error) {
        console.error('System metrics error:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  });

// バッチ投稿機能
exports.batchGeneratePosts = functions
  .region('asia-northeast1')
  .runWith({ 
    timeoutSeconds: 540,
    memory: '1GB'
  })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        initializeServices();
        loadModules();
        
        const batchSize = parseInt(req.query.count) || 3;
        const category = req.query.category || 'random';
        
        console.log(`📦 Starting batch generation of ${batchSize} posts...`);
        
        const results = [];
        const categories = ['entertainment', 'anime', 'game', 'movie', 'music', 'tech', 'beauty', 'food'];
        
        for (let i = 0; i < batchSize; i++) {
          const targetCategory = category === 'random' 
            ? categories[Math.floor(Math.random() * categories.length)]
            : category;
          
          console.log(`📝 Generating post ${i + 1}/${batchSize} - Category: ${targetCategory}`);
          
          try {
            const blogTool = new BlogAutomationTool();
            const article = await blogTool.generateArticle(targetCategory);
            const postResult = await blogTool.postToWordPress(article);
            
            results.push({
              success: true,
              postId: postResult.postId,
              title: article.title,
              category: targetCategory,
              url: postResult.url
            });
            
            if (i < batchSize - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
          } catch (error) {
            results.push({
              success: false,
              error: error.message,
              category: targetCategory
            });
          }
        }
        
        const successCount = results.filter(r => r.success).length;
        
        res.json({
          success: true,
          message: `Batch generation completed: ${successCount}/${batchSize} successful`,
          generated: successCount,
          results,
          metrics: performanceSystem ? performanceSystem.getMetrics() : null,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Batch generation failed:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  });

// 他のカテゴリーの関数も同様に追加...
// (アニメ、ゲーム、映画、音楽、テック、美容、グルメ)

// === 新規追加：商品ファースト機能 ===

// 商品ファースト記事生成
exports.generateProductFirstArticle = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const category = req.query.category || 'entertainment';
        
        console.log('🎯 商品ファースト記事生成開始');
        
        const ProductFirstBlogTool = require('./lib/product-first-blog-tool');
        const blogTool = new ProductFirstBlogTool();
        
        const result = await blogTool.generateProductFocusedArticle(category);
        
        const BlogAutomationTool = require('./lib/blog-tool');
        const wpTool = new BlogAutomationTool();
        const postResult = await wpTool.postToWordPress(result.article);
        
        res.json({
          success: true,
          postId: postResult.postId,
          title: result.article.title,
          category: category,
          url: postResult.url,
          featuredProduct: {
            title: result.featuredProduct.title,
            price: result.featuredProduct.price,
            affiliateUrl: result.featuredProduct.affiliateUrl
          },
          message: '商品ファースト記事を投稿しました'
        });
        
      } catch (error) {
        console.error('商品ファースト記事生成エラー:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  });
