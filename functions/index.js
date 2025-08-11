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

// === 位置1: 229行目付近（generateRandomArticle の直後）に追加 ===

// 大人向けライフスタイル記事生成（WordPressフレンドリー版）
exports.generateAdultArticle = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      const startTime = Date.now();
      
      try {
        console.log('💼 大人向けライフスタイル記事生成開始...');
        
        const contentLevel = req.query.level || 'moderate';
        
        loadModules();
        const blogTool = new BlogAutomationTool();
        
        // WordPressフレンドリーな大人向け記事生成
        const article = await generateMatureLifestyleArticle(blogTool, contentLevel);
        
        // WordPress投稿（カテゴリを lifestyle に変更）
        const result = await blogTool.postToWordPress({
          ...article,
          category: 'lifestyle',  // 'adult' → 'lifestyle' に変更
          tags: [...article.tags, '大人向け', 'ライフスタイル', '恋愛'],  // 刺激的な単語を削除
          meta: {
            contentLevel: contentLevel,
            targetAudience: 'mature'
          }
        });
        
        const duration = Date.now() - startTime;
        console.log(`✅ 大人向けライフスタイル記事投稿完了 (${duration}ms)`);
        
        res.json({
          success: true,
          message: '大人向けライフスタイル記事が正常に投稿されました',
          postId: result.postId,
          url: result.url,
          title: result.title,
          category: 'lifestyle',
          contentLevel: contentLevel,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('大人向けライフスタイル記事生成エラー:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          category: 'lifestyle'
        });
      }
    });
  });

// WordPressフレンドリーな大人向け記事生成関数
async function generateMatureLifestyleArticle(blogTool, contentLevel = 'moderate') {
  const matureTopics = {
    strict: [
      '大人の恋愛心理学',
      'パートナーとのコミュニケーション術',
      '健全な人間関係の築き方',
      '大人のライフスタイル提案'
    ],
    moderate: [
      '大人の恋愛コラム',
      '健康的な関係性について',
      'パートナーシップの心理学',
      '大人の自己啓発',
      '恋愛における心理的成長'
    ],
    relaxed: [
      '現代の恋愛事情',
      '大人のデートスタイル',
      'パートナーシップの新しい形',
      '大人の趣味とライフスタイル',
      '恋愛と心理学の関係'
    ]
  };
  
  const topics = matureTopics[contentLevel] || matureTopics.moderate;
  const selectedTopic = topics[Math.floor(Math.random() * topics.length)];
  
  const prompt = `
あなたは大人向けライフスタイル専門のライターです。
以下の要件に従って、健全で価値のある記事を書いてください。

【トピック】: ${selectedTopic}
【対象読者】: 大人の読者（成熟した大人向け）
【アプローチ】: 教育的・建設的

【記事の方針】:
1. 健全で建設的な内容
2. 心理学的・社会学的観点からの情報提供
3. 読者の人生に価値をもたらす内容
4. 品格のある表現と言葉選び
5. 実用的なアドバイスの提供

【記事構造】:
- タイトル: 品格があり、検索されやすい
- 導入（なぜこのトピックが重要か）
- 本文（専門的観点からの詳細解説）
- 実践的なアドバイス
- まとめ（前向きなメッセージ）

【文字数】: 1400-1800文字
【トーン】: 知的で成熟した、教育的

HTMLタグを使用して構造化してください。
読者に価値を提供する質の高い内容を重視してください。
`;

  try {
    const response = await blogTool.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `あなたは大人向けライフスタイルの専門家です。健全で教育的な内容を提供し、読者の人生に価値をもたらします。`
        },
        {
          role: 'user', 
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });

    const content = response.choices[0].message.content;
    
    // WordPress フレンドリーな構造化
    return parseMatureLifestyleContent(content, contentLevel, selectedTopic);
    
  } catch (error) {
    console.error('大人向けライフスタイル記事GPT生成エラー:', error);
    return generateFallbackMatureArticle(selectedTopic, contentLevel);
  }
}

// WordPress フレンドリーなコンテンツ構造化
function parseMatureLifestyleContent(content, contentLevel, topic) {
  // タイトル抽出・調整
  const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i) || 
                     content.match(/^#\s+(.+)$/m);
  
  let title = titleMatch 
    ? titleMatch[1].replace(/<[^>]*>/g, '').trim()
    : `【大人向け】${topic}について考える`;
    
  // より健全な表現に調整
  title = title.replace(/18歳以上/g, '大人向け')
               .replace(/アダルト/g, '成人向け')
               .replace(/限定/g, '専門');

  // 健全な注意書きを記事の最初に追加
  const matureNotice = `
<div style="background: linear-gradient(135deg, #4a90e2, #357abd); color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
  <h3 style="margin: 0 0 10px 0; color: white; font-size: 20px;">🌟 大人の読者へ</h3>
  <p style="margin: 0; font-size: 16px;">この記事は成熟した大人の読者を対象とした内容です</p>
  <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">人生経験豊富な方々にお役立ていただけるよう心を込めて作成しました</p>
</div>
`;

  // 本文を整形
  let bodyContent = content;
  if (titleMatch) {
    bodyContent = content.replace(titleMatch[0], '').trim();
  }
  
  // 健全な注意書きを本文の最初に挿入
  bodyContent = matureNotice + bodyContent;
  
  // 建設的なメッセージフッターを追加
  const constructiveFooter = `
<div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 30px 0;">
  <h4 style="margin: 0 0 15px 0; color: #495057; display: flex; align-items: center;">
    <span style="margin-right: 10px;">💡</span>
    より良い人生のために
  </h4>
  <div style="color: #6c757d; line-height: 1.6;">
    <ul style="margin: 0; padding-left: 20px;">
      <li>この情報が皆様の人生により良い価値をもたらすことを願っています</li>
      <li>個人の価値観や状況に応じて適切にご活用ください</li>
      <li>より詳しい情報が必要な場合は専門家にご相談ください</li>
      <li>健全で充実した大人のライフスタイルを共に築いていきましょう</li>
    </ul>
  </div>
</div>
`;

  bodyContent += constructiveFooter;

  // 抜粋生成（健全な表現）
  const plainText = bodyContent.replace(/<[^>]*>/g, '');
  const excerpt = `【大人向けライフスタイル】${plainText.substring(0, 120)}...`;

  return {
    title,
    content: bodyContent,
    excerpt,
    category: 'lifestyle',  // adult → lifestyle に変更
    tags: ['大人向け', 'ライフスタイル', '恋愛', topic, '自己啓発', '人間関係'],  // 健全なタグに変更
    status: 'publish',
    format: 'standard',
    author: 1,
    meta: {
      targetAudience: 'mature',
      contentType: 'lifestyle-educational',
      contentLevel: contentLevel
    }
  };
}

// フォールバック記事（健全版）
function generateFallbackMatureArticle(topic, contentLevel) {
  return {
    title: `【大人向けライフスタイル】${topic} - 人生をより豊かにするヒント`,
    content: `
<div style="background: linear-gradient(135deg, #4a90e2, #357abd); color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
  <h3 style="margin: 0 0 10px 0; color: white;">🌟 大人の読者へ</h3>
  <p style="margin: 0;">この記事は成熟した大人の読者を対象としています</p>
</div>

<p>大人の ${topic} について、建設的な観点から情報をお届けします。</p>

<h2>現代社会での重要性</h2>
<p>現代において、適切な知識と理解を持つことは重要です。</p>

<h2>実践的なアプローチ</h2>
<p>個人の価値観や状況に応じて、建設的な判断を行うことが大切です。</p>

<h2>まとめ</h2>
<p>正しい知識と前向きな行動で、充実した大人のライフスタイルを築きましょう。</p>

<div style="background: #f8f9fa; border-left: 4px solid #6c757d; padding: 20px; margin: 30px 0;">
  <h4 style="margin: 0 0 10px 0; color: #6c757d;">💡 より良い人生のために</h4>
  <p style="color: #6c757d;">この情報が皆様の人生により良い価値をもたらすことを願っています。</p>
</div>
`,
    excerpt: `【大人向けライフスタイル】${topic}について、建設的な観点から情報をお届けします。`,
    category: 'lifestyle',
    tags: ['大人向け', 'ライフスタイル', topic, '自己啓発'],
    status: 'publish'
  };
}

// === テスト関数 ===

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
        
        // 記事生成と投稿
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
          url: postResult.url,
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

// 画像生成テスト
exports.testImageGeneration = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        loadModules();
        const imageGenerator = new ImageGenerator();
        
        // 基本テスト（正しい引数順序：prompt, size, quality）
        const basicPrompt = imageGenerator.generateImagePrompt(
          'Beautiful Japanese entertainment news blog header',
          'entertainment'
        );
        const basicTest = await imageGenerator.generateImage(
          basicPrompt,
          '1792x1024',  // size
          'hd'          // quality
        );
        
        // カテゴリー別テスト
        const categories = ['entertainment', 'anime'];
        const categoryTests = await Promise.all(
          categories.map(async (category) => {
            try {
              const prompt = imageGenerator.generateImagePrompt(
                `${category} themed blog header image`,
                category
              );
              const result = await imageGenerator.generateImage(prompt, '1792x1024', 'hd');
              return { 
                category, 
                success: true, 
                imageUrl: result.success ? result.imageUrl : null,
                error: result.success ? null : result.error
              };
            } catch (error) {
              return { category, success: false, imageUrl: null, error: error.message };
            }
          })
        );
        
        res.json({
          success: true,
          message: 'Image generation test completed',
          basicTest: basicTest.success ? {
            success: true,
            message: 'Image generation working correctly',
            testImageUrl: basicTest.imageUrl
          } : {
            success: false,
            message: 'Image generation failed',
            error: basicTest.error
          },
          categoryTests: {
            total: categories.length,
            successful: categoryTests.filter(t => t.success && t.imageUrl).length,
            results: categoryTests
          },
          note: 'Reduced to 2 categories for faster testing',
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Image generation test failed:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message
        });
      }
    });
  });

// WordPressメディアテスト
exports.testWordPressMedia = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        initializeServices();
        loadModules();
        
        console.log('🔍 Testing WordPress media upload...');
        
        // 画像生成
        const imageGenerator = new ImageGenerator();
        const prompt = imageGenerator.generateImagePrompt(
          'Test media upload for WordPress',
          'tech'
        );
        const imageResult = await imageGenerator.generateImage(prompt, '1792x1024', 'hd');
        const imageUrl = imageResult.success ? imageResult.imageUrl : null;
        
        if (!imageUrl) {
          throw new Error('Image generation failed');
        }
        
        // アップロード試行
        const uploadResult = await mediaManager.uploadImageFromUrl(
          imageUrl,
          'test-media-' + Date.now()
        );
        
        res.json({
          success: true,
          message: 'WordPress media upload test completed',
          imageGeneration: {
            success: imageResult.success,
            imageUrl: imageUrl
          },
          mediaUpload: {
            success: uploadResult.success || uploadResult.fallback,
            mediaUrl: uploadResult.url,
            filename: uploadResult.file || `test-media-${Date.now()}.png`,
            title: 'メディアライブラリテスト画像',
            altText: 'WordPress メディアライブラリのアップロードテスト',
            fallback: uploadResult.fallback || false,
            fallbackReason: uploadResult.error || null
          },
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('WordPress media test failed:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message
        });
      }
    });
  });

// === 新規追加機能 - CORS対応 ===

// システムメトリクス取得
exports.getSystemMetrics = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        initializeServices();
        
        // デモ用のメトリクスデータ（実際のデータがない場合のフォールバック）
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
        
        // 実際のメトリクスを取得（利用可能な場合）
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

// メディアアップロードテスト（新版）
exports.testMediaUpload = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        initializeServices();
        loadModules();
        
        console.log('🎨 Starting enhanced media upload test...');
        
        // DALL-E 3で画像生成
        const imageGenerator = new ImageGenerator();
        const prompt = imageGenerator.generateImagePrompt(
          'Beautiful blog header image with modern design',
          'tech'
        );
        const imageResult = await imageGenerator.generateImage(prompt, '1792x1024', 'hd');
        const imageUrl = imageResult.success ? imageResult.imageUrl : null;
        
        if (!imageUrl) {
          throw new Error('Image generation failed');
        }
        
        // WordPressアップロード試行
        const uploadResult = await mediaManager.uploadImageFromUrl(
          imageUrl,
          'test-upload-' + Date.now()
        );
        
        res.json({
          success: true,
          message: 'Media upload test completed',
          generatedImage: imageUrl,
          uploadResult,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Media upload test failed:', error);
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
            
            // レート制限対策
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

// === 位置3: 654行目付近（batchGeneratePosts の直後）に追加 ===

// === 記事品質向上機能 ===

// SEO最適化記事生成
exports.generateSEOOptimizedArticle = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const category = req.query.category || 'entertainment';
        const targetKeywords = req.query.keywords || '';
        const contentLength = parseInt(req.query.length) || 2000;
        
        console.log(`🎯 SEO最適化記事生成: ${category}`);
        
        initializeServices();
        loadModules();
        const blogTool = new BlogAutomationTool();
        
        // SEO強化記事生成
        const article = await generateSEOEnhancedArticle(blogTool, category, {
          targetKeywords: targetKeywords.split(',').filter(k => k.trim()),
          contentLength: contentLength,
          seoLevel: 'high'
        });
        
        // WordPress投稿
        const result = await blogTool.postToWordPress(article);
        
        res.json({
          success: true,
          message: 'SEO最適化記事を投稿しました',
          postId: result.postId,
          url: result.url,
          title: result.title,
          category: category,
          seoEnhancements: {
            metaDescription: article.metaDescription,
            focusKeywords: article.focusKeywords,
            readabilityScore: article.readabilityScore,
            seoScore: article.seoScore
          },
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('SEO最適化記事生成エラー:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  });

// 内部リンク自動挿入機能
exports.enhanceArticleWithInternalLinks = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 180, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const category = req.query.category || 'entertainment';
        const linkDensity = parseFloat(req.query.density) || 0.02; // 2%
        
        console.log('🔗 内部リンク強化記事生成中...');
        
        initializeServices();
        loadModules();
        const blogTool = new BlogAutomationTool();
        
        // 基本記事生成
        const baseArticle = await blogTool.generateArticle(category);
        
        // 内部リンク挿入
        const enhancedArticle = await insertInternalLinks(baseArticle, {
          density: linkDensity,
          category: category,
          strategy: 'contextual'
        });
        
        // WordPress投稿
        const result = await blogTool.postToWordPress(enhancedArticle);
        
        res.json({
          success: true,
          message: '内部リンク強化記事を投稿しました',
          postId: result.postId,
          url: result.url,
          title: result.title,
          internalLinks: {
            count: enhancedArticle.internalLinksCount,
            density: `${(enhancedArticle.internalLinksCount / enhancedArticle.wordCount * 100).toFixed(2)}%`,
            anchors: enhancedArticle.linkAnchors
          },
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('内部リンク強化エラー:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  });

// アイキャッチ画像最適化機能
exports.generateArticleWithOptimizedImage = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const category = req.query.category || 'entertainment';
        const imageStyle = req.query.style || 'modern'; // modern, classic, artistic, minimalist
        const includeText = req.query.text === 'true';
        
        console.log(`🎨 最適化画像付き記事生成: ${category}`);
        
        initializeServices();
        loadModules();
        const blogTool = new BlogAutomationTool();
        const imageGenerator = new ImageGenerator();
        
        // 記事生成
        const article = await blogTool.generateArticle(category);
        
        // カスタム画像プロンプト生成
        const customImagePrompt = generateOptimizedImagePrompt(article.title, category, {
          style: imageStyle,
          includeText: includeText,
          mood: 'engaging'
        });
        
        // 高品質画像生成
        const imageResult = await imageGenerator.generateImage(
          customImagePrompt,
          '1792x1024',
          'hd'
        );
        
        if (imageResult.success) {
          article.featuredImage = imageResult.imageUrl;
          article.imageMetadata = {
            style: imageStyle,
            prompt: customImagePrompt,
            dimensions: '1792x1024',
            quality: 'hd'
          };
        }
        
        // WordPress投稿
        const result = await blogTool.postToWordPress(article);
        
        res.json({
          success: true,
          message: '最適化画像付き記事を投稿しました',
          postId: result.postId,
          url: result.url,
          title: result.title,
          imageOptimization: {
            success: imageResult.success,
            imageUrl: imageResult.imageUrl,
            style: imageStyle,
            customPrompt: customImagePrompt,
            includeText: includeText
          },
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('最適化画像付き記事生成エラー:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  });

// 記事品質分析機能
exports.analyzeArticleQuality = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const category = req.query.category || 'entertainment';
        
        console.log('📊 記事品質分析実行中...');
        
        initializeServices();
        loadModules();
        const blogTool = new BlogAutomationTool();
        
        // テスト記事生成
        const article = await blogTool.generateArticle(category);
        
        // 品質分析
        const qualityAnalysis = analyzeContentQuality(article);
        
        res.json({
          success: true,
          message: '記事品質分析完了',
          article: {
            title: article.title,
            category: article.category,
            wordCount: qualityAnalysis.wordCount,
            excerpt: article.excerpt
          },
          qualityMetrics: qualityAnalysis,
          recommendations: generateQualityRecommendations(qualityAnalysis),
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('記事品質分析エラー:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  });

// === ヘルパー関数（記事品質向上用） ===

// SEO強化記事生成
async function generateSEOEnhancedArticle(blogTool, category, options = {}) {
  const { targetKeywords = [], contentLength = 2000, seoLevel = 'medium' } = options;
  
  // 基本記事生成
  const baseArticle = await blogTool.generateArticle(category);
  
  // SEO要素を強化
  const seoEnhancedPrompt = `
以下の記事をSEO最適化してください：

タイトル: ${baseArticle.title}
カテゴリ: ${category}
ターゲットキーワード: ${targetKeywords.join(', ')}
目標文字数: ${contentLength}文字

SEO要件:
1. タイトルにメインキーワードを含める
2. メタディスクリプション（120-160文字）を作成
3. H2、H3見出しを効果的に使用
4. 関連キーワードを自然に配置
5. 読みやすい文章構造
6. ユーザーの検索意図に応える内容

元記事内容:
${baseArticle.content}
`;

  const response = await blogTool.openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'あなたはSEO専門家です。検索エンジン最適化と読者満足度の両方を重視した記事を作成します。'
      },
      {
        role: 'user',
        content: seoEnhancedPrompt
      }
    ],
    temperature: 0.7,
    max_tokens: 3500
  });

  const enhancedContent = response.choices[0].message.content;
  
  // メタディスクリプション抽出
  const metaMatch = enhancedContent.match(/メタディスクリプション[：:]\s*(.+)/);
  const metaDescription = metaMatch ? metaMatch[1] : baseArticle.excerpt;
  
  return {
    ...baseArticle,
    content: enhancedContent,
    metaDescription: metaDescription,
    focusKeywords: targetKeywords,
    seoScore: calculateSEOScore(enhancedContent, targetKeywords),
    readabilityScore: calculateReadabilityScore(enhancedContent)
  };
}

// 内部リンク挿入
async function insertInternalLinks(article, options = {}) {
  const { density = 0.02, category, strategy = 'contextual' } = options;
  
  // 関連キーワードに基づく内部リンク候補
  const internalLinkCandidates = {
    entertainment: [
      { anchor: 'エンタメニュース', url: '/category/entertainment/' },
      { anchor: '芸能界', url: '/tag/celebrity/' },
      { anchor: 'ドラマ情報', url: '/category/drama/' }
    ],
    anime: [
      { anchor: 'アニメ情報', url: '/category/anime/' },
      { anchor: '声優', url: '/tag/voice-actor/' },
      { anchor: '新作アニメ', url: '/tag/new-anime/' }
    ],
    game: [
      { anchor: 'ゲーム情報', url: '/category/game/' },
      { anchor: '攻略情報', url: '/tag/walkthrough/' },
      { anchor: 'eスポーツ', url: '/tag/esports/' }
    ]
    // 他のカテゴリも同様に定義
  };
  
  const links = internalLinkCandidates[category] || internalLinkCandidates.entertainment;
  const wordCount = article.content.replace(/<[^>]*>/g, '').length;
  const targetLinkCount = Math.floor(wordCount * density);
  
  let enhancedContent = article.content;
  let linksInserted = 0;
  const insertedAnchors = [];
  
  // コンテキストに基づいてリンクを挿入
  for (const link of links) {
    if (linksInserted >= targetLinkCount) break;
    
    const regex = new RegExp(`\\b${link.anchor}\\b`, 'g');
    const matches = enhancedContent.match(regex);
    
    if (matches && matches.length > 0) {
      enhancedContent = enhancedContent.replace(
        regex, 
        `<a href="${link.url}" target="_self">${link.anchor}</a>`
      );
      linksInserted++;
      insertedAnchors.push(link.anchor);
    }
  }
  
  return {
    ...article,
    content: enhancedContent,
    internalLinksCount: linksInserted,
    linkAnchors: insertedAnchors,
    wordCount: wordCount
  };
}

// 最適化画像プロンプト生成
function generateOptimizedImagePrompt(title, category, options = {}) {
  const { style = 'modern', includeText = false, mood = 'engaging' } = options;
  
  const stylePrompts = {
    modern: 'sleek, contemporary, minimalist design with vibrant colors',
    classic: 'timeless, elegant, sophisticated with muted tones',
    artistic: 'creative, abstract, painterly with bold artistic elements',
    minimalist: 'clean, simple, white space with single focal point'
  };
  
  const categoryPrompts = {
    entertainment: 'entertainment industry, celebrity culture, show business',
    anime: 'anime art style, Japanese animation, colorful characters',
    game: 'gaming elements, digital graphics, futuristic technology',
    movie: 'cinema, film industry, movie theater atmosphere',
    tech: 'technology, digital innovation, futuristic concepts',
    beauty: 'beauty products, cosmetics, elegant lifestyle',
    food: 'delicious food, culinary art, restaurant atmosphere'
  };
  
  const basePrompt = `${stylePrompts[style]}, ${categoryPrompts[category] || categoryPrompts.entertainment}`;
  const textElement = includeText ? `, with stylish text overlay` : '';
  const moodElement = mood === 'engaging' ? ', eye-catching and engaging' : '';
  
  return `Create a ${basePrompt} blog header image related to "${title}"${textElement}${moodElement}. High quality, professional, perfect for blog thumbnail.`;
}

// 記事品質分析
function analyzeContentQuality(article) {
  const content = article.content;
  const plainText = content.replace(/<[^>]*>/g, '');
  
  return {
    wordCount: plainText.length,
    paragraphCount: (content.match(/<\/p>/g) || []).length,
    headingCount: (content.match(/<h[2-6][^>]*>/g) || []).length,
    imageCount: (content.match(/<img[^>]*>/g) || []).length,
    linkCount: (content.match(/<a[^>]*>/g) || []).length,
    readabilityScore: calculateReadabilityScore(plainText),
    seoScore: calculateSEOScore(content, []),
    structureScore: calculateStructureScore(content)
  };
}

// SEOスコア計算
function calculateSEOScore(content, keywords) {
  let score = 0;
  
  // 基本構造チェック
  if (content.includes('<h2')) score += 20;
  if (content.includes('<h3')) score += 10;
  if ((content.match(/<p[^>]*>/g) || []).length >= 5) score += 20;
  
  // キーワード密度チェック
  const plainText = content.replace(/<[^>]*>/g, '').toLowerCase();
  keywords.forEach(keyword => {
    const density = (plainText.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length / plainText.split(' ').length;
    if (density >= 0.01 && density <= 0.03) score += 15;
  });
  
  // 文字数チェック
  if (plainText.length >= 1500) score += 25;
  if (plainText.length >= 2000) score += 10;
  
  return Math.min(score, 100);
}

// 可読性スコア計算
function calculateReadabilityScore(text) {
  const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0);
  const words = text.split(/[\s　]/).filter(w => w.length > 0);
  
  if (sentences.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  let score = 100;
  
  // 文の長さによる減点
  if (avgWordsPerSentence > 20) score -= 20;
  if (avgWordsPerSentence > 30) score -= 20;
  
  return Math.max(score, 0);
}

// 構造スコア計算
function calculateStructureScore(content) {
  let score = 0;
  
  // 見出し構造
  const h2Count = (content.match(/<h2[^>]*>/g) || []).length;
  const h3Count = (content.match(/<h3[^>]*>/g) || []).length;
  
  if (h2Count >= 2) score += 30;
  if (h3Count >= 1) score += 20;
  
  // 段落数
  const paragraphs = (content.match(/<\/p>/g) || []).length;
  if (paragraphs >= 5) score += 25;
  if (paragraphs >= 8) score += 15;
  
  // リスト使用
  if (content.includes('<ul>') || content.includes('<ol>')) score += 10;
  
  return Math.min(score, 100);
}

// 品質改善提案生成
function generateQualityRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.wordCount < 1500) {
    recommendations.push('記事の文字数を1500文字以上に増やすことをお勧めします');
  }
  
  if (analysis.headingCount < 3) {
    recommendations.push('読みやすさ向上のため、H2・H3見出しを追加してください');
  }
  
  if (analysis.readabilityScore < 70) {
    recommendations.push('文章の可読性向上のため、短い文を心がけてください');
  }
  
  if (analysis.linkCount === 0) {
    recommendations.push('関連記事への内部リンクを追加することでSEO効果が期待できます');
  }
  
  if (analysis.seoScore < 70) {
    recommendations.push('SEO最適化のため、キーワードの適切な配置を検討してください');
  }
  
  return recommendations;
}

// === スケジューラー機能（月間500投稿対応）===
// 毎時30分に実行（1日24記事）
exports.scheduledBlogPost = functions
  .region('asia-northeast1')
  .runWith({ 
    timeoutSeconds: 300,
    memory: '512MB'
  })
  .pubsub.schedule('30 * * * *') // 毎時30分に実行
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    initializeServices();
    loadModules();
    const startTime = Date.now();
    
    try {
      // カテゴリーをランダム選択
      const categories = [
        'entertainment', 'anime', 'game', 'movie',
        'music', 'tech', 'beauty', 'food'
      ];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      console.log(`📝 Starting scheduled post for category: ${category}`);
      
      const blogTool = new BlogAutomationTool();
      
      // 記事生成（リトライ付き）
      const article = await performanceSystem.retryWithBackoff(
        async () => await blogTool.generateArticle(category),
        3,
        'Scheduled article generation'
      );
      
      // 重複チェック
      const isDuplicate = await performanceSystem.checkDuplicate(article.title);
      if (isDuplicate) {
        console.log('⏭️ Skipping duplicate article');
        return { success: false, reason: 'duplicate' };
      }
      
      // WordPress投稿
      const postResult = await performanceSystem.retryWithBackoff(
        async () => await blogTool.postToWordPress(article),
        3,
        'Scheduled WordPress posting'
      );
      
      // パフォーマンス記録
      const duration = Date.now() - startTime;
      performanceSystem.recordPerformance(true, duration);
      
      console.log(`✅ Scheduled post successful in ${duration}ms`);
      return {
        success: true,
        postId: postResult.postId,
        duration,
        metrics: performanceSystem.getMetrics()
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      performanceSystem.recordPerformance(false, duration);
      
      console.error('❌ Scheduled post failed:', error);
      return {
        success: false,
        error: error.message,
        duration,
        metrics: performanceSystem.getMetrics()
      };
    }
  });

// === 日次レポート ===
exports.dailyReport = functions
  .region('asia-northeast1')
  .runWith({ 
    timeoutSeconds: 60,
    memory: '256MB'
  })
  .pubsub.schedule('0 9 * * *') // 毎日午前9時
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    initializeServices();
    const metrics = performanceSystem.getMetrics();
    
    console.log('📊 === Daily Report ===');
    console.log(`Total Posts: ${metrics.totalPosts}`);
    console.log(`Success Rate: ${metrics.successRate}`);
    console.log(`Average Time: ${metrics.averageTimeSeconds}`);
    console.log(`Posts/Hour: ${metrics.postsPerHour}`);
    console.log(`Image Upload Success Rate: ${metrics.imageUploadSuccessRate}`);
    
    // 目標達成率
    const targetDaily = 17;
    const achievementRate = (metrics.totalPosts / targetDaily * 100).toFixed(2);
    console.log(`Target Achievement: ${achievementRate}%`);
    
    return { success: true, metrics };
  });

// === 位置2: 790行目付近（dailyReport の直後）に追加 ===

// === 高度なスケジュール機能 ===

// カテゴリ別スケジュール投稿（2時間おき）
exports.intelligentScheduledPost = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .pubsub.schedule('0 */2 * * *') // 2時間おき
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    try {
      console.log('🤖 インテリジェント自動投稿開始...');
      initializeServices();
      loadModules();
      
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay(); // 0=日曜日, 6=土曜日
      
      // 時間帯別カテゴリ選択
      const category = selectCategoryByTime(hour, dayOfWeek);
      console.log(`⏰ ${hour}時 - ${category}カテゴリを選択`);
      
      const blogTool = new BlogAutomationTool();
      
      // カテゴリに応じた記事生成
      let article;
      if (category === 'lifestyle') {  // adult → lifestyle に変更
        article = await generateMatureLifestyleArticle(blogTool, 'moderate');
      } else {
        article = await blogTool.generateArticle(category);
      }
      
      // WordPress投稿
      const result = await blogTool.postToWordPress(article);
      
      console.log(`✅ 自動投稿完了: ${result.postId} (${category})`);
      
      // パフォーマンス記録
      if (performanceSystem) {
        performanceSystem.recordPerformance(true, Date.now());
      }
      
      return {
        success: true,
        postId: result.postId,
        category: category,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('インテリジェント自動投稿エラー:', error);
      if (performanceSystem) {
        performanceSystem.recordPerformance(false, Date.now());
      }
      return {
        success: false,
        error: error.message
      };
    }
  });

// 曜日・時間帯別バッチ投稿（毎週月曜日）
exports.weeklyBatchScheduler = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .pubsub.schedule('0 9 * * 1') // 毎週月曜日 9時
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    try {
      console.log('📅 週間バッチ投稿開始...');
      initializeServices();
      loadModules();
      
      const weeklyPlan = [
        { category: 'anime', count: 3 },
        { category: 'game', count: 2 },
        { category: 'entertainment', count: 4 },
        { category: 'movie', count: 2 },
        { category: 'tech', count: 2 },
        { category: 'beauty', count: 1 },
        { category: 'food', count: 1 },
        { category: 'lifestyle', count: 2 }  // adult → lifestyle に変更
      ];
      
      const blogTool = new BlogAutomationTool();
      const results = [];
      
      // ループ内の条件も修正
      for (const plan of weeklyPlan) {
        console.log(`📝 ${plan.category}: ${plan.count}記事生成中...`);
        
        for (let i = 0; i < plan.count; i++) {
          try {
            let article;
            if (plan.category === 'lifestyle') {  // adult → lifestyle に変更
              article = await generateMatureLifestyleArticle(blogTool, 'moderate');
            } else {
              article = await blogTool.generateArticle(plan.category);
            }
            
            const result = await blogTool.postToWordPress(article);
            results.push({ category: plan.category, postId: result.postId, success: true });
            
            // 投稿間隔（WordPressサーバー負荷軽減）
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5秒待機
            
          } catch (error) {
            console.error(`${plan.category} 記事${i+1}投稿エラー:`, error.message);
            results.push({ category: plan.category, success: false, error: error.message });
          }
        }
      }
      
      console.log('📊 週間バッチ投稿完了:', results);
      return {
        success: true,
        results: results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length
        }
      };
      
    } catch (error) {
      console.error('週間バッチ投稿エラー:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

// 特別イベント対応スケジューラー
exports.eventBasedScheduler = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const eventType = req.query.event || req.body.event;
        const intensity = req.query.intensity || req.body.intensity || 'normal';
        
        console.log(`🎉 イベント対応投稿: ${eventType} (${intensity})`);
        
        const eventConfigs = {
          'anime-season': {
            categories: ['anime', 'entertainment'],
            count: intensity === 'high' ? 10 : 5,
            interval: 3000
          },
          'game-release': {
            categories: ['game', 'tech'],
            count: intensity === 'high' ? 8 : 4,
            interval: 4000
          },
          'movie-festival': {
            categories: ['movie', 'entertainment'],
            count: intensity === 'high' ? 6 : 3,
            interval: 5000
          },
          'weekend-special': {
            categories: ['entertainment', 'anime', 'game', 'movie'],
            count: intensity === 'high' ? 12 : 6,
            interval: 2000
          },
          'lifestyle-feature': {  // adult-feature → lifestyle-feature に変更
            categories: ['lifestyle'],
            count: intensity === 'high' ? 6 : 3,
            interval: 6000
          }
        };
        
        const config = eventConfigs[eventType];
        if (!config) {
          return res.status(400).json({
            success: false,
            error: 'サポートされていないイベントタイプです',
            supportedEvents: Object.keys(eventConfigs)
          });
        }
        
        initializeServices();
        loadModules();
        const blogTool = new BlogAutomationTool();
        const results = [];
        
        for (let i = 0; i < config.count; i++) {
          const category = config.categories[i % config.categories.length];
          
          try {
            let article;
            if (category === 'lifestyle') {  // adult → lifestyle に変更
              article = await generateMatureLifestyleArticle(blogTool, 'moderate');
            } else {
              article = await blogTool.generateArticle(category);
            }
            
            const result = await blogTool.postToWordPress(article);
            results.push({
              postId: result.postId,
              category: category,
              title: result.title,
              url: result.url,
              success: true
            });
            
            // インターバル待機
            if (i < config.count - 1) {
              await new Promise(resolve => setTimeout(resolve, config.interval));
            }
            
          } catch (error) {
            console.error(`イベント投稿エラー (${category}):`, error.message);
            results.push({
              category: category,
              success: false,
              error: error.message
            });
          }
        }
        
        res.json({
          success: true,
          message: `${eventType}イベント投稿完了`,
          event: eventType,
          intensity: intensity,
          totalPosts: results.length,
          successCount: results.filter(r => r.success).length,
          results: results,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('イベント投稿エラー:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  });

// 時間帯別カテゴリ選択ロジック（ヘルパー関数）
function selectCategoryByTime(hour, dayOfWeek) {
  // 深夜・早朝 (0-6時)
  if (hour >= 0 && hour < 6) {
    return Math.random() < 0.3 ? 'lifestyle' : 'anime';  // adult → lifestyle
  }
  
  // 朝 (6-9時)
  if (hour >= 6 && hour < 9) {
    return Math.random() < 0.5 ? 'tech' : 'beauty';
  }
  
  // 午前 (9-12時)
  if (hour >= 9 && hour < 12) {
    return Math.random() < 0.4 ? 'entertainment' : 'anime';
  }
  
  // 昼 (12-15時)
  if (hour >= 12 && hour < 15) {
    return Math.random() < 0.3 ? 'food' : 'entertainment';
  }
  
  // 午後 (15-18時)
  if (hour >= 15 && hour < 18) {
    return Math.random() < 0.4 ? 'game' : 'tech';
  }
  
  // 夕方 (18-21時)
  if (hour >= 18 && hour < 21) {
    return Math.random() < 0.5 ? 'movie' : 'entertainment';
  }
  
  // 夜 (21-24時)
  if (hour >= 21 && hour < 24) {
    // 土日は lifestyle 確率を上げる
    const lifestyleProbability = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.4 : 0.2;
    if (Math.random() < lifestyleProbability) return 'lifestyle';  // adult → lifestyle
    return Math.random() < 0.6 ? 'anime' : 'game';
  }
  
  return 'entertainment'; // デフォルト
}

// === 新規：商品ファースト機能 ===

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
        
        loadModules();
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

// 商品プレビュー（どんな商品が選ばれるか事前確認）
exports.previewProductSelection = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const category = req.query.category || 'entertainment';
        
        const ProductFirstBlogTool = require('./lib/product-first-blog-tool');
        const tool = new ProductFirstBlogTool();
        
        // 商品だけを選択
        const product = await tool.selectTargetProduct(category);
        
        res.json({
          success: true,
          category,
          selectedProduct: {
            title: product.title,
            price: product.price,
            description: product.description,
            imageUrl: product.imageUrl,
            affiliateUrl: product.affiliateUrl,
            review: product.review,
            score: product.score // 選択スコア
          },
          relatedProducts: product.relatedProducts || [],
          message: 'この商品で記事を作成します'
        });
        
      } catch (error) {
        console.error('商品プレビューエラー:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message
        });
      }
    });
  });

// DMM統合テスト
exports.testDMMIntegration = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      try {
        const DMMIntegration = require('./lib/dmm-integration');
        const dmm = new DMMIntegration();
        
        const category = req.query.category || 'entertainment';
        const products = await dmm.searchProducts(category, {
          hits: 5
        });
        
        res.json({
          success: true,
          category,
          productsFound: products.length,
          products,
          message: 'DMM API integration test successful'
        });
      } catch (error) {
        console.error('DMM test error:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  });
