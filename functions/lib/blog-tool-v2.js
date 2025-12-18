// functions/lib/blog-tool-v2.js
const { OpenAI } = require('openai');
const xmlrpc = require('xmlrpc');
const { addOpenChatCTAToArticle } = require('./openchat-cta-generator');
const { getInstance: getConfigManager } = require('./config-manager');

class BlogToolV2 {
  constructor(siteId = null) {
    // ConfigManagerから設定を取得
    this.configManager = getConfigManager();
    this.config = this.configManager.loadConfig();
    
    // ライセンスチェック
    if (!this.configManager.licenseStatus?.valid) {
      throw new Error('ライセンスが無効です');
    }
    
    // サイト設定を取得
    this.siteConfig = this.configManager.getWordPressSite(siteId);
    if (!this.siteConfig) {
      throw new Error('WordPressサイトが設定されていません');
    }
    
    // WordPress設定
    this.wordpressUrl = `${this.siteConfig.url}/xmlrpc.php`;
    this.wordpressUser = this.siteConfig.username;
    this.wordpressPassword = this.siteConfig.password;
    this.siteName = this.siteConfig.name;
    this.siteUrl = this.siteConfig.url;
    this.siteId = this.siteConfig.id;
    
    // OpenAI設定
    const openaiConfig = this.configManager.getOpenAIConfig();
    if (!openaiConfig.apiKey) {
      throw new Error('OpenAI APIキーが設定されていません');
    }
    
    this.openai = new OpenAI({
      apiKey: openaiConfig.apiKey
    });
    this.aiModel = openaiConfig.model;
    
    // DMM API設定
    const dmmConfig = this.configManager.getDMMConfig();
    this.dmmEnabled = dmmConfig.enabled;
    this.dmmApiKey = dmmConfig.apiId;
    this.dmmAffiliateId = dmmConfig.affiliateId;
    
    // XML-RPCクライアントの初期化
    this.initXmlRpcClient();
    
    console.log('✅ BlogToolV2 初期化完了');
    console.log(`📍 サイト: ${this.siteName} (${this.siteUrl})`);
    console.log(`🔑 ライセンス: ${this.configManager.licenseStatus.type}版`);
    console.log(`✨ 機能制限:`);
    console.log(`  - 最大サイト数: ${this.configManager.licenseStatus.features.maxSites}`);
    console.log(`  - 1日の最大記事数: ${this.configManager.licenseStatus.features.maxArticlesPerDay}`);
  }

  /**
   * XML-RPCクライアントの初期化
   */
  initXmlRpcClient() {
    const url = new URL(this.wordpressUrl);
    const options = {
      host: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname
    };

    if (url.protocol === 'https:') {
      this.xmlrpcClient = xmlrpc.createSecureClient(options);
    } else {
      this.xmlrpcClient = xmlrpc.createClient(options);
    }
  }

  /**
   * 記事生成（制限チェック付き）
   */
  async generateArticle(category, options = {}) {
    // 記事生成制限のチェック
    const limitCheck = await this.configManager.checkArticleLimit();
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.message);
    }

    console.log(`📝 記事生成開始 (残り${limitCheck.remaining}記事/日)`);

    // 画像生成機能のチェック
    const hasImageGeneration = this.configManager.hasFeature('hasImageGeneration');
    if (!hasImageGeneration && options.generateImage) {
      console.log('⚠️ 画像生成機能は利用できません（ライセンス制限）');
      options.generateImage = false;
    }

    try {
      const keyword = options.keyword || this.getDefaultKeyword(category);
      
      // プロンプトの作成
      const prompt = this.createPrompt(category, keyword, options);
      
      // OpenAI APIで記事生成
      const completion = await this.openai.chat.completions.create({
        model: this.aiModel,
        messages: [
          {
            role: 'system',
            content: 'あなたはプロのブログライターです。SEO最適化された魅力的な記事を作成します。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.7
      });

      const content = completion.choices[0].message.content;
      
      // OpenChat CTAを追加
      const contentWithCTA = addOpenChatCTAToArticle(content);
      
      // 記事データを構築
      const article = {
        title: this.extractTitle(content) || `${keyword}の最新情報`,
        content: contentWithCTA,
        category: category,
        tags: this.generateTags(keyword, category),
        status: options.status || 'publish',
        siteId: this.siteId,
        siteName: this.siteName
      };

      // 記事生成履歴を保存（実装は簡略化）
      await this.saveArticleHistory(article);

      return article;

    } catch (error) {
      console.error('❌ 記事生成エラー:', error);
      throw error;
    }
  }

  /**
   * 商品レビュー記事生成（DMM API対応）
   */
  async generateProductReview(products, keyword, options = {}) {
    // DMM API機能のチェック
    if (!this.dmmEnabled && options.useDmmApi) {
      console.log('⚠️ DMM API機能は利用できません');
      options.useDmmApi = false;
    }

    // 記事生成制限のチェック
    const limitCheck = await this.configManager.checkArticleLimit();
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.message);
    }

    console.log(`🛍️ 商品レビュー記事生成開始`);

    try {
      const productList = Array.isArray(products) ? products : [products];
      
      // 商品情報を含むプロンプトを作成
      const prompt = this.createProductReviewPrompt(productList, keyword);
      
      // OpenAI APIで記事生成
      const completion = await this.openai.chat.completions.create({
        model: this.aiModel,
        messages: [
          {
            role: 'system',
            content: 'あなたはアフィリエイトマーケティングのエキスパートです。購買意欲を高める魅力的なレビュー記事を作成します。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      });

      const content = completion.choices[0].message.content;
      
      // 商品セクションHTMLを追加
      const productsSectionHTML = this.createProductsSectionHTML(productList);
      const fullContent = content + '\n\n' + productsSectionHTML;
      
      // OpenChat CTAを追加
      const contentWithCTA = addOpenChatCTAToArticle(fullContent);
      
      const article = {
        title: `【${keyword}】おすすめ商品${productList.length}選`,
        content: contentWithCTA,
        category: 'レビュー',
        tags: [keyword, 'レビュー', 'おすすめ', '2025年'],
        status: options.status || 'publish',
        isProductReview: true,
        products: productList
      };

      await this.saveArticleHistory(article);
      return article;

    } catch (error) {
      console.error('❌ 商品レビュー生成エラー:', error);
      throw error;
    }
  }

  /**
   * WordPressへの投稿
   */
  async postToWordPress(article) {
    console.log('📤 WordPress投稿開始...');
    
    return new Promise((resolve, reject) => {
      const postData = {
        post_type: 'post',
        post_status: article.status || 'publish',
        post_title: article.title,
        post_content: article.content,
        post_author: 1,
        comment_status: 'open',
        ping_status: 'open',
        sticky: false,
        terms_names: {
          post_tag: article.tags || [],
          category: [article.category || 'その他']
        }
      };

      // カテゴリIDがある場合は使用
      if (this.siteConfig.categories && this.siteConfig.categories[article.category]) {
        postData.terms = {
          category: [this.siteConfig.categories[article.category]]
        };
      }

      this.xmlrpcClient.methodCall(
        'wp.newPost',
        [
          this.blogId || 1,
          this.wordpressUser,
          this.wordpressPassword,
          postData
        ],
        (error, postId) => {
          if (error) {
            console.error('❌ WordPress投稿エラー:', error);
            reject(error);
          } else {
            const postUrl = `${this.siteUrl}/?p=${postId}`;
            console.log('✅ 投稿成功!');
            console.log(`📍 記事ID: ${postId}`);
            console.log(`🔗 URL: ${postUrl}`);
            
            resolve({
              success: true,
              postId: postId,
              url: postUrl,
              title: article.title,
              siteId: this.siteId,
              siteName: this.siteName
            });
          }
        }
      );
    });
  }

  /**
   * ヘルパーメソッド群
   */
  
  getDefaultKeyword(category) {
    const keywords = {
      'entertainment': 'エンタメ最新',
      'anime': 'アニメ新作',
      'game': 'ゲーム攻略',
      'movie': '映画レビュー',
      'music': '音楽ランキング',
      'tech': 'IT最新技術',
      'beauty': '美容トレンド',
      'food': 'グルメ情報'
    };
    return keywords[category] || category;
  }

  createPrompt(category, keyword, options) {
    return `
${keyword}に関する魅力的なブログ記事を作成してください。

要件：
1. 文字数: 2000文字以上
2. SEO最適化されたタイトル
3. 読みやすい構成（見出しを使用）
4. 最新の情報を含む
5. HTML形式で出力

カテゴリ: ${category}
${options.tone ? `トーン: ${options.tone}` : ''}
`;
  }

  createProductReviewPrompt(products, keyword) {
    const productInfo = products.map((p, i) => `
商品${i + 1}:
- 商品名: ${p.title || ''}
- 価格: ${p.price || ''}
- 説明: ${p.description || ''}
`).join('\n');

    return `
以下の商品についてのレビュー記事を作成してください。

${productInfo}

要件：
1. 購買意欲を高める内容
2. 各商品の特徴を詳しく説明
3. 比較表を含む
4. HTML形式で出力
5. キーワード「${keyword}」を自然に含める
`;
  }

  createProductsSectionHTML(products) {
    return `
<h2>紹介商品詳細</h2>
<div class="products-gallery">
${products.map((product, index) => `
  <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    <h3>【商品${index + 1}】${product.title || ''}</h3>
    ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.title}" style="max-width: 100%;">` : ''}
    <p>価格: ${product.price || '価格不明'}</p>
    ${product.description ? `<p>${product.description}</p>` : ''}
    <a href="${product.affiliateUrl || '#'}" target="_blank" style="display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">詳細を見る</a>
  </div>
`).join('')}
</div>
`;
  }

  extractTitle(content) {
    const match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return match ? match[1].replace(/<[^>]*>/g, '') : null;
  }

  generateTags(keyword, category) {
    const tags = [keyword, category, '2025年', 'おすすめ'];
    return tags.filter(tag => tag && tag.length > 0);
  }

  async saveArticleHistory(article) {
    // 実際にはFirestoreやローカルDBに保存
    console.log(`📝 記事履歴を保存: ${article.title}`);
  }
}

module.exports = BlogToolV2;
