const functions = require('firebase-functions');

// Firebase Functions の地域設定（東京リージョン）
const region = 'asia-northeast1';

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
      },
      message: 'Firebase Functions deployment successful! 🎉'
    };

    console.log('💓 ヘルスチェック実行:', healthData);
    response.json(healthData);
  });

/**
 * テスト用の簡単なFunction
 */
exports.testFunction = functions
  .region(region)
  .https.onRequest((request, response) => {
    response.json({
      message: 'Firebase Functions deployment successful! 🚀',
      timestamp: new Date().toISOString(),
      endpoints: [
        'healthCheck',
        'testFunction'
      ]
    });
  });

/**
 * テンプレート一覧取得Function（簡易版）
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

    const templateList = [
      {
        key: 'howto',
        name: 'ハウツー・解説記事',
        wordCount: '1500-2000',
        sections: 5,
        description: '5セクション構成のハウツー記事'
      },
      {
        key: 'listicle',
        name: 'リスト・ランキング記事',
        wordCount: '1700-2400',
        sections: 4,
        description: '4セクション構成のリスト記事'
      },
      {
        key: 'review',
        name: 'レビュー・体験談記事',
        wordCount: '1650-2200',
        sections: 5,
        description: '5セクション構成のレビュー記事'
      }
    ];

    response.json({
      success: true,
      count: templateList.length,
      templates: templateList,
      timestamp: new Date().toISOString()
    });
  });

console.log('🚀 Firebase Functions initialized successfully (simplified version)');
console.log('Available endpoints:');
console.log('- healthCheck (GET)');
console.log('- testFunction (GET)');
console.log('- getTemplates (GET)');