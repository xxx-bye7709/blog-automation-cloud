const fs = require('fs');
let content = fs.readFileSync('index.js', 'utf8');

// 修正が必要な関数のリスト
const functions = [
  'generateEntertainmentArticle',
  'generateAnimeArticle', 
  'generateGameArticle',
  'generateMovieArticle',
  'generateMusicArticle',
  'generateTechArticle',
  'generateBeautyArticle',
  'generateFoodArticle'
];

functions.forEach(funcName => {
  // カテゴリー名を抽出
  const category = funcName.replace('generate', '').replace('Article', '').toLowerCase();
  
  // 正規表現で関数を探して修正
  const pattern = new RegExp(
    `(exports\\.${funcName}[\\s\\S]*?try \\{)(\\s*const result = await generateArticleForCategory\\('${category}'\\);)`,
    'g'
  );
  
  const replacement = `$1
        const targetSite = req.body?.targetSite || null;
        const result = await generateArticleForCategory('${category}', targetSite);`;
  
  content = content.replace(pattern, replacement);
});

fs.writeFileSync('index.js', content);
console.log('✅ All functions updated!');
