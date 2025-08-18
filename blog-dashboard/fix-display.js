const fs = require('fs');

const content = fs.readFileSync('src/app/page.tsx', 'utf8');

// システムメトリクスの値を正しく使用するように修正
let updatedContent = content;

// todayCountとmonthCountの表示を修正
// 元: {localStats.todayCount}
// 新: {systemMetrics?.todayCount || localStats.todayCount}

updatedContent = updatedContent.replace(
  /<div className="text-3xl font-bold">{localStats\.todayCount}<\/div>/g,
  '<div className="text-3xl font-bold">{systemMetrics?.todayCount || localStats.todayCount}</div>'
);

updatedContent = updatedContent.replace(
  /<div className="text-3xl font-bold">{localStats\.monthCount}<\/div>/g,
  '<div className="text-3xl font-bold">{systemMetrics?.monthCount || localStats.monthCount}</div>'
);

// サーバー側の表示も修正
updatedContent = updatedContent.replace(
  /サーバー: -/g,
  'サーバー: {systemMetrics?.todayCount ?? "-"}'
);

fs.writeFileSync('src/app/page.tsx', updatedContent);
console.log('✅ Display logic fixed!');
