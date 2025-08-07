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

console.log("🚀 Firebase Functions initialized successfully");
console.log("Available endpoints:");
console.log("- helloWorld (GET)");
console.log("- healthCheck (GET)");
