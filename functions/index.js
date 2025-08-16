// functions/index.js - Firebase Functions v4形式（CORS対応版）
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Firebase Admin初期化（重要！グローバルスコープで初期化）
admin.initializeApp();

// Firebase configから環境変数に設定
if (functions.config().openai && functions.config().openai.api_key) {
  process.env.OPENAI_API_KEY = functions.config().openai.api_key;
  console.log('✅ OpenAI API key loaded from Firebase config');
} else {
  console.log('⚠️ OpenAI API key not found in Firebase config, using .env file');
}

// .envファイルは自動的に読み込まれる（Firebase Functions v4.8.0以降）

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

// === ヘルパー関数 ===
const generateArticleForCategory = async (category) => {
  loadModules();
  const blogTool = new BlogAutomationTool();
  const article = await blogTool.generateArticle(category);
  const result = await blogTool.postToWordPress(article);
  return result;
};

// === SEOテスト関数（新規追加） ===

// SEO分析テスト
exports.testSEOAnalysis = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        loadModules();
        const blogTool = new BlogAutomationTool();
        const category = req.query.category || 'entertainment';
        
        console.log('🔍 SEO Analysis Test Starting...');
        
        // テスト記事を生成（投稿はしない）
        const article = await blogTool.generateArticle(category);
        
        // SEO分析
        const focusKeyword = article.focusKeyword || article.tags[0];
        const keywordCount = (article.content.match(new RegExp(focusKeyword, 'gi')) || []).length;
        const externalLinkCount = (article.content.match(/<a\s+href="https?:\/\/(?!www\.entamade\.jp)/gi) || []).length;
        const internalLinkCount = (article.content.match(/<a\s+href="https?:\/\/www\.entamade\.jp/gi) || []).length;
        const h2Count = (article.content.match(/<h2>/gi) || []).length;
        const h3Count = (article.content.match(/<h3>/gi) || []).length;
        
        // 第一段落のチェック
        const firstParagraph = article.content.match(/<p>([^<]+)<\/p>/);
        const hasKeywordInFirst = firstParagraph && firstParagraph[1].toLowerCase().includes(focusKeyword.toLowerCase());
        
        // メタディスクリプションのチェック
        const hasKeywordInMeta = article.metaDescription && article.metaDescription.toLowerCase().includes(focusKeyword.toLowerCase());
        
        const seoReport = {
          success: true,
          title: article.title,
          focusKeyword: focusKeyword,
          seoScore: {
            keywordInFirstParagraph: hasKeywordInFirst,
            keywordDensity: keywordCount,
            keywordInMetaDescription: hasKeywordInMeta,
            externalLinks: externalLinkCount,
            internalLinks: internalLinkCount,
            h2Tags: h2Count,
            h3Tags: h3Count,
            contentLength: article.content.replace(/<[^>]*>/g, '').length
          },
          checks: {
            '✅ キーフレーズが第一段落に含まれている': hasKeywordInFirst,
            '✅ キーフレーズ密度が適切（5-8回）': keywordCount >= 5 && keywordCount <= 8,
            '✅ 外部リンクが2つ以上': externalLinkCount >= 2,
            '✅ 内部リンクがある': internalLinkCount > 0,
            '✅ H2タグが2つ以上': h2Count >= 2,
            '✅ H3タグがある': h3Count > 0,
            '✅ メタディスクリプションにキーフレーズ': hasKeywordInMeta,
            '✅ 文字数が1500文字以上': article.content.replace(/<[^>]*>/g, '').length >= 1500
          },
          metaDescription: article.metaDescription,
          excerpt: article.excerpt,
          category: category,
          tags: article.tags,
          timestamp: new Date().toISOString()
        };
        
        // スコア計算
        const passedChecks = Object.values(seoReport.checks).filter(v => v === true).length;
        const totalChecks = Object.keys(seoReport.checks).length;
        seoReport.overallScore = `${Math.round((passedChecks / totalChecks) * 100)}%`;
        
        console.log('📊 SEO Analysis Complete:', seoReport.overallScore);
        
        res.json(seoReport);
        
      } catch (error) {
        console.error('SEO Analysis Error:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  });

// SEO最適化記事投稿テスト
exports.testSEOOptimizedPost = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        loadModules();
        const blogTool = new BlogAutomationTool();
        const category = req.query.category || 'entertainment';
        const keyword = req.query.keyword || null;
        
        console.log('🔍 SEO Optimized Post Test Starting...');
        console.log(`Category: ${category}, Keyword: ${keyword || 'auto'}`);
        
        // SEO最適化記事を生成
        const article = await blogTool.generateArticle(category);
        
        // カスタムキーワードが指定されている場合は上書き
        if (keyword) {
          article.focusKeyword = keyword;
          article.content = blogTool.enhancedSEOOptimization(
            article.content,
            keyword,
            category,
            article.title
          );
          article.metaDescription = blogTool.generateSEOMetaDescription(
            article.content,
            keyword,
            article.title
          );
        }
        
        // WordPress投稿
        const result = await blogTool.postToWordPress(article);
        
        // SEO分析レポート
        const focusKeyword = article.focusKeyword;
        const keywordCount = (article.content.match(new RegExp(focusKeyword, 'gi')) || []).length;
        const externalLinkCount = (article.content.match(/<a\s+href="https?:\/\/(?!www\.entamade\.jp)/gi) || []).length;
        const internalLinkCount = (article.content.match(/<a\s+href="https?:\/\/www\.entamade\.jp/gi) || []).length;
        
        res.json({
          success: true,
          message: 'SEO optimized post created successfully',
          postId: result.postId,
          url: result.url,
          title: result.title,
          focusKeyword: focusKeyword,
          seoMetrics: {
            keywordDensity: keywordCount,
            externalLinks: externalLinkCount,
            internalLinks: internalLinkCount,
            metaDescription: article.metaDescription,
            contentLength: article.content.replace(/<[^>]*>/g, '').length
          },
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('SEO Optimized Post Error:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  });

// SEOヘルスチェック（全カテゴリー）
exports.seoHealthCheck = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        loadModules();
        const blogTool = new BlogAutomationTool();
        
        const categories = ['entertainment', 'anime', 'game', 'movie', 'music', 'tech', 'beauty', 'food'];
        const results = {};
        
        console.log('🏥 SEO Health Check Starting for all categories...');
        
        for (const category of categories) {
          console.log(`Checking ${category}...`);
          
          const article = await blogTool.generateArticle(category);
          const focusKeyword = article.focusKeyword || article.tags[0];
          
          const keywordCount = (article.content.match(new RegExp(focusKeyword, 'gi')) || []).length;
          const externalLinkCount = (article.content.match(/<a\s+href="https?:\/\/(?!www\.entamade\.jp)/gi) || []).length;
          const firstParagraph = article.content.match(/<p>([^<]+)<\/p>/);
          const hasKeywordInFirst = firstParagraph && firstParagraph[1].toLowerCase().includes(focusKeyword.toLowerCase());
          const hasKeywordInMeta = article.metaDescription && article.metaDescription.toLowerCase().includes(focusKeyword.toLowerCase());
          
          const checks = {
            keywordInFirstParagraph: hasKeywordInFirst,
            keywordDensity: keywordCount >= 5 && keywordCount <= 8,
            externalLinks: externalLinkCount >= 2,
            metaDescription: hasKeywordInMeta
          };
          
          const passedChecks = Object.values(checks).filter(v => v === true).length;
          const score = Math.round((passedChecks / 4) * 100);
          
          results[category] = {
            score: `${score}%`,
            focusKeyword: focusKeyword,
            checks: checks,
            metrics: {
              keywordCount,
              externalLinkCount,
              contentLength: article.content.replace(/<[^>]*>/g, '').length
            }
          };
        }
        
        // 全体スコア計算
        const scores = Object.values(results).map(r => parseInt(r.score));
        const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        
        res.json({
          success: true,
          overallScore: `${overallScore}%`,
          categoryResults: results,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('SEO Health Check Error:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  });

// === 既存の記事生成関数（8カテゴリー） - CORS対応 ===

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

// アニメ記事生成
exports.generateAnimeArticle = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const result = await generateArticleForCategory('anime');
        res.json({ success: true, ...result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

// ゲーム記事生成
exports.generateGameArticle = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const result = await generateArticleForCategory('game');
        res.json({ success: true, ...result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

// 映画記事生成
exports.generateMovieArticle = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const result = await generateArticleForCategory('movie');
        res.json({ success: true, ...result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

// 音楽記事生成
exports.generateMusicArticle = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const result = await generateArticleForCategory('music');
        res.json({ success: true, ...result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

// テック記事生成
exports.generateTechArticle = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const result = await generateArticleForCategory('tech');
        res.json({ success: true, ...result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

// 美容記事生成
exports.generateBeautyArticle = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const result = await generateArticleForCategory('beauty');
        res.json({ success: true, ...result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

// グルメ記事生成
exports.generateFoodArticle = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const result = await generateArticleForCategory('food');
        res.json({ success: true, ...result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

// ランダム記事生成
exports.generateRandomArticle = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const categories = ['entertainment', 'anime', 'game', 'movie', 'music', 'tech', 'beauty', 'food'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const result = await generateArticleForCategory(randomCategory);
        res.json({ success: true, category: randomCategory, ...result });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

// === 🆕 XML-RPC画像アップロードテスト機能 ===

// XML-RPC画像アップロードテスト
exports.testXMLRPCImageUpload = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        loadModules();
        const blogTool = new BlogAutomationTool();
        
        console.log('🖼️ XML-RPC画像アップロードテスト開始...');
        
        // テスト画像URLを使用（またはDALL-E生成）
        let testImageUrl = req.query.imageUrl || 'https://via.placeholder.com/1200x630/4FC3F7/FFFFFF?text=XML-RPC+Test';
        
        // DALL-E 3で新しい画像を生成する場合
        if (req.query.generate === 'true') {
          const imageGenerator = new ImageGenerator();
          const prompt = 'Beautiful modern blog header image with vibrant colors';
          const imageResult = await imageGenerator.generateImage(prompt, '1792x1024', 'standard');
          if (imageResult.success) {
            testImageUrl = imageResult.imageUrl;
            console.log('✅ DALL-E 3画像生成成功');
          }
        }
        
        // XML-RPCでアップロード
        const filename = `test-image-${Date.now()}.png`;
        const mediaInfo = await blogTool.uploadImageViaXMLRPC(testImageUrl, filename);
        
        res.json({
          success: true,
          message: 'XML-RPC画像アップロードテスト完了',
          testImageUrl: testImageUrl,
          uploadResult: mediaInfo,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('XML-RPC画像アップロードテストエラー:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message
        });
      }
    });
  });

// 既存記事の画像修復
exports.fixMissingImage = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        loadModules();
        const blogTool = new BlogAutomationTool();
        
        const postId = req.query.postId || req.body.postId;
        if (!postId) {
          return res.status(400).json({
            success: false,
            error: 'postIdが必要です'
          });
        }
        
        console.log(`🔧 Post ${postId} の画像修復開始...`);
        
        // 画像生成
        const imageGenerator = new ImageGenerator();
        const prompt = `Blog featured image for post ${postId}`;
        const imageResult = await imageGenerator.generateImage(prompt, '1792x1024', 'standard');
        
        if (!imageResult.success) {
          throw new Error('画像生成に失敗しました');
        }
        
        // 画像をアップロード
        const filename = `post-${postId}-featured-${Date.now()}.png`;
        const mediaInfo = await blogTool.uploadImageViaXMLRPC(imageResult.imageUrl, filename);
        
        // 記事にアイキャッチ画像を設定
        if (mediaInfo && mediaInfo.id) {
          await blogTool.setFeaturedImage(postId, mediaInfo.id);
        }
        
        res.json({
          success: true,
          message: `Post ${postId} の画像を修復しました`,
          postId: postId,
          imageUrl: imageResult.imageUrl,
          attachmentId: mediaInfo ? mediaInfo.id : null,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('画像修復エラー:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message
        });
      }
    });
  });

// 画像付き記事生成テスト（完全版）
exports.testCompleteArticleWithImage = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        loadModules();
        const blogTool = new BlogAutomationTool();
        const category = req.query.category || 'entertainment';
        
        console.log('🚀 画像付き完全記事生成テスト開始...');
        
        const startTime = Date.now();
        
        // 記事生成（画像生成も含む）
        const article = await blogTool.generateArticle(category);
        
        // WordPressに投稿（画像アップロードも含む）
        const result = await blogTool.postToWordPress(article);
        
        const duration = Date.now() - startTime;
        
        res.json({
          success: true,
          message: '画像付き記事を正常に投稿しました',
          postId: result.postId,
          url: result.url,
          title: result.title,
          attachmentId: result.attachmentId,
          imageUrl: result.imageUrl,
          category: category,
          focusKeyword: result.focusKeyword,
          metaDescription: result.metaDescription,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('画像付き記事生成テストエラー:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message
        });
      }
    });
  });

// === 以下、既存のコードを維持 ===

// シンプルHTML版 人間関係記事生成
exports.generateAdultArticle = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      const startTime = Date.now();
      
      try {
        console.log('💝 シンプルHTML版 人間関係記事生成開始...');
        
        const contentLevel = req.query.level || 'general';
        
        loadModules();
        const blogTool = new BlogAutomationTool();
        
        // シンプルHTML版記事生成
        const article = await generateSimpleHTMLRelationshipArticle(blogTool, contentLevel);
        
        // WordPress投稿（画像も含む）
        const result = await blogTool.postToWordPress({
          ...article,
          category: 'selfhelp',
          tags: [...article.tags, '自己啓発', '人間関係', '心理学'],
          meta: {
            contentLevel: contentLevel,
            targetAudience: 'general',
            htmlVersion: 'simple'
          }
        });
        
        const duration = Date.now() - startTime;
        console.log(`✅ シンプルHTML版記事投稿完了 (${duration}ms)`);
        
        res.json({
          success: true,
          message: 'シンプルHTML版人間関係記事が正常に投稿されました',
          postId: result.postId,
          url: result.url,
          title: result.title,
          attachmentId: result.attachmentId,
          category: 'selfhelp',
          htmlVersion: 'simple',
          contentLevel: contentLevel,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('シンプルHTML版記事生成エラー:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          category: 'selfhelp',
          htmlVersion: 'simple'
        });
      }
    });
  });

// シンプルHTML版記事生成関数
async function generateSimpleHTMLRelationshipArticle(blogTool, contentLevel = 'general') {
  const healthyTopics = {
    strict: [
      'コミュニケーション能力の向上方法',
      '信頼関係を築くコツ',
      '効果的な会話術',
      'チームワークの重要性'
    ],
    general: [
      '人間関係を良好にする方法',
      'コミュニケーションスキルアップ',
      '信頼される人になるには',
      '職場での人間関係改善',
      '友情を深める秘訣'
    ],
    relaxed: [
      '人間関係の悩み解決法',
      'ソーシャルスキルの向上',
      '心理学から学ぶ人間関係',
      '良い人間関係の築き方',
      'コミュニティでの立ち回り方'
    ]
  };
  
  const topics = healthyTopics[contentLevel] || healthyTopics.general;
  const selectedTopic = topics[Math.floor(Math.random() * topics.length)];
  
  const prompt = `
あなたは人間関係改善の専門家です。
以下の要件に従って、実用的な記事を書いてください。

【トピック】: ${selectedTopic}
【対象読者】: 人間関係を改善したいすべての人
【重要な制約】: HTMLはシンプルなタグのみ使用（p, h2, h3, ul, li, strong, em）

【記事の方針】:
1. 科学的根拠に基づく内容
2. 実践しやすい具体的なアドバイス
3. 誰でも活用できる普遍的な内容
4. 前向きで建設的なメッセージ

【HTML制約】:
- スタイル属性は使用しない
- divタグは使用しない
- 複雑なHTMLは避ける
- 基本的なタグのみ（p, h2, h3, ul, li, strong, em）

【記事構造】:
- タイトル: わかりやすく、実用的
- 導入（なぜこのスキルが重要か）
- 本文（具体的な方法・コツ）
- 実践例
- まとめ（行動につながるメッセージ）

【文字数】: 1000-1400文字
【トーン】: 親しみやすく、励ましの気持ちを込めて

基本的なHTMLタグのみを使用して構造化してください。`;

  try {
    const response = await blogTool.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `あなたは人間関係とコミュニケーションの専門家です。シンプルなHTMLのみを使用して、実践的で価値のあるアドバイスを提供します。`
        },
        {
          role: 'user', 
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    
    // シンプルHTML版コンテンツ構造化
    return parseSimpleHTMLContent(content, contentLevel, selectedTopic);
    
  } catch (error) {
    console.error('シンプルHTML版記事GPT生成エラー:', error);
    return generateFallbackSimpleArticle(selectedTopic, contentLevel);
  }
}

// シンプルHTML版コンテンツ構造化
function parseSimpleHTMLContent(content, contentLevel, topic) {
  // タイトル抽出・調整
  const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i) || 
                     content.match(/^#\s+(.+)$/m);
  
  let title = titleMatch 
    ? titleMatch[1].replace(/<[^>]*>/g, '').trim()
    : `${topic}のための実践ガイド`;

  // シンプルな案内を記事の最初に追加（スタイルなし）
  const simpleNotice = `
<p><strong>より良い人間関係のために</strong></p>
<p>科学的根拠に基づいた実践的なアドバイスをお届けします。皆様の人間関係がより豊かになることを願っています。</p>
`;

  // 本文を整形（複雑なHTMLを削除）
  let bodyContent = content;
  if (titleMatch) {
    bodyContent = content.replace(titleMatch[0], '').trim();
  }
  
  // スタイル属性とdivタグを削除
  bodyContent = bodyContent
    .replace(/style="[^"]*"/g, '')  // style属性を削除
    .replace(/<div[^>]*>/g, '')     // 開始divタグを削除
    .replace(/<\/div>/g, '')       // 終了divタグを削除
    .replace(/class="[^"]*"/g, '')  // class属性も削除
    .replace(/id="[^"]*"/g, '');    // id属性も削除
  
  // シンプルな案内を本文の最初に挿入
  bodyContent = simpleNotice + bodyContent;
  
  // シンプルな励ましメッセージを追加
  const simpleFooter = `
<h3>実践して成長しましょう</h3>
<ul>
  <li>小さな一歩から始めることが大切です</li>
  <li>継続することで必ず変化が現れます</li>
  <li>周りの人との関係がより良くなることを願っています</li>
  <li>困った時は信頼できる人に相談してみてください</li>
</ul>
<p><strong>継続することで必ず良い変化が現れます。今日から実践してみませんか？</strong></p>
`;

  bodyContent += simpleFooter;

  // 抜粋生成（シンプルな表現）
  const plainText = bodyContent.replace(/<[^>]*>/g, '');
  const excerpt = `人間関係改善のための実践的アドバイス。${plainText.substring(0, 100)}...`;

  return {
    title,
    content: bodyContent,
    excerpt,
    category: 'selfhelp',
    tags: ['人間関係', 'コミュニケーション', '自己啓発', topic, '心理学', '実践ガイド'],
    status: 'publish',
    format: 'standard',
    author: 1,
    meta: {
      targetAudience: 'general',
      contentType: 'relationship-advice',
      contentLevel: contentLevel,
      htmlVersion: 'simple'
    }
  };
}

// フォールバックシンプル記事
function generateFallbackSimpleArticle(topic, contentLevel) {
  return {
    title: `${topic}のための実践ガイド`,
    content: `
<p><strong>より良い人間関係のために</strong></p>
<p>科学的根拠に基づいた実践的なアドバイスをお届けします。</p>

<p>${topic}について、実践的な観点から情報をお届けします。</p>

<h2>なぜ重要なのか</h2>
<p>良好な人間関係は、私たちの人生に大きな価値をもたらします。</p>

<h2>実践的なアプローチ</h2>
<p>小さな一歩から始めて、継続的に改善していくことが大切です。</p>

<h3>具体的な方法</h3>
<ul>
  <li>相手の話をよく聞く</li>
  <li>感謝の気持ちを表現する</li>
  <li>誠実なコミュニケーションを心がける</li>
  <li>相手の立場に立って考える</li>
</ul>

<h2>まとめ</h2>
<p>皆様の人間関係がより豊かになることを心から願っています。</p>

<h3>実践して成長しましょう</h3>
<p><strong>継続することで必ず良い変化が現れます。今日から始めてみませんか？</strong></p>
`,
    excerpt: `${topic}について、実践的な観点から人間関係改善のアドバイスをお届けします。`,
    category: 'selfhelp',
    tags: ['人間関係', 'コミュニケーション', topic, '自己啓発'],
    status: 'publish'
  };
}

// === 以下、既存のテスト関数とその他の機能をすべて維持 ===

// テストブログ投稿（強化版）
exports.testBlogPost = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        initializeServices();
        loadModules();
        
        const startTime = Date.now();
        const category = req.query.category || 'entertainment';
        
        console.log(`🚀 Enhanced blog post test - Category: ${category}`);
        
        const blogTool = new BlogAutomationTool();
        
        // 記事生成と投稿（画像アップロード含む）
        const article = await blogTool.generateArticle(category);
        const postResult = await blogTool.postToWordPress(article);
        
        const duration = Date.now() - startTime;
        
        res.json({
          success: true,
          message: 'Enhanced blog post created successfully',
          postId: postResult.postId,
          title: article.title,
          category: article.category,
          imageUrl: postResult.imageUrl,
          attachmentId: postResult.attachmentId,
          url: postResult.url,
          focusKeyword: postResult.focusKeyword,
          metaDescription: postResult.metaDescription,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Enhanced blog post test failed:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message
        });
      }
    });
  });

// バッチ投稿機能（SEO最適化版）
exports.batchGenerateSEOPosts = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '2GB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        loadModules();
        const blogTool = new BlogAutomationTool();
        
        const count = Math.min(parseInt(req.query.count) || 5, 10); // 最大10記事
        const categories = ['entertainment', 'anime', 'game', 'movie', 'music', 'tech', 'beauty', 'food'];
        
        console.log(`📦 Batch generating ${count} SEO-optimized posts...`);
        
        const results = [];
        
        for (let i = 0; i < count; i++) {
          const category = categories[i % categories.length];
          console.log(`Generating post ${i + 1}/${count} in ${category}...`);
          
          try {
            const article = await blogTool.generateArticle(category);
            const postResult = await blogTool.postToWordPress(article);
            
            results.push({
              success: true,
              postId: postResult.postId,
              url: postResult.url,
              title: postResult.title,
              category: category,
              focusKeyword: postResult.focusKeyword
            });
            
            // レート制限対策
            await new Promise(resolve => setTimeout(resolve, 3000));
            
          } catch (error) {
            results.push({
              success: false,
              category: category,
              error: error.message
            });
          }
        }
        
        const successCount = results.filter(r => r.success).length;
        
        res.json({
          success: true,
          message: `Batch generation complete: ${successCount}/${count} posts created`,
          results: results,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Batch generation error:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message
        });
      }
    });
  });

// システムメトリクス取得API（ダッシュボード用）
exports.getSystemMetrics = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 60 })
  .https.onRequest(async (req, res) => {
    // CORS対応
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      // テスト用のダミーデータ
      const metrics = {
        todayCount: 3,
        monthCount: 45,
        totalCount: 279,
        successCount: 275,
        failedCount: 4,
        successRate: 98,
        systemStatus: 'online',
        lastPost: {
          title: '【2025/8/13】エンターテインメントの最新情報まとめ',
          postId: '279',
          createdAt: new Date().toISOString()
        },
        serverTime: new Date().toISOString(),
        targets: {
          daily: 20,
          monthly: 500
        }
      };
      
      res.status(200).json({
        success: true,
        data: metrics
      });
      
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

// functions/index.js に追加する関数（修正版）
// 既存のindex.jsの最後に以下を追加してください

// ScheduleManagerクラスをインポート（グローバルレベル）
// const ScheduleManager = require('./lib/schedule-manager');

// ========================
// スケジュール管理機能（修正版）
// ========================

/**
 * スケジュール設定を保存
 */
exports.setSchedule = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    // CORS設定
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      // ScheduleManagerを直接require（loadModulesを使わない）
      const ScheduleManagerClass = require('./lib/schedule-manager');
      const scheduleManager = new ScheduleManagerClass(admin);
      
      const config = req.body;
      const result = await scheduleManager.setSchedule(config);
      
      res.json({
        success: true,
        schedule: result.schedule
      });
    } catch (error) {
      console.error('スケジュール設定エラー:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

/**
 * スケジュール設定を取得
 */
exports.getSchedule = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    // CORS設定
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      // ScheduleManagerを直接require
      const ScheduleManagerClass = require('./lib/schedule-manager');
      const scheduleManager = new ScheduleManagerClass(admin);
      
      const schedule = await scheduleManager.getSchedule();
      
      res.json({
        success: true,
        schedule: schedule
      });
    } catch (error) {
      console.error('スケジュール取得エラー:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

/**
 * スケジュールの有効/無効を切り替え
 */
exports.toggleSchedule = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    // CORS設定
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const ScheduleManagerClass = require('./lib/schedule-manager');
      const scheduleManager = new ScheduleManagerClass(admin);
      
      const { enabled } = req.body;
      const result = await scheduleManager.toggleSchedule(enabled);
      
      res.json({
        success: true,
        enabled: result.enabled
      });
    } catch (error) {
      console.error('スケジュール切り替えエラー:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

// スケジュール手動実行エンドポイント
exports.triggerScheduledPost = functions.runWith({ timeoutSeconds: 540, memory: "2GB" }).https.onRequest(async (req, res) => {
  // CORS設定
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('triggerScheduledPost: 手動実行開始');
    
    // ScheduleManagerの初期化（波括弧なし）
    const ScheduleManager = require('./lib/schedule-manager');
    const scheduleManager = new ScheduleManager();
    
    // スケジュール取得
    const schedule = await scheduleManager.getSchedule();
    console.log('現在のスケジュール:', JSON.stringify(schedule));
    
    if (!schedule || !schedule.enabled) {
      console.log('スケジュールが無効です');
      return res.status(200).json({
        success: false,
        message: 'スケジュールが無効になっています'
      });
    }
    
    // カテゴリー選択
    const category = await scheduleManager.getNextCategory();
    console.log('選択されたカテゴリー:', category);
    
    // BlogAutomationToolの初期化（波括弧なし）
    const BlogAutomationTool = require('./lib/blog-tool');
    const blogTool = new BlogAutomationTool();
    
    // 記事生成
    console.log(`${category}記事を生成中...`);
    const article = await blogTool.generateArticle(category);
    const result = await blogTool.postToWordPress(article);
    console.log('記事生成結果:', JSON.stringify(result));
    
    if (result.success) {
      // 投稿記録を更新
      await scheduleManager.recordPost();
      
      return res.status(200).json({
        success: true,
        message: '記事が正常に投稿されました',
        postId: result.postId,
        title: result.title,
        category: category,
        url: result.url
      });
    } else {
      throw new Error(result.error || '記事生成に失敗しました');
    }
    
  } catch (error) {
    console.error('triggerScheduledPost エラー詳細:', error);
    console.error('エラースタック:', error.stack);
    return res.status(500).json({
      success: false,
      error: error.message || 'スケジュール実行中にエラーが発生しました',
      details: error.toString()
    });
  }
});

/**
 * スケジュール実行（1時間ごと）
 */
exports.scheduledHourlyPost = functions
  .region('asia-northeast1')
  .pubsub.schedule('0 * * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    console.log('定期実行開始:', new Date().toISOString());
    
    try {
      const ScheduleManagerClass = require('./lib/schedule-manager');
      const scheduleManager = new ScheduleManagerClass(admin);
      
      // 実行可能かチェック
      const checkResult = await scheduleManager.canExecute();
      if (!checkResult.canExecute) {
        console.log('実行スキップ:', checkResult.reason);
        return null;
      }

      // スケジュール設定を取得
      const schedule = await scheduleManager.getSchedule();
      
      // インターバルチェック
      const now = new Date();
      const hour = now.getHours();
      
      let shouldExecute = false;
      switch (schedule.interval) {
        case 'hourly':
          shouldExecute = true;
          break;
        case 'every_2_hours':
          shouldExecute = hour % 2 === 0;
          break;
        case 'every_3_hours':
          shouldExecute = hour % 3 === 0;
          break;
        case 'every_6_hours':
          shouldExecute = hour % 6 === 0;
          break;
        case 'daily':
          shouldExecute = hour === 9;
          break;
      }

      if (!shouldExecute) {
        console.log('インターバル外のためスキップ');
        return null;
      }

      // 次のカテゴリーを取得
      const category = await scheduleManager.getNextCategory();
      console.log('投稿カテゴリー:', category);

      // 記事生成
      loadModules();
      const blogTool = new BlogAutomationTool();
      const article = await blogTool.generateArticle(category);
      const result = await blogTool.postToWordPress(article);
      
      if (result && result.success !== false) {
        await scheduleManager.incrementTodayPostCount();
        console.log('定期投稿成功:', {
          postId: result.postId,
          category: category,
          title: result.title
        });
      }

      return result;
    } catch (error) {
      console.error('定期実行エラー:', error);
      return null;
    }
  });

/**
 * 日次リセット（毎日0時）
 */
exports.scheduledDailyReset = functions
  .region('asia-northeast1')
  .pubsub.schedule('0 0 * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    console.log('日次リセット開始:', new Date().toISOString());
    
    try {
      const ScheduleManagerClass = require('./lib/schedule-manager');
      const scheduleManager = new ScheduleManagerClass(admin);
      
      await scheduleManager.resetDailyCount();
      console.log('日次リセット完了');
      return null;
    } catch (error) {
      console.error('日次リセットエラー:', error);
      return null;
    }
  });

/**
 * 手動実行用エンドポイント（テスト用）
 */
exports.triggerScheduledPost = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    // CORS設定
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      // 関数内でScheduleManagerインスタンスを作成
    const ScheduleManager = require('./lib/schedule-manager');
      const scheduleManager = new ScheduleManager(admin);
      
      // 実行可能かチェック
      const checkResult = await scheduleManager.canExecute();
      if (!checkResult.canExecute) {
        res.json({
          success: false,
          message: checkResult.reason
        });
        return;
      }

      // 次のカテゴリーを取得
      const category = await scheduleManager.getNextCategory();
      
      // 記事生成（既存の生成関数を呼び出す）
      const functionName = category === 'random' 
        ? 'generateRandomArticle' 
        : `generate${category.charAt(0).toUpperCase() + category.slice(1)}Article`;
      
      // 既存の記事生成ロジックを使用
      const BlogAutomationTool = require('./lib/blog-tool');
      const blogTool = new BlogAutomationTool();
      
      const article = await blogTool.generateArticle(category);
      const result = await blogTool.postToWordPress(article);
      
      if (result.success) {
        await scheduleManager.incrementTodayPostCount();
        
        res.json({
          success: true,
          postId: result.postId,
          category: category,
          title: result.title,
          url: result.url
        });
      } else {
        res.json({
          success: false,
          error: result.error || '記事生成に失敗しました'
        });
      }
    } catch (error) {
      console.error('手動実行エラー:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });


// 簡易動作確認用
exports.quickTest = functions.runWith({ timeoutSeconds: 60 }).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    console.log('QuickTest: 開始');
    
    // スケジュールマネージャーだけテスト
    const ScheduleManager = require('./lib/schedule-manager');
    const scheduleManager = new ScheduleManager(admin);
    
    const schedule = await scheduleManager.getSchedule();
    const canExecute = await scheduleManager.canExecute();
    
    console.log('QuickTest: 完了', { schedule, canExecute });
    
    res.json({
      success: true,
      schedule: schedule,
      canExecute: canExecute
    });
  } catch (error) {
    console.error('QuickTest エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// index.jsに追加する新しい関数

/**
 * DMM商品連携記事生成
 */
exports.generateArticleWithProducts = functions
  .runWith({ timeoutSeconds: 540, memory: '2GB' })
  .https.onRequest(async (req, res) => {
    cors(req, res, async () => {
      try {
        const { 
          template = 'review', 
          category = 'anime',
          keyword,
          includeProducts = true,
          productCount = 3
        } = req.body;

        // DMM API初期化
        const DMMApi = require('./lib/dmm-api');
        const dmmApi = new DMMApi();

        // 商品を検索
        let products = { items: [] };
        if (includeProducts) {
          if (keyword) {
            products = await dmmApi.searchProducts({ keyword, hits: productCount });
          } else {
            products = await dmmApi.getProductsByGenre(category, productCount);
          }
        }

        // 記事生成
        const blogTool = new BlogAutomationTool();
        let article;

        if (template === 'product_review' && products.items.length > 0) {
          // 商品レビュー記事
          const productData = await dmmApi.prepareReviewData(products.items[0].id);
          article = await blogTool.generateProductReview(productData);
        } else {
          // 通常記事生成
          article = await blogTool.generateArticleByTemplate(template, { category });
        }

        // 商品を記事に挿入
        if (includeProducts && products.items.length > 0) {
          article.content = await dmmApi.insertProductsIntoArticle(
            article.content, 
            category,
            { productCount, style: 'card', insertPosition: 'distributed' }
          );
        }

        // WordPressに投稿
        const wpResponse = await blogTool.postToWordPress(
          article.title,
          article.content,
          article.category,
          article.tags
        );

        res.json({
          success: true,
          postId: wpResponse.id,
          url: wpResponse.link,
          title: article.title,
          productsIncluded: products.items.length,
          products: products.items.map(p => ({
            title: p.title,
            price: p.price,
            affiliateUrl: p.affiliateUrl
          }))
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
 * 商品検索API
 */
exports.searchProducts = functions
  .https.onRequest(async (req, res) => {
    cors(req, res, async () => {
      try {
        const { keyword, genre, limit = 10 } = req.query;
        
        const DMMApi = require('./lib/dmm-api');
        const dmmApi = new DMMApi();
        
        let products;
        if (keyword) {
          products = await dmmApi.searchProducts({ keyword, hits: limit });
        } else if (genre) {
          products = await dmmApi.getProductsByGenre(genre, limit);
        } else {
          products = await dmmApi.getTrendingProducts('all', limit);
        }

        res.json({
          success: true,
          ...products
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
 * 商品レビュー記事生成
 */
exports.generateProductReview = functions
  .runWith({ timeoutSeconds: 540, memory: '2GB' })
  .https.onRequest(async (req, res) => {
    cors(req, res, async () => {
      try {
        const { productId } = req.body;
        
        if (!productId) {
          return res.status(400).json({ 
            success: false, 
            error: 'productId is required' 
          });
        }

        const DMMApi = require('./lib/dmm-api');
        const dmmApi = new DMMApi();
        
        // 商品詳細取得
        const productData = await dmmApi.prepareReviewData(productId);
        
        if (!productData) {
          return res.status(404).json({ 
            success: false, 
            error: 'Product not found' 
          });
        }

        // レビュー記事生成
        const blogTool = new BlogAutomationTool();
        const review = await blogTool.generateProductReviewArticle(productData);

        // アフィリエイトリンクを含む完全な記事を生成
        const fullContent = `
${review.introduction}

<div class="product-info">
${dmmApi.generateProductHtml(productData, 'card')}
</div>

${review.features}

${review.prosAndCons}

${review.conclusion}

<div class="product-cta">
${dmmApi.generateProductHtml(productData, 'button')}
</div>
        `;

        // WordPressに投稿
        const wpResponse = await blogTool.postToWordPress(
          review.title,
          fullContent,
          'review',
          ['商品レビュー', productData.genre, productData.maker]
        );

        res.json({
          success: true,
          postId: wpResponse.id,
          url: wpResponse.link,
          title: review.title,
          product: {
            name: productData.title,
            price: productData.price,
            rating: productData.rating,
            affiliateUrl: productData.affiliateUrl
          }
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
 * DMM API設定デバッグ
 */
exports.debugDMM = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    cors(req, res, async () => {
      try {
        const DMMApi = require('./lib/dmm-api');
        const dmmApi = new DMMApi();
        
        // 環境変数の状態を確認（値は一部隠す）
        const apiIdStatus = process.env.DMM_API_ID ? 
          `Set (${process.env.DMM_API_ID.substring(0, 4)}...)` : 'NOT SET';
        const affiliateIdStatus = process.env.DMM_AFFILIATE_ID || 'NOT SET';
        
        // テストリクエスト
        const axios = require('axios');
        let testResult = 'Not tested';
        
        if (process.env.DMM_API_ID && process.env.DMM_AFFILIATE_ID) {
          try {
            const testUrl = `https://api.dmm.com/affiliate/v3/ItemList?api_id=${process.env.DMM_API_ID}&affiliate_id=${process.env.DMM_AFFILIATE_ID}&hits=1&keyword=test&output=json`;
            const response = await axios.get(testUrl);
            testResult = response.data?.result ? 'API Connected' : 'API Error: ' + JSON.stringify(response.data);
          } catch (error) {
            testResult = `Connection Error: ${error.message}`;
          }
        }
        
        res.json({
          success: true,
          config: {
            DMM_API_ID: apiIdStatus,
            DMM_AFFILIATE_ID: affiliateIdStatus,
            baseUrl: 'https://api.dmm.com/affiliate/v3'
          },
          testResult: testResult
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  });
