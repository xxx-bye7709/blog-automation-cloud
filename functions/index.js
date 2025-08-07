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

// 🚀 WordPress自動投稿機能
exports.publishArticle = onRequest(async (request, response) => {
    try {
        const { templateId, keyword, theme, customPrompt, publishToWordPress = false } = request.body || request.query;
        
        // パラメータ検証
        if (!templateId) {
            return response.status(400).json({
                success: false,
                error: 'templateId is required'
            });
        }
        
        logger.info(`Publishing article with template: ${templateId}`, { 
            templateId, 
            keyword, 
            theme,
            publishToWordPress 
        });
        
        // CloudBlogTool初期化
        const blogTool = new CloudBlogTool();
        
        // 記事生成
        const article = await blogTool.generateArticle({
            templateId: templateId,
            keyword: keyword || 'テストキーワード',
            theme: theme || keyword || 'テストテーマ',
            customPrompt: customPrompt
        });
        
        let wordpressResult = null;
        
        // WordPress自動投稿（オプション）
        if (publishToWordPress && publishToWordPress !== 'false') {
            try {
                logger.info('Starting WordPress publishing...');
                wordpressResult = await blogTool.publishToWordPress(article);
                logger.info('Article published to WordPress successfully', { 
                    postId: wordpressResult.id,
                    url: wordpressResult.link 
                });
            } catch (wpError) {
                logger.error('WordPress publishing failed:', wpError);
                // WordPressエラーでも記事生成は成功として扱う
                wordpressResult = {
                    error: wpError.message,
                    published: false,
                    details: 'WordPress投稿に失敗しましたが、記事生成は成功しています'
                };
            }
        }
        
        response.json({
            success: true,
            templateId: templateId,
            keyword: keyword,
            theme: theme,
            article: article,
            wordpress: wordpressResult,
            generatedAt: new Date().toISOString(),
            publishedToWordPress: !!wordpressResult?.published
        });
        
    } catch (error) {
        logger.error('Error publishing article:', error);
        response.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 📦 バッチ記事生成機能（複数記事の一括生成）
exports.generateBatchArticles = onRequest(async (request, response) => {
    try {
        const { articles, publishToWordPress = false } = request.body;
        
        if (!articles || !Array.isArray(articles)) {
            return response.status(400).json({
                success: false,
                error: 'articles array is required. Format: [{"templateId": "review", "keyword": "test", "theme": "test theme"}]'
            });
        }
        
        if (articles.length > 10) {
            return response.status(400).json({
                success: false,
                error: 'Maximum 10 articles per batch to prevent API rate limits'
            });
        }
        
        logger.info(`Generating batch articles: ${articles.length} articles`, {
            publishToWordPress: publishToWordPress
        });
        
        const blogTool = new CloudBlogTool();
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        
        // 順次処理（並行処理はAPI制限回避のため避ける）
        for (let i = 0; i < articles.length; i++) {
            const articleConfig = articles[i];
            
            try {
                logger.info(`Processing article ${i + 1}/${articles.length}`, articleConfig);
                
                // 記事生成
                const article = await blogTool.generateArticle({
                    templateId: articleConfig.templateId,
                    keyword: articleConfig.keyword,
                    theme: articleConfig.theme || articleConfig.keyword,
                    customPrompt: articleConfig.customPrompt
                });
                
                let wordpressResult = null;
                
                // WordPress投稿（オプション）
                if (publishToWordPress) {
                    try {
                        wordpressResult = await blogTool.publishToWordPress(article);
                        logger.info(`Article ${i + 1} published to WordPress`, { 
                            postId: wordpressResult.id 
                        });
                    } catch (wpError) {
                        logger.error(`WordPress publishing failed for article ${i + 1}:`, wpError);
                        wordpressResult = {
                            error: wpError.message,
                            published: false
                        };
                    }
                }
                
                results.push({
                    index: i,
                    success: true,
                    article: article,
                    wordpress: wordpressResult,
                    config: articleConfig
                });
                
                successCount++;
                
                // API制限回避のため記事生成間隔を調整
                if (i < articles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒待機
                }
                
            } catch (articleError) {
                logger.error(`Error generating article ${i + 1}:`, articleError);
                results.push({
                    index: i,
                    success: false,
                    error: articleError.message,
                    config: articleConfig
                });
                errorCount++;
            }
        }
        
        response.json({
            success: true,
            totalRequested: articles.length,
            successCount: successCount,
            errorCount: errorCount,
            results: results,
            publishToWordPress: publishToWordPress,
            completedAt: new Date().toISOString(),
            summary: {
                generated: successCount,
                failed: errorCount,
                wordpressPublished: results.filter(r => r.wordpress?.published).length
            }
        });
        
    } catch (error) {
        logger.error('Error in batch generation:', error);
        response.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🔧 WordPress接続テスト機能
exports.testWordPressConnection = onRequest(async (request, response) => {
    try {
        logger.info('Testing WordPress connection...');
        
        const blogTool = new CloudBlogTool();
        
        // WordPress接続テストを実行
        const testResult = await blogTool.testWordPressConnection();
        
        response.json({
            success: true,
            wordpress: {
                connected: testResult.success,
                siteUrl: testResult.siteUrl,
                version: testResult.version,
                user: testResult.user,
                message: testResult.message
            },
            environment: {
                hasWpUrl: !!process.env.WP_URL,
                hasWpUsername: !!process.env.WP_USERNAME,
                hasWpPassword: !!process.env.WP_PASSWORD
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('WordPress connection test failed:', error);
        response.status(500).json({
            success: false,
            error: error.message,
            wordpress: {
                connected: false,
                message: 'Connection test failed'
            },
            environment: {
                hasWpUrl: !!process.env.WP_URL,
                hasWpUsername: !!process.env.WP_USERNAME,
                hasWpPassword: !!process.env.WP_PASSWORD
            }
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
