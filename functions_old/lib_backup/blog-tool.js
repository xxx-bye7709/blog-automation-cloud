// functions/lib/blog-tool.js
// WordPress自動投稿システム - メインツール
const axios = require('axios');
const OpenAI = require('openai');

// 1. ファイル上部に品質設定を追加
const QUALITY_CONFIG = {
  minLength: 2500,
  maxRetries: 3,
  gptModel: 'gpt-4o-mini',
  temperature: 0.8,
  maxTokens: 4000,
  
  // カテゴリー別の具体的トピック（2024年最新）
  categoryTopics: {
    anime: ['フリーレン', '薬屋のひとりごと', '呪術廻戦3期', 'ダンジョン飯', '推しの子2期'],
    game: ['パルワールド', 'ドラゴンズドグマ2', 'ヘルダイバーズ2', 'FF7リバース', '原神4.5'],
    movie: ['デューン砂の惑星2', 'ゴジラ-1.0', 'オッペンハイマー', '君たちはどう生きるか'],
    music: ['YOASOBI', 'Ado', 'NewJeans', 'King Gnu', '米津玄師'],
    tech: ['Apple Vision Pro', 'Claude 3', 'Sora AI', 'Gemini', 'メタバース'],
    beauty: ['レチノール', 'CICA', '韓国コスメ', 'ヴィーガンコスメ', 'メンズメイク'],
    food: ['台湾カステラ', 'マリトッツォ', 'プロテイン食品', '昆虫食', '代替肉'],
    entertainment: ['紅白歌合戦', 'M-1グランプリ', '芸能スキャンダル', 'YouTube', 'TikTok'],
    selfhelp: ['リスキリング', 'FIRE', 'メンタルヘルス', 'ワークライフバランス', 'AI活用']
  }
};
class BlogAutomationTool {
  constructor() {
    // OpenAI設定
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // WordPress設定
    this.wpUrl = process.env.WP_URL || 'https://www.entamade.jp';
    this.wpUsername = process.env.WP_USERNAME || 'entamade';
    this.wpPassword = process.env.WP_PASSWORD || '8fFf Ys5r dPUp TDPp 8oqg JWQy';
    
    // Base64エンコード認証
    const credentials = Buffer.from(`${this.wpUsername}:${this.wpPassword}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;

    // DMM統合（オプション）
    try {
      const DMMIntegration = require('./dmm-integration');
      this.dmmIntegration = new DMMIntegration();
      this.enableDMM = process.env.ENABLE_DMM === 'true' || false;
    } catch (error) {
      console.log('DMM統合は無効です');
      this.enableDMM = false;
    }

    // 画像生成
    try {
      const ImageGenerator = require('./image-generator');
      this.imageGenerator = new ImageGenerator();
    } catch (error) {
      console.log('画像生成モジュールが見つかりません');
    }

    // テンプレート
    try {
      const templates = require('./templates');
      this.templates = templates;
    } catch (error) {
      console.log('テンプレートモジュールが見つかりません');
    }
  }

  /**
   * 記事生成のメインフロー
   */
  async generateArticle(category = 'entertainment') {
    try {
      console.log(`📝 ${category}カテゴリーの記事を生成中...`);
      
      // テンプレートから記事構造を取得
      const template = this.getTemplate(category);
      
      // GPTで記事生成
      const article = await this.generateWithGPT(category, template);
      
      // DMM商品を挿入（有効な場合）
      if (this.enableDMM && this.dmmIntegration) {
        console.log('🛍️ DMM商品を検索中...');
        try {
          const products = await this.dmmIntegration.searchProducts(category, {
            hits: 3,
            sort: 'rank'
          });
          
          if (products && products.length > 0) {
            console.log(`✅ ${products.length}個の商品を記事に挿入`);
            article.content = this.dmmIntegration.insertProductsIntoArticle(
              article.content,
              products,
              category
            );
          }
        } catch (error) {
          console.error('DMM商品挿入エラー:', error.message);
        }
      }
      
      // 画像生成
      if (this.imageGenerator) {
        try {
          const imagePrompt = this.imageGenerator.generateImagePrompt(
            article.title,
            category
          );
          const imageResult = await this.imageGenerator.generateImage(
            imagePrompt,
            '1792x1024',
            'standard'
          );
          
          if (imageResult.success) {
            article.featuredImage = imageResult.imageUrl;
          }
        } catch (error) {
          console.error('画像生成エラー:', error.message);
        }
      }
      
      return article;
      
    } catch (error) {
      console.error('記事生成エラー:', error);
      throw error;
    }
  }

  // blog-tool.js の generateWithGPT メソッドを以下に改良

async generateWithGPT(category, template) {
  const categoryName = this.getCategoryName(category);
  const topics = template.topics || this.getDefaultTopics(category);
  const selectedTopic = topics[Math.floor(Math.random() * topics.length)];
  
  // 現在の日時情報を取得
  const now = new Date();
  const month = now.getMonth() + 1;
  const season = this.getCurrentSeason(month);
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];
  
  // 季節・時期別のコンテキスト
  const seasonalContext = {
    '冬': {
      anime: '冬アニメの新作情報、年末年始特番、コミケ情報',
      game: '年末商戦、ゲームアワード、福袋情報',
      movie: 'アカデミー賞候補作、年末年始の大作映画',
      music: '紅白歌合戦、年間ランキング、冬フェス'
    },
    '春': {
      anime: '春アニメ新番組、卒業・入学シーズン作品',
      game: '新生活応援セール、春の新作ラッシュ',
      movie: '春休み映画、卒業シーズン作品',
      music: '卒業ソング、春フェス、新人アーティスト'
    },
    '夏': {
      anime: '夏アニメ、夏休み特別編、海・プール回',
      game: '夏休み向けゲーム、e-sports大会',
      movie: '夏の大作映画、ホラー映画',
      music: '夏フェス、花火大会BGM、夏ソング'
    },
    '秋': {
      anime: '秋アニメ、秋の夜長に見たい作品',
      game: '東京ゲームショウ、年末商戦前哨戦',
      movie: '秋の映画祭、芸術作品',
      music: '秋の音楽祭、紅葉シーズンBGM'
    }
  };

  const currentContext = seasonalContext[season]?.[category] || '';

  // 強化版プロンプト：GPTに社会情勢を考慮させる
  const prompt = `
あなたは${categoryName}分野で5年以上の経験を持つプロのWebライターです。
常に最新の社会情勢とトレンドを把握し、タイムリーな記事を作成してください。

【執筆コンテキスト】
- 現在日時: ${now.toLocaleDateString('ja-JP')} (${dayOfWeek}曜日)
- 季節: ${season}
- 季節の注目ポイント: ${currentContext}
- ベーストピック: ${selectedTopic}

【重要指示】
必ず以下の要素を考慮して、現在の社会情勢に合った内容にしてください：
1. 現在進行中の${categoryName}関連の話題やトレンド
2. 今月〜来月に予定されているイベントや発売情報
3. SNSで話題になっている${categoryName}関連の出来事
4. 季節性を考慮した内容（${season}ならではの切り口）
5. 曜日を考慮（${dayOfWeek}曜日に読まれることを想定）

【具体的に言及すべき最新トピック例】
${this.generateDynamicTopicSuggestions(category, month)}

【記事要件】
- 文字数: 2500文字以上
- 時事性: 記事内で「2024年${month}月」の具体的な出来事を3つ以上言及
- トレンド: 「最近話題の」「今月発表された」「来月予定の」など時事性のある表現を使用
- 数値データ: 可能な限り最新の統計や数値（視聴率、売上、ランキング等）を含める
- 予測・展望: 今後の展開や来月以降の注目ポイントも含める

【文体と構成】
<h2>で始まる導入セクション（現在の${categoryName}業界の最新動向から始める）
<h3>を使った3-4個の詳細セクション
<ul>や<li>を使った具体的なデータや事例の列挙
読者への問いかけ（「あなたは〜していますか？」など）を2回以上

【NGワード】
「について」「ご紹介」「いかがでしたか」「今日の注目ポイント」など定型文は使用禁止

【出力形式】
HTMLタグ（<h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>）のみ使用`;

  // リトライロジック追加
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[GPT生成] 試行 ${attempt}/${maxRetries}`);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたは日本の大手Webメディアで働く${categoryName}専門のライターです。SEOとユーザーエンゲージメントを重視した高品質な記事を作成します。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000,  // 3000から増加
        presence_penalty: 0.6,  // 追加：繰り返し防止
        frequency_penalty: 0.4   // 追加：単語の多様性
      });

      const content = response.choices[0].message.content;
      
      // 品質チェック
      if (this.validateGPTContent(content)) {
        console.log(`✅ GPT生成成功: ${content.length}文字`);
        return this.parseGPTResponse(content, category);
      } else {
        console.log('品質チェック失敗、再生成します');
        continue;
      }
      
    } catch (error) {
      lastError = error;
      console.error(`GPT APIエラー (試行 ${attempt}):`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  },

  /**
 * 現在の季節を取得
 */
getCurrentSeason(month) {
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
},

/**
 * 動的なトピック提案を生成
 */
generateDynamicTopicSuggestions(category, month) {
  const suggestions = {
    anime: {
      1: '冬アニメ開始、前期アニメ最終回の反響、年間覇権予想',
      2: 'バレンタイン関連エピソード、冬アニメ中盤の評価',
      3: '春アニメPV解禁、卒業シーズン感動作品',
      4: '春アニメスタート、新生活応援アニメ特集',
      5: 'GW一挙放送情報、春アニメ序盤評価',
      6: '夏アニメ情報解禁、梅雨時期の家アニメ',
      7: '夏アニメスタート、夏休み向け作品',
      8: '夏の特別編、お盆一挙放送',
      9: '秋アニメ情報、夏アニメ終盤',
      10: '秋アニメスタート、ハロウィン特集',
      11: '年末商戦、秋アニメ中盤評価',
      12: '年間ベストアニメ、冬コミケ情報、正月特番'
    },
    game: {
      1: '新年セール、今年期待の新作一覧',
      2: 'バレンタインイベント、決算前セール',
      3: '年度末セール、春の新作情報',
      4: '新生活応援キャンペーン、GW前情報',
      5: 'GWセール、E3情報（6月向け）',
      6: '夏のセール開始、夏休み向け新作',
      7: '夏の大型アップデート、お盆イベント',
      8: '夏休み特別イベント、秋の新作情報',
      9: '東京ゲームショウ、秋の新作ラッシュ',
      10: 'ハロウィンイベント、年末商戦前哨戦',
      11: 'ブラックフライデー、年末商戦本格化',
      12: 'クリスマスセール、年間ランキング、正月福袋'
    },
    movie: {
      1: '正月映画興行成績、アカデミー賞予想',
      2: 'バレンタイン映画特集、ベルリン映画祭',
      3: 'アカデミー賞結果、春休み映画情報',
      4: '春の新作映画、GW大作予告',
      5: 'GW映画興行ランキング、カンヌ映画祭',
      6: '夏映画予告解禁、梅雨時デート映画',
      7: '夏休み映画スタート、ファミリー向け作品',
      8: '夏映画興行成績、お盆特別上映',
      9: 'ヴェネチア映画祭、秋の話題作',
      10: 'ハロウィンホラー映画、東京国際映画祭',
      11: '年末大作情報、冬休み映画予告',
      12: '年間興行収入ランキング、正月映画'
    },
    music: {
      1: '新年音楽番組、今年期待のアーティスト',
      2: 'バレンタインソング特集、グラミー賞',
      3: '卒業ソング特集、春の音楽祭情報',
      4: '春の新曲ラッシュ、新人アーティスト',
      5: 'GWフェス情報、初夏の新曲',
      6: '夏フェス情報解禁、梅雨時プレイリスト',
      7: '夏フェス開催、夏ソング特集',
      8: 'お盆フェス、夏の終わりの名曲',
      9: '秋の音楽祭、上半期ランキング',
      10: 'ハロウィンソング、秋の新曲ラッシュ',
      11: '紅白出場者予想、年間チャート速報',
      12: '年間ランキング確定、紅白歌合戦、クリスマスソング'
    },
    tech: {
      1: 'CES最新情報、今年のテックトレンド予測',
      2: '新型スマホ発表、MWC情報',
      3: '年度末セール、春の新製品',
      4: '新生活ガジェット、Apple新製品噂',
      5: 'Google I/O、Microsoft Build情報',
      6: 'WWDC情報、夏のガジェット',
      7: '夏休み向けガジェット、Prime Day',
      8: '新型iPhone噂、秋の新製品予測',
      9: 'iPhone発表、秋の新製品ラッシュ',
      10: 'Pixel発表、ブラックフライデー準備',
      11: 'ブラックフライデー、年末商戦',
      12: '年間ベストガジェット、来年の技術予測'
    },
    beauty: {
      1: '新年美容目標、冬の乾燥対策',
      2: 'バレンタインメイク、春コスメ予告',
      3: '春の新作コスメ、花粉症対策スキンケア',
      4: '新生活メイク、紫外線対策開始',
      5: 'GW旅行美容、初夏のスキンケア',
      6: '梅雨時スキンケア、夏コスメ新作',
      7: '夏の美白ケア、汗に強いメイク',
      8: '夏ダメージケア、秋コスメ予告',
      9: '秋の新作コスメ、季節の変わり目ケア',
      10: 'ハロウィンメイク、乾燥対策開始',
      11: 'クリスマスコフレ、冬の保湿ケア',
      12: '年間ベストコスメ、年末パーティーメイク'
    },
    food: {
      1: 'おせち料理トレンド、新年グルメ',
      2: 'バレンタインチョコ、恵方巻き商戦',
      3: 'ひな祭りメニュー、春の新メニュー',
      4: '花見弁当、春野菜レシピ',
      5: 'GWグルメ、母の日スイーツ',
      6: '梅雨時の食中毒対策、夏メニュー登場',
      7: '夏バテ対策レシピ、かき氷特集',
      8: 'お盆の帰省グルメ、夏祭り屋台',
      9: '秋の味覚解禁、新米シーズン',
      10: 'ハロウィンスイーツ、秋の収穫祭',
      11: 'ボジョレー解禁、鍋シーズン到来',
      12: 'クリスマスディナー、年越しそば、おせち予約'
    },
    entertainment: {
      1: '新年特番総括、今年の芸能界予測',
      2: 'バレンタイン企画、春ドラマ情報',
      3: '春の改編、新番組スタート',
      4: '春ドラマ評判、GW特番情報',
      5: 'GW視聴率、夏ドラマ予告',
      6: '梅雨時の家エンタメ、夏の特番企画',
      7: '24時間テレビ、夏ドラマ中盤',
      8: 'お盆特番、秋ドラマ情報',
      9: '秋の改編、新番組情報',
      10: 'ハロウィン特番、秋ドラマ評判',
      11: '年末特番情報、紅白司会予想',
      12: '年間視聴率、紅白歌合戦、年末特番'
    },
    selfhelp: {
      1: '新年の目標設定、習慣化のコツ',
      2: '恋愛コミュニケーション、職場の人間関係',
      3: '年度末の振り返り、新年度準備',
      4: '新生活の人間関係構築、ストレス対策',
      5: 'GWの過ごし方、五月病対策',
      6: '梅雨時のメンタルケア、中間目標見直し',
      7: '夏休みの自己投資、リフレッシュ法',
      8: '夏の振り返り、秋からの再スタート',
      9: '秋の学び直し、資格取得準備',
      10: '年末に向けた目標調整、人間関係の整理',
      11: '年末の人間関係、忘年会対策',
      12: '一年の振り返り、来年の目標設定'
    }
  };

  const monthlyTopics = suggestions[category]?.[month] || 
    `今月の${this.getCategoryName(category)}最新情報、話題のトレンド、注目の新作・新情報`;

  return `
- ${monthlyTopics}
- 先週〜今週にSNSでトレンド入りした${this.getCategoryName(category)}関連の話題
- 今月の売上ランキングTOP3とその理由
- 来月の注目リリース・イベント予定
- 前年同月との比較データ（可能な場合）`;
};

  const monthlyTopics = suggestions[category]?.[month] || 
    `今月の${this.getCategoryName(category)}最新情報、話題のトレンド、注目の新作・新情報`;

  // さらに具体的な作品名や数値を含める指示
  return `
- ${monthlyTopics}
- 先週〜今週にSNSでトレンド入りした${this.getCategoryName(category)}関連の話題
- 今月の売上ランキングTOP3とその理由
- 来月の注目リリース・イベント予定
- 前年同月との比較データ（可能な場合）`;
}

  console.error('GPT生成に完全失敗、改善版フォールバックを使用');
  return this.generateEnhancedFallback(category, selectedTopic);
}

  /**
   * GPTレスポンスをパース
   */
  parseGPTResponse(content, category) {
    // タイトルを抽出
    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i) || 
                       content.match(/^#\s+(.+)$/m) ||
                       content.match(/タイトル[：:]\s*(.+)$/m);
    
    const title = titleMatch 
      ? titleMatch[1].replace(/<[^>]*>/g, '').trim()
      : this.generateDefaultTitle(category);

    // 本文を整形
    let bodyContent = content;
    if (titleMatch) {
      bodyContent = content.replace(titleMatch[0], '').trim();
    }

    // 抜粋を生成
    const plainText = bodyContent.replace(/<[^>]*>/g, '');
    const excerpt = plainText.substring(0, 150) + '...';

    return {
      title,
      content: bodyContent,
      excerpt,
      category,
      tags: this.generateTags(category),
      status: 'publish',
      format: 'standard',
      author: 1
    };
  }

  // 170行目の parseGPTResponse メソッドの後に追加

/**
 * GPTコンテンツの品質検証
 */
validateGPTContent(content) {
  // 文字数チェック
  if (content.length < 2000) {
    console.log(`品質NG: 文字数不足 ${content.length}/2000`);
    return false;
  }
  
  // NGワードチェック
  const ngPhrases = [
    '今日の注目ポイント',
    '業界の最新動向について',
    'いかがでしたか',
    'ご紹介しました',
    '詳しく見ていきましょう'
  ];
  
  for (const phrase of ngPhrases) {
    if (content.includes(phrase)) {
      console.log(`品質NG: NGワード検出 "${phrase}"`);
      return false;
    }
  }
  
  // 具体性チェック（数字が含まれているか）
  const numberMatches = content.match(/\d+/g);
  if (!numberMatches || numberMatches.length < 5) {
    console.log(`品質NG: 具体的な数値不足`);
    return false;
  }
  
  return true;
}

  /**
   * WordPressに投稿（正確なPost ID抽出版）
   */
  async postToWordPress(article) {
    try {
      console.log('📤 WordPressに投稿中...');
      
      // XML-RPC用のXMLを作成
      const xmlRequest = this.createWordPressXML(article);
      
      // Axiosで直接リクエスト（認証問題を回避）
      const response = await axios.post(
        `${this.wpUrl}/xmlrpc.php`,
        xmlRequest,
        {
          headers: {
            'Content-Type': 'text/xml',
            'Authorization': this.authHeader
          }
        }
      );

      // 🔍 簡潔なデバッグログ
      console.log('📨 WordPress Response Status:', response.status);
      console.log('📨 WordPress Response (first 300 chars):', response.data.substring(0, 300));

      // レスポンスから投稿IDを抽出（正確なパターン順）
      let postId = null;
      
      if (typeof response.data === 'string') {
        // パターン1: <string>数字</string> - 実際のWordPress形式
        const stringMatch = response.data.match(/<string>(\d+)<\/string>/);
        if (stringMatch) {
          postId = stringMatch[1];
          console.log('✅ String Pattern Match - Post ID:', postId);
        }
        
        // パターン2: <int>数字</int> - 標準的なXML-RPC形式
        if (!postId) {
          const intMatch = response.data.match(/<int>(\d+)<\/int>/);
          if (intMatch) {
            postId = intMatch[1];
            console.log('✅ Int Pattern Match - Post ID:', postId);
          }
        }
        
        // パターン3: <i4>数字</i4> - 32bit integer形式
        if (!postId) {
          const i4Match = response.data.match(/<i4>(\d+)<\/i4>/);
          if (i4Match) {
            postId = i4Match[1];
            console.log('✅ i4 Pattern Match - Post ID:', postId);
          }
        }
        
        // パターン4: <value>数字</value> 
        if (!postId) {
          const valueMatch = response.data.match(/<value>(\d+)<\/value>/);
          if (valueMatch) {
            postId = valueMatch[1];
            console.log('✅ Value Pattern Match - Post ID:', postId);
          }
        }
        
        // エラーチェック
        const faultMatch = response.data.match(/<fault>/);
        if (faultMatch) {
          const errorMatch = response.data.match(/<name>faultString<\/name>\s*<value><string>(.*?)<\/string>/);
          const errorMessage = errorMatch ? errorMatch[1] : 'Unknown WordPress XML-RPC Fault';
          console.error('❌ WordPress Fault:', errorMessage);
          throw new Error(`WordPress Error: ${errorMessage}`);
        }
      }

      if (postId && parseInt(postId) > 0) {
        console.log(`✅ 投稿成功！ Post ID: ${postId}`);
        return {
          success: true,
          postId,
          url: `${this.wpUrl}/?p=${postId}`,
          title: article.title,
          imageUrl: article.featuredImage || null
        };
      } else {
        console.error('❌ 有効な投稿IDが見つかりません');
        console.error('📄 Full Response:', response.data);
        
        throw new Error(`有効な投稿IDを取得できませんでした。Response: ${response.data.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.error('WordPress投稿エラー:', error.message);
      
      if (error.response) {
        console.error('❌ Error Status:', error.response.status);
        console.error('❌ Error Data:', error.response.data);
      }
      
      throw error;
    }
  }
  
  /**
   * WordPress XML-RPC リクエストを作成
   */
  createWordPressXML(article) {
    const { title, content, excerpt, tags, category, status } = article;
    
    // タグを配列形式に変換
    const tagsXML = tags.map(tag => 
      `<value><string>${this.escapeXML(tag)}</string></value>`
    ).join('');

    // カテゴリーを取得
    const categoryName = this.getCategoryName(category);

    return `<?xml version="1.0"?>
<methodCall>
  <methodName>wp.newPost</methodName>
  <params>
    <param><value><int>1</int></value></param>
    <param><value><string>${this.wpUsername}</string></value></param>
    <param><value><string>${this.wpPassword}</string></value></param>
    <param>
      <value>
        <struct>
          <member>
            <name>post_type</name>
            <value><string>post</string></value>
          </member>
          <member>
            <name>post_status</name>
            <value><string>${status}</string></value>
          </member>
          <member>
            <name>post_title</name>
            <value><string>${this.escapeXML(title)}</string></value>
          </member>
          <member>
            <name>post_content</name>
            <value><string>${this.escapeXML(content)}</string></value>
          </member>
          <member>
            <name>post_excerpt</name>
            <value><string>${this.escapeXML(excerpt)}</string></value>
          </member>
          <member>
            <name>terms_names</name>
            <value>
              <struct>
                <member>
                  <name>category</name>
                  <value>
                    <array>
                      <data>
                        <value><string>${this.escapeXML(categoryName)}</string></value>
                      </data>
                    </array>
                  </value>
                </member>
                <member>
                  <name>post_tag</name>
                  <value>
                    <array>
                      <data>${tagsXML}</data>
                    </array>
                  </value>
                </member>
              </struct>
            </value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;
  }

  /**
   * XMLエスケープ
   */
  escapeXML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * テンプレート取得
   */
  getTemplate(category) {
    if (this.templates && this.templates[category]) {
      return this.templates[category];
    }
    return this.getDefaultTemplate(category);
  }

  /**
   * デフォルトテンプレート
   */
  getDefaultTemplate(category) {
    const templates = {
      entertainment: {
        topics: [
          '最新の芸能ニュース',
          '話題のドラマ・バラエティ',
          '注目のタレント・俳優',
          'エンタメ業界の裏話'
        ]
      },
      anime: {
        topics: [
          '今期の注目アニメ',
          '人気声優の最新情報',
          'アニメ映画レビュー',
          '原作とアニメの違い'
        ]
      },
      game: {
        topics: [
          '新作ゲームレビュー',
          'ゲーム攻略情報',
          'eスポーツ最新情報',
          'レトロゲーム特集'
        ]
      },
      movie: {
        topics: [
          '話題の新作映画',
          '映画館での体験',
          '名作映画の解説',
          '映画業界のトレンド'
        ]
      },
      music: {
        topics: [
          '新曲リリース情報',
          'ライブ・コンサート情報',
          'アーティストインタビュー',
          '音楽ストリーミング動向'
        ]
      },
      tech: {
        topics: [
          '最新ガジェットレビュー',
          'AI・テクノロジートレンド',
          'プログラミング入門',
          'デジタルライフハック'
        ]
      },
      beauty: {
        topics: [
          'スキンケア最新情報',
          'メイクアップトレンド',
          '美容成分の解説',
          'セルフケア方法'
        ]
      },
      food: {
        topics: [
          '話題のレストラン',
          '簡単レシピ紹介',
          'グルメトレンド',
          '食材の豆知識'
        ]
      },
      lifestyle: {
        topics: [
          '大人の恋愛心理学',
          '健康的な人間関係の築き方',
          'パートナーとのコミュニケーション術',
          '大人向けライフスタイル情報',
          '現代の恋愛事情',
          '自己啓発と人間関係'
        ]
      },
      selfhelp: {
        topics: [
          'コミュニケーション能力の向上方法',
          '信頼関係を築くコツ',
          '人間関係を良好にする方法',
          '効果的な会話術',
          'チームワークの重要性',
          '自己啓発のための実践法'
        ]
      }
    };
    
    return templates[category] || templates.entertainment;
  }

  /**
   * デフォルトトピック
   */
  getDefaultTopics(category) {
    const template = this.getDefaultTemplate(category);
    return template.topics;
  }

  /**
   * カテゴリー名取得
   */
  getCategoryName(category) {
    const names = {
      entertainment: 'エンターテインメント',
      anime: 'アニメ',
      game: 'ゲーム',
      movie: '映画',
      music: '音楽',
      tech: 'テクノロジー',
      beauty: '美容',
      food: 'グルメ',
      lifestyle: 'ライフスタイル'
    };
    return names[category] || 'エンターテインメント';
  }

generateTags(category) {
  const tagSets = {
    entertainment: ['エンタメ', '芸能', 'ニュース', '話題', '2025'],
    anime: ['アニメ', '声優', '新作', '2025年冬アニメ', 'おすすめ'],
    game: ['ゲーム', '新作', 'レビュー', '攻略', 'PS5'],
    movie: ['映画', '新作', 'レビュー', '興行収入', '2025'],
    music: ['音楽', '新曲', 'ランキング', 'ライブ', 'J-POP'],
    tech: ['テクノロジー', 'IT', 'ガジェット', 'AI', '最新技術'],
    beauty: ['美容', 'コスメ', 'スキンケア', 'メイク', 'トレンド'],
    food: ['グルメ', 'レシピ', 'レストラン', '料理', '食べ歩き'],
    lifestyle: ['大人向け', 'ライフスタイル', '恋愛', '人間関係', '自己啓発', '心理学']
  };
  return tagSets[category] || tagSets.entertainment;
}

  /**
   * デフォルトタイトル生成
   */
  generateDefaultTitle(category) {
    const date = new Date().toLocaleDateString('ja-JP');
    const categoryName = this.getCategoryName(category);
    return `【${date}】${categoryName}の最新情報まとめ`;
  }

 // フォールバック記事も動的に生成
generateEnhancedFallback(category, topic = null) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const season = this.getCurrentSeason(month);
  const categoryName = this.getCategoryName(category);
  
  // 月別・季節別のフォールバックテンプレート
  const seasonalTemplates = {
    anime: {
      '冬': `【${year}年冬アニメ】覇権候補5作品と業界関係者の予測`,
      '春': `【${year}年春アニメ】新生活に見たい感動作品ベスト10`,
      '夏': `【${year}年夏アニメ】猛暑を吹き飛ばす熱血作品特集`,
      '秋': `【${year}年秋アニメ】豊作シーズンの注目作品完全ガイド`
    },
    game: {
      '冬': `【${year}年】年始セールで買うべきゲーム＆福袋情報`,
      '春': `【${year}年春】新生活に始めたいゲーム10選`,
      '夏': `【${year}年夏】夏休みに遊び尽くせる大作ゲーム特集`,
      '秋': `【${year}年秋】年末商戦前の買うべきゲームリスト`
    },
    movie: {
      '冬': `【${year}年】アカデミー賞予想と正月映画興行ランキング`,
      '春': `【${year}年春】春休み必見の話題作10本`,
      '夏': `【${year}年夏】夏休み映画興行収入予測と注目作`,
      '秋': `【${year}年秋】賞レース参戦作品と年末大作情報`
    },
    music: {
      '冬': `【${year}年】紅白の影響と新年音楽シーンの展望`,
      '春': `【${year}年春】卒業ソング＆春の新曲特集`,
      '夏': `【${year}年夏】夏フェス完全ガイドと注目アーティスト`,
      '秋': `【${year}年秋】年間ランキング予測と紅白出場者予想`
    },
    tech: {
      '冬': `【${year}年】CES発表まとめと今年のテックトレンド`,
      '春': `【${year}年春】新生活に買うべきガジェット10選`,
      '夏': `【${year}年夏】Prime Dayと夏のガジェット商戦`,
      '秋': `【${year}年秋】iPhone新作と年末商戦ガジェット`
    },
    beauty: {
      '冬': `【${year}年冬】乾燥対策とクリスマスコフレ総まとめ`,
      '春': `【${year}年春】春の新作コスメと花粉症対策`,
      '夏': `【${year}年夏】美白ケアと汗に強いメイク術`,
      '秋': `【${year}年秋】秋の新作コスメと乾燥対策準備`
    },
    food: {
      '冬': `【${year}年冬】おせちトレンドと冬の温活グルメ`,
      '春': `【${year}年春】花見弁当と春野菜レシピ特集`,
      '夏': `【${year}年夏】夏バテ対策レシピとかき氷トレンド`,
      '秋': `【${year}年秋】秋の味覚と新米食べ比べガイド`
    },
    entertainment: {
      '冬': `【${year}年】年末特番総括と新年の芸能界展望`,
      '春': `【${year}年春】春ドラマ期待度ランキング`,
      '夏': `【${year}年夏】24時間テレビと夏の特番情報`,
      '秋': `【${year}年秋】秋の改編と年末特番への期待`
    },
    selfhelp: {
      '冬': `【${year}年】新年の目標設定と習慣化の科学`,
      '春': `【${year}年春】新生活の人間関係構築術`,
      '夏': `【${year}年夏】夏休みを使った自己投資法`,
      '秋': `【${year}年秋】年末に向けた目標達成戦略`
    }
  };

  const title = seasonalTemplates[category]?.[season] || 
    `【${year}年${month}月最新】${categoryName}業界の衝撃ニュースと今後の展望`;

  // 内容も動的に生成（既存のコンテンツ生成ロジックを使用）
  const content = this.generateSeasonalContent(category, season, month, year);
  
  return {
    title,
    content,
    excerpt: `${year}年${month}月の${categoryName}最新トレンドを徹底分析。`,
    category,
    tags: [...this.generateTags(category), `${year}年${month}月`, season],
    status: 'publish'
  };
};

  const title = seasonalTemplates[category]?.[season] || 
    `【${year}年${month}月最新】${categoryName}業界の衝撃ニュースと今後の展望`;

  // 内容も月や季節に応じて動的に変更
  const content = this.generateSeasonalContent(category, season, month, year);
  
  return {
    title,
    content,
    excerpt: `${year}年${month}月の${categoryName}最新トレンドを徹底分析。`,
    category,
    tags: [...this.generateTags(category), `${year}年${month}月`, season],
    status: 'publish'
  };
}

  /**
   * 記事のバリデーション
   */
  validateArticle(article) {
    if (!article.title || article.title.length < 10) {
      throw new Error('タイトルが短すぎます');
    }
    if (!article.content || article.content.length < 100) {
      throw new Error('コンテンツが短すぎます');
    }
    return true;
  }

  /**
   * テンプレート取得
   */
  getTemplate(category) {
    if (this.templates && this.templates[category]) {
      return this.templates[category];
    }
    return this.getDefaultTemplate(category);
  }

  /**
   * デフォルトテンプレート
   */
  getDefaultTemplate(category) {
    const templates = {
      entertainment: {
        topics: [
          '最新の芸能ニュース',
          '話題のドラマ・バラエティ',
          '注目のタレント・俳優',
          'エンタメ業界の裏話'
        ]
      },
      anime: {
        topics: [
          '今期の注目アニメ',
          '人気声優の最新情報',
          'アニメ映画レビュー',
          '原作とアニメの違い'
        ]
      },
      game: {
        topics: [
          '新作ゲームレビュー',
          'ゲーム攻略情報',
          'eスポーツ最新情報',
          'レトロゲーム特集'
        ]
      },
      movie: {
        topics: [
          '話題の新作映画',
          '映画館での体験',
          '名作映画の解説',
          '映画業界のトレンド'
        ]
      },
      music: {
        topics: [
          '新曲リリース情報',
          'ライブ・コンサート情報',
          'アーティストインタビュー',
          '音楽ストリーミング動向'
        ]
      },
      tech: {
        topics: [
          '最新ガジェットレビュー',
          'AI・テクノロジートレンド',
          'プログラミング入門',
          'デジタルライフハック'
        ]
      },
      beauty: {
        topics: [
          'スキンケア最新情報',
          'メイクアップトレンド',
          '美容成分の解説',
          'セルフケア方法'
        ]
      },
      food: {
        topics: [
          '話題のレストラン',
          '簡単レシピ紹介',
          'グルメトレンド',
          '食材の豆知識'
        ]
      },
      lifestyle: {
        topics: [
          '大人の恋愛心理学',
          '健康的な人間関係の築き方',
          'パートナーとのコミュニケーション術',
          '大人向けライフスタイル情報',
          '現代の恋愛事情',
          '自己啓発と人間関係'
        ]
      }
    };
    
    return templates[category] || templates.entertainment;
  }

  /**
   * デフォルトトピック
   */
  getDefaultTopics(category) {
    const template = this.getDefaultTemplate(category);
    return template.topics;
  }

  /**
   * カテゴリー名取得
   */
  getCategoryName(category) {
    const names = {
      entertainment: 'エンターテインメント',
      anime: 'アニメ',
      game: 'ゲーム',
      movie: '映画',
      music: '音楽',
      tech: 'テクノロジー',
      beauty: '美容',
      food: 'グルメ',
      lifestyle: 'ライフスタイル',
      selfhelp: '自己啓発'
    };
    return names[category] || 'エンターテインメント';
  }

  /**
   * タグ生成
   */
  generateTags(category) {
    const tagSets = {
      entertainment: ['エンタメ', '芸能', 'ニュース', '話題', '2025'],
      anime: ['アニメ', '声優', '新作', '2025年冬アニメ', 'おすすめ'],
      game: ['ゲーム', '新作', 'レビュー', '攻略', 'PS5'],
      movie: ['映画', '新作', 'レビュー', '興行収入', '2025'],
      music: ['音楽', '新曲', 'ランキング', 'ライブ', 'J-POP'],
      tech: ['テクノロジー', 'IT', 'ガジェット', 'AI', '最新技術'],
      beauty: ['美容', 'コスメ', 'スキンケア', 'メイク', 'トレンド'],
      food: ['グルメ', 'レシピ', 'レストラン', '料理', '食べ歩き'],
      lifestyle: ['大人向け', 'ライフスタイル', '恋愛', '人間関係', '自己啓発', '心理学'],
      selfhelp: ['自己啓発', '人間関係', 'コミュニケーション', '心理学', '成長', '実践ガイド']
    };
    return tagSets[category] || tagSets.entertainment;
  }

  /**
   * デフォルトタイトル生成
   */
  generateDefaultTitle(category) {
    const date = new Date().toLocaleDateString('ja-JP');
    const categoryName = this.getCategoryName(category);
    return `【${date}】${categoryName}の最新情報まとめ`;
  }
}

module.exports = BlogAutomationTool;
