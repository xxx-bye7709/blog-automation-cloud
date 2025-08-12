// functions/test-yoast-seo.js
require('dotenv').config();
const BlogAutomationTool = require('./lib/blog-tool');

async function testYoastSEO() {
  console.log('🚀 Yoast SEO最適化テスト開始...\n');
  
  const tool = new BlogAutomationTool();
  
  try {
    // Step 1: 記事生成テスト
    console.log('📝 記事を生成中...');
    const article = await tool.generateArticle('tech'); // techカテゴリーでテスト
    
    console.log('\n✅ 生成された記事情報:');
    console.log('- タイトル:', article.title);
    console.log('- タイトル長:', article.title.length, '文字');
    console.log('- 抜粋:', article.excerpt);
    console.log('- 抜粋長:', article.excerpt.length, '文字');
    console.log('- タグ:', article.tags.join(', '));
    console.log('- コンテンツ長:', article.content.length, '文字');
    
    // SEO要素の確認
    console.log('\n🔍 SEO要素チェック:');
    const hasH2 = article.content.includes('<h2>');
    const hasH3 = article.content.includes('<h3>');
    const hasTransitionWords = article.content.includes('さらに') || 
                               article.content.includes('また') || 
                               article.content.includes('つまり');
    
    console.log('- H2タグ:', hasH2 ? '✅ あり' : '❌ なし');
    console.log('- H3タグ:', hasH3 ? '✅ あり' : '❌ なし');
    console.log('- 遷移語:', hasTransitionWords ? '✅ あり' : '❌ なし');
    
    // Step 2: WordPress投稿テスト（オプション）
    console.log('\n📤 WordPressに投稿しますか？');
    console.log('投稿する場合は、Ctrl+Cで中断して、以下のコマンドを実行:');
    console.log('node test-yoast-seo.js --post\n');
    
    if (process.argv.includes('--post')) {
      console.log('📮 WordPressに投稿中...');
      const result = await tool.postToWordPress(article);
      
      console.log('\n✅ 投稿成功！');
      console.log('- Post ID:', result.postId);
      console.log('- URL:', result.url);
      console.log('- アイキャッチ画像:', result.attachmentId ? '✅ あり' : '❌ なし');
      
      console.log('\n📊 Yoast SEO確認手順:');
      console.log('1. WordPress管理画面にログイン');
      console.log('2. 投稿一覧から該当記事を開く');
      console.log('3. Yoast SEOメタボックスを確認');
      console.log('   - SEOスコア（緑・黄・赤）');
      console.log('   - 読みやすさスコア');
      console.log('   - フォーカスキーワード認識');
    }
    
  } catch (error) {
    console.error('\n❌ エラー発生:', error.message);
    console.error('詳細:', error);
  }
}

// 実行
testYoastSEO();
