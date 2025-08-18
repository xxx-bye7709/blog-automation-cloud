const fs = require('fs');

// ファイルを読み込み
const content = fs.readFileSync('src/app/page.tsx', 'utf8');

// fetchSystemMetrics関数を修正
const updatedContent = content.replace(
  /const fetchSystemMetrics = async \(\) => \{[\s\S]*?\n  \}/,
  `const fetchSystemMetrics = async () => {
    try {
      const response = await fetch(\`\${FIREBASE_URL}/getSystemMetrics\`);
      const result = await response.json();
      
      // APIレスポンスの構造を確認
      console.log('API Response:', result);
      
      // result.success && result.data の確認
      if (result && result.success && result.data) {
        setSystemMetrics(result.data);  // result.data を設定
        console.log('Metrics updated:', result.data);
      } else {
        console.warn('Invalid response format:', result);
      }
    } catch (error) {
      console.error('メトリクス取得エラー:', error);
    }
  }`
);

// ファイルを保存
fs.writeFileSync('src/app/page.tsx', updatedContent);
console.log('✅ fetchSystemMetrics function has been fixed!');
