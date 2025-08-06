/**
 * 記事雛形テンプレートシステム
 * 完全クラウド版 - Firebase Functions用
 */

const ArticleTemplates = {
  // ハウツー記事雛形
  howto: {
    name: "ハウツー・解説記事",
    structure: [
      {
        section: "導入部",
        heading: "h2",
        content_type: "introduction",
        word_count: "200-300",
        requirements: [
          "読者の悩みや課題を提示",
          "記事で解決できることを明示",
          "読み進める理由を提供"
        ]
      },
      {
        section: "基本知識",
        heading: "h2",
        content_type: "explanation",
        word_count: "300-400",
        requirements: [
          "必要な前提知識を説明",
          "専門用語の定義",
          "具体例を含める"
        ]
      },
      {
        section: "手順・方法",
        heading: "h2",
        content_type: "steps",
        word_count: "400-600",
        subsections: [
          {
            heading: "h3",
            pattern: "ステップ{number}: {action}",
            count: "3-5個",
            word_count: "100-150"
          }
        ],
        requirements: [
          "具体的な手順を番号付きで説明",
          "各ステップに画像や例を含める",
          "注意点や失敗例も記載"
        ]
      },
      {
        section: "応用・コツ",
        heading: "h2",
        content_type: "tips",
        word_count: "300-400",
        requirements: [
          "より効果的な方法",
          "よくある間違いと対処法",
          "プロのテクニック"
        ]
      },
      {
        section: "まとめ",
        heading: "h2",
        content_type: "conclusion",
        word_count: "200-300",
        requirements: [
          "重要ポイントの復習",
          "次のアクションを促す",
          "関連記事への誘導"
        ]
      }
    ],
    total_word_count: "1500-2000",
    seo_requirements: [
      "タイトルに数字を含める（「5つの方法」「3ステップで」など）",
      "見出しにキーワードを自然に含める",
      "読者の検索意図に応える内容構成"
    ]
  },

  // リスト記事雛形
  listicle: {
    name: "リスト・ランキング記事",
    structure: [
      {
        section: "導入部",
        heading: "h2",
        content_type: "introduction",
        word_count: "200-250",
        requirements: [
          "なぜこのリストが重要かを説明",
          "選定基準を明示",
          "読者のメリットを提示"
        ]
      },
      {
        section: "リスト項目",
        heading: "h2",
        content_type: "list_items",
        word_count: "1000-1500",
        subsections: [
          {
            heading: "h3",
            pattern: "{number}. {item_name}",
            count: "5-10個",
            word_count: "150-200",
            sub_structure: [
              "特徴・概要（50-80文字）",
              "詳細説明（100-120文字）",
              "おすすめポイント（30-50文字）"
            ]
          }
        ],
        requirements: [
          "各項目に具体的な特徴を記載",
          "比較しやすい統一フォーマット",
          "画像や図表で視覚的に説明"
        ]
      },
      {
        section: "比較・選び方",
        heading: "h2",
        content_type: "comparison",
        word_count: "300-400",
        requirements: [
          "項目別比較表",
          "用途別おすすめ",
          "選択基準の提示"
        ]
      },
      {
        section: "まとめ",
        heading: "h2",
        content_type: "conclusion",
        word_count: "200-250",
        requirements: [
          "総合的な推奨",
          "最終的なアドバイス",
          "次のステップの提案"
        ]
      }
    ],
    total_word_count: "1700-2400",
    seo_requirements: [
      "タイトルに具体的な数字",
      "「おすすめ」「比較」「ランキング」等のキーワード",
      "各項目で関連キーワードを使用"
    ]
  },

  // レビュー記事雛形
  review: {
    name: "レビュー・体験談記事",
    structure: [
      {
        section: "商品・サービス概要",
        heading: "h2",
        content_type: "overview",
        word_count: "200-300",
        requirements: [
          "基本情報（価格、特徴、対象者）",
          "なぜ試してみたのか",
          "第一印象"
        ]
      },
      {
        section: "実際に使ってみた感想",
        heading: "h2",
        content_type: "experience",
        word_count: "600-800",
        subsections: [
          {
            heading: "h3",
            pattern: "{aspect}について",
            examples: ["使いやすさ", "効果", "コスパ", "サポート"],
            word_count: "150-200"
          }
        ],
        requirements: [
          "具体的な使用体験",
          "良い点と悪い点を両方記載",
          "写真や数値データを含める"
        ]
      },
      {
        section: "他社製品との比較",
        heading: "h2",
        content_type: "comparison",
        word_count: "300-400",
        requirements: [
          "競合製品との違い",
          "価格・機能比較",
          "選ぶべき人の特徴"
        ]
      },
      {
        section: "メリット・デメリット",
        heading: "h2",
        content_type: "pros_cons",
        word_count: "300-400",
        subsections: [
          {
            heading: "h3",
            pattern: "メリット",
            format: "箇条書き3-5個"
          },
          {
            heading: "h3",
            pattern: "デメリット",
            format: "箇条書き2-4個"
          }
        ],
        requirements: [
          "具体的で客観的な評価",
          "実体験に基づく内容",
          "読者の判断材料となる情報"
        ]
      },
      {
        section: "総合評価・まとめ",
        heading: "h2",
        content_type: "conclusion",
        word_count: "250-300",
        requirements: [
          "5段階評価や点数",
          "おすすめする人・しない人",
          "購入・利用のアドバイス"
        ]
      }
    ],
    total_word_count: "1650-2200",
    seo_requirements: [
      "商品名・サービス名をタイトルに含める",
      "「レビュー」「口コミ」「評価」等のキーワード",
      "具体的な評価軸での見出し"
    ]
  },

  // ニュース・トレンド記事雛形
  news: {
    name: "ニュース・トレンド記事",
    structure: [
      {
        section: "ニュース概要",
        heading: "h2",
        content_type: "news_summary",
        word_count: "200-300",
        requirements: [
          "5W1H（いつ、どこで、誰が、何を、なぜ、どのように）",
          "要点を簡潔に整理",
          "なぜ重要なのかを説明"
        ]
      },
      {
        section: "詳細・背景",
        heading: "h2",
        content_type: "background",
        word_count: "400-500",
        requirements: [
          "これまでの経緯",
          "関連する過去の出来事",
          "業界・市場への影響"
        ]
      },
      {
        section: "専門家の見解・分析",
        heading: "h2",
        content_type: "analysis",
        word_count: "300-400",
        requirements: [
          "客観的な分析",
          "複数の視点からの考察",
          "データや根拠の提示"
        ]
      },
      {
        section: "今後の影響・展望",
        heading: "h2",
        content_type: "future_outlook",
        word_count: "300-400",
        requirements: [
          "短期・長期的な影響予測",
          "関連業界への波及効果",
          "注目すべきポイント"
        ]
      },
      {
        section: "まとめ",
        heading: "h2",
        content_type: "conclusion",
        word_count: "200-250",
        requirements: [
          "重要ポイントの整理",
          "読者への影響",
          "今後の注目点"
        ]
      }
    ],
    total_word_count: "1400-1850",
    seo_requirements: [
      "時事性のあるキーワード",
      "日付を含むタイトル",
      "関連するトレンドワード"
    ]
  },

  // 初心者向け解説記事雛形
  beginner_guide: {
    name: "初心者向けガイド記事",
    structure: [
      {
        section: "○○とは？基本を知ろう",
        heading: "h2",
        content_type: "basic_explanation",
        word_count: "300-400",
        requirements: [
          "専門用語を使わない簡単な説明",
          "身近な例えで理解しやすく",
          "なぜ重要なのかを説明"
        ]
      },
      {
        section: "初心者が知っておくべき基礎知識",
        heading: "h2",
        content_type: "fundamental_knowledge",
        word_count: "400-500",
        subsections: [
          {
            heading: "h3",
            pattern: "基礎知識{number}",
            count: "3-4個",
            word_count: "100-125"
          }
        ],
        requirements: [
          "必要最小限の知識に絞る",
          "図解や例を多用",
          "専門用語の簡単な解説"
        ]
      },
      {
        section: "始め方・最初のステップ",
        heading: "h2",
        content_type: "getting_started",
        word_count: "500-600",
        requirements: [
          "具体的なアクションプラン",
          "必要な道具・環境の説明",
          "最初につまずきやすいポイント"
        ]
      },
      {
        section: "よくある質問・つまずきポイント",
        heading: "h2",
        content_type: "faq",
        word_count: "400-500",
        subsections: [
          {
            heading: "h3",
            pattern: "Q. {question}",
            count: "4-6個",
            word_count: "60-80"
          }
        ],
        requirements: [
          "初心者が実際に疑問に思うこと",
          "具体的で実践的な回答",
          "失敗例と対処法"
        ]
      },
      {
        section: "次のステップ・上達のコツ",
        heading: "h2",
        content_type: "next_steps",
        word_count: "300-400",
        requirements: [
          "段階的な学習プラン",
          "おすすめのリソース",
          "モチベーション維持のコツ"
        ]
      }
    ],
    total_word_count: "1900-2400",
    seo_requirements: [
      "「初心者」「入門」「基礎」等のキーワード",
      "「始め方」「やり方」等のフレーズ",
      "対象分野の基本キーワード"
    ]
  },

  // アダルト商品レビュー記事雛形
  adult_review: {
    name: "アダルト商品レビュー記事",
    structure: [
      {
        section: "はじめに・購入のきっかけ",
        heading: "h2",
        content_type: "introduction",
        word_count: "200-300",
        requirements: [
          "購入に至った経緯や悩み",
          "商品への期待値",
          "読者との共感ポイント",
          "正直で親近感のある導入"
        ]
      },
      {
        section: "商品スペック・基本情報",
        heading: "h2",
        content_type: "specifications",
        word_count: "250-350",
        requirements: [
          "価格・サイズ・素材等の基本情報",
          "特徴的な機能の説明",
          "他商品との違い",
          "表やリストで見やすく整理"
        ]
      },
      {
        section: "実際に使ってみた感想",
        heading: "h2",
        content_type: "hands_on_experience",
        word_count: "600-800",
        subsections: [
          {
            heading: "h3",
            pattern: "{aspect}について",
            examples: ["第一印象", "使用感", "効果", "満足度"],
            count: "3-4個",
            word_count: "150-200"
          }
        ],
        requirements: [
          "具体的で詳細な使用体験",
          "率直で正直な感想",
          "読者が知りたいポイントを網羅",
          "適度にリアルな表現を使用"
        ]
      },
      {
        section: "良かった点・悪かった点",
        heading: "h2",
        content_type: "pros_cons_comparison",
        word_count: "300-400",
        subsections: [
          {
            heading: "h3",
            pattern: "良かった点",
            format: "箇条書き3-5個"
          },
          {
            heading: "h3",
            pattern: "悪かった点・改善希望",
            format: "箇条書き2-4個"
          }
        ],
        requirements: [
          "客観的で公平な評価",
          "購入検討者の判断材料となる内容",
          "表形式での比較も効果的",
          "具体的で分かりやすい表現"
        ]
      },
      {
        section: "総合評価・まとめ",
        heading: "h2",
        content_type: "final_verdict",
        word_count: "250-350",
        requirements: [
          "総合的な満足度（5段階評価等）",
          "どんな人におすすめか",
          "購入を迷っている人へのアドバイス",
          "リピート購入の意向"
        ]
      },
      {
        section: "購入方法・お得情報",
        heading: "h2",
        content_type: "purchase_info",
        word_count: "200-300",
        requirements: [
          "公式サイトや正規販売店の紹介",
          "価格情報や割引情報",
          "アフィリエイトリンクの自然な挿入",
          "購入時の注意点やアドバイス"
        ]
      }
    ],
    total_word_count: "1800-2500",
    seo_requirements: [
      "商品名を正確にタイトルに含める",
      "「レビュー」「口コミ」「使ってみた」「評価」等のキーワード",
      "関連キーワードを見出しに自然に配置",
      "メタディスクリプションで購買意欲を刺激"
    ],
    cv_requirements: [
      "記事中盤と最後にCTAを配置",
      "アフィリエイトリンクを自然に挿入",
      "緊急性や限定性を適度に演出",
      "購入への心理的ハードルを下げる表現"
    ]
  }
};

/**
 * テーマとキーワードに基づいて最適なテンプレートを提案
 * @param {string} theme - 記事テーマ
 * @param {string} keywords - カンマ区切りのキーワード
 * @returns {string} 推奨テンプレートのキー
 */
function suggestTemplate(theme, keywords) {
  const themeWords = theme.toLowerCase();
  const keywordList = keywords.toLowerCase().split(',').map(k => k.trim());

  console.log(`🔍 テンプレート選択分析: テーマ="${theme}", キーワード="${keywords}"`);

  // アダルト関連キーワードの判定
  const adultKeywords = ['オナホ', 'アダルト', 'グッズ', '大人', 'セックス', '性具', 'ラブ', 'バイブ', 'ローター', '玩具', 'おもちゃ', 'エロ'];
  if (keywordList.some(k => adultKeywords.some(ak => k.includes(ak))) ||
      adultKeywords.some(ak => themeWords.includes(ak))) {
    console.log('📋 アダルトテンプレート選択');
    return 'adult_review';
  }

  // 方法・手順系
  if (keywordList.some(k => ['方法', 'やり方', 'ステップ', '手順', 'の仕方'].includes(k)) ||
      themeWords.includes('方法') || themeWords.includes('やり方') || themeWords.includes('手順')) {
    console.log('📋 ハウツーテンプレート選択');
    return 'howto';
  }

  // リスト・ランキング系
  if (keywordList.some(k => ['おすすめ', 'ランキング', '比較', 'まとめ', '選', '厳選'].includes(k)) ||
      themeWords.includes('おすすめ') || themeWords.includes('まとめ') || themeWords.includes('ランキング')) {
    console.log('📋 リストテンプレート選択');
    return 'listicle';
  }

  // レビュー・体験談系
  if (keywordList.some(k => ['レビュー', '評価', '口コミ', '体験', '使ってみた', '試してみた'].includes(k)) ||
      themeWords.includes('レビュー') || themeWords.includes('評価') || themeWords.includes('体験')) {
    console.log('📋 レビューテンプレート選択');
    return 'review';
  }

  // ニュース・トレンド系
  if (keywordList.some(k => ['ニュース', '最新', 'トレンド', '速報', '動向', '話題'].includes(k)) ||
      themeWords.includes('ニュース') || themeWords.includes('最新') || themeWords.includes('トレンド')) {
    console.log('📋 ニューステンプレート選択');
    return 'news';
  }

  // 初心者・入門系
  if (keywordList.some(k => ['初心者', '入門', '基礎', '始め方', 'とは', '基本'].includes(k)) ||
      themeWords.includes('初心者') || themeWords.includes('入門') || themeWords.includes('基礎')) {
    console.log('📋 初心者ガイドテンプレート選択');
    return 'beginner_guide';
  }

  // デフォルトはハウツー記事
  console.log('📋 デフォルト（ハウツー）テンプレート選択');
  return 'howto';
}

/**
 * テンプレートから詳細なプロンプトを生成
 * @param {string} templateName - テンプレート名
 * @param {string} theme - 記事テーマ
 * @param {string} keywords - キーワード
 * @returns {string|null} 生成されたプロンプト
 */
function generateDetailedPrompt(templateName, theme, keywords) {
  const template = ArticleTemplates[templateName];
  if (!template) {
    console.error(`❌ テンプレート "${templateName}" が見つかりません`);
    return null;
  }

  console.log(`📝 詳細プロンプト生成: ${template.name}`);

  let prompt = `あなたは経験豊富なWebライターです。以下の雛形に従って高品質な記事を作成してください。

【記事テーマ】: ${theme}
【キーワード】: ${keywords}
【記事形式】: ${template.name}
【目標文字数】: ${template.total_word_count}

【記事構成・雛形】:
`;

  template.structure.forEach((section, index) => {
    prompt += `\n${index + 1}. ${section.section} (${section.heading})
   - 文字数: ${section.word_count}
   - 内容タイプ: ${section.content_type}
   - 要件: ${section.requirements.join(', ')}`;

    if (section.subsections) {
      prompt += `\n   - サブセクション: ${section.subsections[0].pattern} (${section.subsections[0].count || '複数'})`;
    }
  });

  prompt += `\n\n【SEO要件】:
${template.seo_requirements.join('\n')}

【記事作成のルール】:
1. 各セクションは指定された文字数範囲で作成
2. 見出し構造(H1, H2, H3)を正確に守る
3. 読者にとって価値のある具体的な内容
4. 自然で読みやすい文章
5. キーワードを自然に含める
6. マークダウン形式で出力

それでは、この雛形に基づいて完全な記事を作成してください。記事タイトル（# タイトル）から始めて、すべてのセクションを含む完成した記事を出力してください。`;

  return prompt;
}

/**
 * 利用可能なテンプレート一覧を取得
 * @returns {Array} テンプレート情報の配列
 */
function listTemplates() {
  return Object.keys(ArticleTemplates).map(key => ({
    key,
    name: ArticleTemplates[key].name,
    wordCount: ArticleTemplates[key].total_word_count,
    sections: ArticleTemplates[key].structure.length,
    description: `${ArticleTemplates[key].structure.length}セクション構成、${ArticleTemplates[key].total_word_count}文字`
  }));
}

/**
 * 指定されたテンプレートの詳細情報を取得
 * @param {string} templateName - テンプレート名
 * @returns {Object|null} テンプレートの詳細情報
 */
function getTemplate(templateName) {
  return ArticleTemplates[templateName] || null;
}

// モジュールエクスポート
module.exports = {
  ArticleTemplates,
  suggestTemplate,
  generateDetailedPrompt,
  listTemplates,
  getTemplate
};

console.log('📋 テンプレートシステム初期化完了');
console.log(`利用可能テンプレート数: ${Object.keys(ArticleTemplates).length}`);