// functions/lib/blog-tool.js
// WordPress自動投稿システム - メインツール

const axios = require('axios');
const OpenAI = require('openai');

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

  /**
   * GPTで記事を生成
   */
  async generateWithGPT(category, template) {
    const categoryName = this.getCategoryName(category);
    const topics = template.topics || this.getDefaultTopics(category);
    const selectedTopic = topics[Math.floor(Math.random() * topics.length)];
    
    const prompt = `
あなたは${categoryName}専門のプロブロガーです。
以下のトピックについて、SEOに最適化された魅力的なブログ記事を書いてください。

トピック: ${selectedTopic}
カテゴリー: ${categoryName}

要件:
1. タイトル: 30-40文字（キャッチーで検索されやすい）
2. 導入文: 読者の興味を引く150文字程度
3. 本文: 1500-2000文字
4. 見出しを3-4個使用（h2, h3タグ）
5. 読みやすい文体で、専門用語は説明を加える
6. 最新のトレンドや話題を含める

構成:
- 導入（なぜこのトピックが重要か）
- メイン内容（詳細な情報）
- 実例や具体例
- まとめ（読者へのメッセージ）

HTMLタグを使用して出力してください。
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたはSEOとコンテンツマーケティングの専門家です。読者に価値を提供する高品質な記事を作成します。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 3000
      });

      const content = response.choices[0].message.content;
      
      // 記事を構造化
      return this.parseGPTResponse(content, category);
      
    } catch (error) {
      console.error('GPT API エラー:', error);
      // フォールバック
      return this.generateFallbackArticle(category);
    }
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
  // blog-tool.js の以下のメソッドに adult カテゴリを追加

// 1. getDefaultTemplate メソッドに追加（380行目付近）
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
    // 🔞 アダルトカテゴリを追加
    adult: {
      topics: [
        '大人の恋愛心理学',
        'セクシュアルウェルネス入門',
        'カップルのコミュニケーション術',
        '大人向けライフスタイル情報',
        '健全な関係性について',
        'アダルト業界トレンド分析'
      ],
      compliance: {
        ageRestriction: true,
        educationalFocus: true,
        responsibleContent: true
      }
    }
  };
  
  return templates[category] || templates.entertainment;
}

// 2. getCategoryName メソッドに追加（424行目付近）
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
    adult: 'アダルト'  // 🔞 追加
  };
  return names[category] || 'エンターテインメント';
}

// 3. generateTags メソッドに追加（437行目付近）
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
    adult: ['18歳以上', 'アダルト', '大人向け', 'ライフスタイル', '教育的コンテンツ']  // 🔞 追加
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

  /**
   * フォールバック記事
   */
  generateFallbackArticle(category) {
    const categoryName = this.getCategoryName(category);
    const date = new Date().toLocaleDateString('ja-JP');
    
    return {
      title: `【${categoryName}】${date}の注目トピック`,
      content: `
<p>${categoryName}の最新情報をお届けします。</p>

<h2>今日の注目ポイント</h2>
<p>業界の最新動向について、重要なポイントをまとめました。</p>

<h2>詳細情報</h2>
<p>より詳しい情報は、随時更新していきます。</p>

<h2>まとめ</h2>
<p>今後も${categoryName}の最新情報を発信していきます。</p>
`,
      excerpt: `${categoryName}の最新情報をまとめました。`,
      category,
      tags: this.generateTags(category),
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
}

module.exports = BlogAutomationTool;
