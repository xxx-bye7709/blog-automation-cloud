const functions = require('firebase-functions');
const { CloudBlogTool } = require('./lib/blog-tool');

// Firebase Functions の地域設定（東京リージョン）
const region = 'asia-northeast1';

// 共通の実行時設定
const runtimeOptions = {
  timeoutSeconds: 540,
  memory: '1GB'
};

/**
 * 手動記事投稿Function（HTTP トリガー）
 * URL: https://asia-northeast1-[PROJECT-ID].cloudfunctions.net/createArticle
 */
exports.createArticle = functions
  .region(region)
  .runWith(runtimeOptions)
  .https.onRequest(async (request, response) => {
    // CORS 設定
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // OPTIONS リクエスト（プリフライト）の処理
    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    // POST メソッドのみ受け付ける
    if (request.method !== 'POST') {
      response.status(405).json({ 
        error: 'Method not allowed. Use POST.' 
      });
      return;
    }

    try {
      console.log('🚀 記事投稿リクエスト受信:', request.body);

      const { theme, keywords, template, category, tags } = request.body;
      
      // 必須パラメータチェック
      if (!theme || !keywords) {
        response.status(400).json({ 
          error: 'テーマ(theme)とキーワード(keywords)は必須です',
          example: {
            theme: 'プログラミング初心者向けのReact入門',
            keywords: 'React, JavaScript, 初心者, フロントエンド',
            template: 'beginner_guide',
            category: 2,
            tags: ['React', 'JavaScript']
          }
        });
        return;
      }

      // ブログツール初期化
      const blogTool = new CloudBlogTool();
      
      // 記事作成・投稿実行
      const result = await blogTool.createAndPublishArticle(
        theme,
        keywords,
        template || null,
        category || 1,
        tags || []
      );

      console.log('✅ 記事投稿完了:', result);
      response.json(result);

    } catch (error) {
      console.error('❌ Function エラー:', error);
      response.status(500).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

/**
 * アダルト記事投稿Function（HTTP トリガー）
 * URL: https://asia-northeast1-[PROJECT-ID].cloudfunctions.net/createAdultArticle
 */
exports.createAdultArticle = functions
  .region(region)
  .runWith(runtimeOptions)
  .https.onRequest(async (request, response) => {
    // CORS 設定
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    try {
      console.log('🔞 アダルト記事投稿リクエスト受信:', request.body);

      const { theme, keywords, category, tags } = request.body;
      
      // 必須パラメータチェック
      if (!theme || !keywords) {
        response.status(400).json({ 
          error: 'テーマ(theme)とキーワード(keywords)は必須です',
          example: {
            theme: '【実体験レビュー】人気オナホ徹底比較',
            keywords: 'オナホ, レビュー, 実体験, 比較',
            category: 123,
            tags: ['オナホ', 'レビュー']
          }
        });
        return;
      }

      const blogTool = new CloudBlogTool();
      
      // 強制的にアダルトテンプレートを使用
      const result = await blogTool.createAndPublishArticle(
        theme,
        keywords,
        'adult_review', // アダルト専用テンプレート
        category || 123,
        tags || ['アダルト', 'レビュー']
      );

      console.log('✅ アダルト記事投稿完了:', result);

      response.json({
        ...result,
        type: 'adult_content',
        warning: '18歳未満閲覧禁止コンテンツです'
      });

    } catch (error) {
      console.error('❌ アダルト記事投稿エラー:', error);
      response.status(500).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

/**
 * 定期記事投稿Function（Pub/Sub トリガー）
 * Cloud Scheduler から呼び出される
 */
exports.scheduledArticlePost = functions
  .region(region)
  .runWith(runtimeOptions)
  .pubsub.topic('daily-blog-post')
  .onPublish(async (message) => {
    try {
      console.log('🕒 定期記事投稿を開始');
      console.log('メッセージデータ:', message.data ? Buffer.from(message.data, 'base64').toString() : 'Empty');

      // 記事テーマのローテーション配列
      const themes = [
        {
          theme: 'プログラミング初心者が最初に学ぶべき言語選択ガイド',
          keywords: 'プログラミング, 初心者, 言語選択, ガイド, 学習',
          template: 'beginner_guide',
          category: 2,
          tags: ['プログラミング', '初心者', '言語選択']
        },
        {
          theme: '2024年版 効率的なWeb開発ツール厳選10選',
          keywords: 'Web開発, ツール, 効率化, 2024年, おすすめ',
          template: 'listicle', 
          category: 3,
          tags: ['Web開発', 'ツール', 'おすすめ']
        },
        {
          theme: 'ChatGPT APIを使ったアプリ開発の始め方',
          keywords: 'ChatGPT, API, アプリ開発, 始め方, OpenAI',
          template: 'howto',
          category: 4,
          tags: ['ChatGPT', 'API', '開発']
        },
        {
          theme: '最新AI技術トレンドと今後の展望',
          keywords: 'AI技術, 最新, トレンド, 展望, 人工知能',
          template: 'news',
          category: 5,
          tags: ['AI', '技術', 'トレンド']
        },
        {
          theme: 'フリーランスエンジニアの案件獲得術',
          keywords: 'フリーランス, エンジニア, 案件獲得, 方法, 収入',
          template: 'howto',
          category: 6,
          tags: ['フリーランス', 'エンジニア', '案件']
        }
      ];

      // 日付ベースでテーマをローテーション
      const today = new Date();
      const themeIndex = today.getDate() % themes.length;
      const selectedTheme = themes[themeIndex];

      console.log('📝 選択されたテーマ:', selectedTheme);

      const blogTool = new CloudBlogTool();
      const result = await blogTool.createAndPublishArticle(
        selectedTheme.theme,
        selectedTheme.keywords,
        selectedTheme.template,
        selectedTheme.category,
        selectedTheme.tags
      );

      console.log('✅ 定期投稿結果:', result);
      return result;
      
    } catch (error) {
      console.error('❌ 定期投稿エラー:', error);
      throw error; // 再試行のためにエラーを再投げ
    }
  });

/**
 * バッチ記事投稿Function（HTTP トリガー）
 * 複数記事を一度に予約投稿する
 */
exports.batchCreateArticles = functions
  .region(region)
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB' // バッチ処理のためメモリ増加
  })
  .https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    try {
      const { articles } = request.body;

      if (!articles || !Array.isArray(articles)) {
        response.status(400).json({
          error: 'articles配列は必須です',
          example: {
            articles: [
              {
                theme: '記事テーマ1',
                keywords: 'キーワード1, キーワード2',
                template: 'howto',
                category: 2,
                tags: ['tag1', 'tag2']
              }
            ]
          }
        });
        return;
      }

      console.log(`🔄 バッチ処理開始: ${articles.length}記事`);

      const blogTool = new CloudBlogTool();
      const results = [];

      // 各記事を順次処理（並列処理だとAPI制限に引っかかる可能性）
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        console.log(`📝 処理中 (${i + 1}/${articles.length}): ${article.theme}`);

        try {
          const result = await blogTool.createAndPublishArticle(
            article.theme,
            article.keywords,
            article.template,
            article.category,
            article.tags
          );

          results.push({
            index: i,
            theme: article.theme,
            ...result
          });

          // API制限を考慮して間隔を空ける
          if (i < articles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }

        } catch (error) {
          console.error(`❌ 記事 ${i + 1} でエラー:`, error);
          results.push({
            index: i,
            theme: article.theme,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ バッチ処理完了: ${successCount}/${articles.length} 成功`);

      response.json({
        success: true,
        total: articles.length,
        successful: successCount,
        failed: articles.length - successCount,
        results: results
      });

    } catch (error) {
      console.error('❌ バッチ処理エラー:', error);
      response.status(500).json({ 
        error: error.message 
      });
    }
  });

/**
 * ヘルスチェックFunction（HTTP トリガー）
 * システムの状態確認用
 */
exports.healthCheck = functions
  .region(region)
  .https.onRequest((request, response) => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      region: region,
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    console.log('💓 ヘルスチェック実行:', healthData);
    response.json(healthData);
  });

/**
 * テンプレート一覧取得Function（HTTP トリガー）
 * 利用可能なテンプレートの確認用
 */
exports.getTemplates = functions
  .region(region)
  .https.onRequest((request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    try {
      const { ArticleTemplates } = require('./lib/templates');
      
      const templateList = Object.keys(ArticleTemplates).map(key => ({
        key,
        name: ArticleTemplates[key].name,
        wordCount: ArticleTemplates[key].total_word_count,
        sections: ArticleTemplates[key].structure.length,
        description: `${ArticleTemplates[key].structure.length}セクション構成の${ArticleTemplates[key].name}`
      }));

      response.json({
        success: true,
        count: templateList.length,
        templates: templateList,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ テンプレート取得エラー:', error);
      response.status(500).json({ 
        error: error.message 
      });
    }
  });

console.log('🚀 Firebase Functions initialized successfully');
console.log('Available endpoints:');
console.log('- createArticle (POST)');
console.log('- createAdultArticle (POST)'); 
console.log('- batchCreateArticles (POST)');
console.log('- scheduledArticlePost (PubSub)');
console.log('- healthCheck (GET)');
console.log('- getTemplates (GET)');