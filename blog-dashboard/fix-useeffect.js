const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');

// useEffectの依存配列を修正
const updatedContent = content.replace(
  '}, []);',
  '}, [loadLocalHistory]);'
);

fs.writeFileSync('src/app/page.tsx', updatedContent);
console.log('✅ useEffect dependency fixed!');
