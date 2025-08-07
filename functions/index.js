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
