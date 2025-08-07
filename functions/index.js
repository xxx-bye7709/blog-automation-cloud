const functions = require('firebase-functions');

// 既存のhelloWorld関数
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.json({
    message: "Hello from Firebase Functions!",
    status: "success",
    timestamp: new Date().toISOString()
  });
});

// ヘルスチェック機能
exports.healthCheck = functions
  .region('asia-northeast1')
  .https.onRequest((request, response) => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      region: 'asia-northeast1',
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

// テンプレート一覧取得機能
exports.getTemplates = functions
  .region('asia-northeast1')
  .https.onRequest((request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    try {
      const { listTemplates } = require('./lib/templates');
      const templateList = listTemplates();

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

// CloudBlogTool初期化テスト
exports.testArticleGeneration = functions
  .region('asia-northeast1')
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
  })
  .https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    try {
      const { CloudBlogTool } = require('./lib/blog-tool');
      
      console.log('🤖 CloudBlogTool初期化テスト開始');
      const blogTool = new CloudBlogTool();
      
      const systemInfo = blogTool.getSystemInfo();
      
      response.json({
        success: true,
        message: "CloudBlogTool initialization successful",
        systemInfo: systemInfo,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ CloudBlogTool初期化エラー:', error);
      response.status(500).json({
        error: error.message,
        stack: error.stack
      });
    }
  });

// OpenAI API接続テスト機能
exports.testOpenAI = functions
  .region('asia-northeast1')
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB'
  })
  .https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    try {
      const { CloudBlogTool } = require('./lib/blog-tool');
      
      const blogTool = new CloudBlogTool();
      
      const testPrompt = "プログラミング初心者向けに、Pythonの基本について200文字で説明してください。";
      
      console.log('🤖 OpenAI API テスト開始');
      const testContent = await blogTool.generateContent(testPrompt);
      
      response.json({
        success: true,
        message: "OpenAI API connection successful",
        testPrompt: testPrompt,
        generatedContent: testContent,
        contentLength: testContent.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ OpenAI API テストエラー:', error);
      response.status(500).json({
        error: error.message,
        errorType: error.response?.status || 'unknown'
      });
    }
  });

// テンプレートベース記事生成機能
exports.generateArticle = functions
  .region('asia-northeast1')
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
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
      const { theme, keywords, template } = request.body;

      if (!theme || !keywords) {
        response.status(400).json({
          error: 'テーマ(theme)とキーワード(keywords)は必須です',
          example: {
            theme: 'プログラミング初心者向けのReact入門',
            keywords: 'React, JavaScript, 初心者, フロントエンド',
            template: 'beginner_guide'
          }
        });
        return;
      }

      const { CloudBlogTool } = require('./lib/blog-tool');
      const blogTool = new CloudBlogTool();

      console.log('📝 記事生成開始');
      console.log(`テーマ: ${theme}`);
      console.log(`キーワード: ${keywords}`);
      console.log(`テンプレート: ${template || '自動選択'}`);

      const articleData = await blogTool.generateArticleWithTemplate(
        theme,
        keywords,
        template || null
      );

      console.log('✅ 記事生成完了');

      response.json({
        success: true,
        article: {
          title: articleData.title,
          content: articleData.content,
          template: articleData.template,
          wordCount: articleData.wordCount,
          originalTheme: articleData.originalTheme,
          keywords: articleData.keywords
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ 記事生成エラー:', error);
      response.status(500).json({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

console.log("🚀 Firebase Functions initialized successfully");
console.log("Available endpoints:");
console.log("- helloWorld (GET)");
console.log("- healthCheck (GET)");
console.log("- getTemplates (GET)");
console.log("- testArticleGeneration (GET)");
console.log("- testOpenAI (GET)");
console.log("- generateArticle (POST)");
