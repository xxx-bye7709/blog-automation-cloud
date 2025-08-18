const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');

// React importにuseCallbackを追加
let updatedContent = content.replace(
  "import React, { useState, useEffect } from 'react';",
  "import React, { useState, useEffect, useCallback } from 'react';"
);

// loadLocalHistoryをuseCallbackでラップ
updatedContent = updatedContent.replace(
  'const loadLocalHistory = () => {',
  'const loadLocalHistory = useCallback(() => {'
);

// 関数の終わりにuseCallbackの依存配列を追加
updatedContent = updatedContent.replace(
  /const loadLocalHistory = useCallback\(\(\) => \{[\s\S]*?\n  \};/,
  (match) => match.replace(/\};$/, '}, [historyManager]);')
);

// useEffectの依存配列を修正
updatedContent = updatedContent.replace(
  '}, [loadLocalHistory]);',
  '}, []);'
);

fs.writeFileSync('src/app/page.tsx', updatedContent);
console.log('✅ Fixed with useCallback!');
