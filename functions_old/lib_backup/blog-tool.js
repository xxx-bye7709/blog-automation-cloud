/**
 * クラウドブログツール - Firebase Functions版
 * AIを活用した記事自動生成・投稿システム
 */

// dotenv設定を先頭で読み込み
require('dotenv').config();

const functions = require('firebase-functions');
const axios = require('axios');
const { suggestTemplate, generateDetailedPrompt } = require('./templates');

class CloudBlogTool {
  constructor() {
    console.log('🤖 CloudBlogTool 初期化中...');

    // 環境変数から設定を取得（新方式）
    this.config = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini', // コスト効率の良いモデル
        maxTokens: 4000
      },
      wordpress: {
        baseUrl: process.env.WORDPRESS_BASE_URL,
        username: process.env.WORDPRESS_USERNAME,
        password: process.env.WORDPRESS_PASSWORD
      },
      dmm: {
        apiId: '65HMBVSGX4VpAKwfHxtg', // 固定APIキー
        affiliateId: process.env.DMM_AFFILIATE_ID
      }
    };

    // 設定検証
    this.validateConfig();
  }

  /**
   * 設定の妥当性をチェック
   */
  validateConfig() {
    const required = [
      { key: 'openai.api_key', value: this.config.openai.apiKey },
      { key: 'wordpress.base_url', value: this.config.wordpress.baseUrl },
      { key: 'wordpress.username', value: this.config.wordpress.username },
      { key: 'wordpress.password', value: this.config.wordpress.password }
    ];

    const missing = required.filter(item => !item.value);
    
    if (missing.length > 0) {
      const missingKeys = missing.map(item => item.key).join(', ');
      console.error(`❌ 設定不備: ${missingKeys} が設定されていません`);
      console.error('Firebase Console > Functions > 設定で環境変数を確認してください');
      throw new Error(`必要な設定が不足しています: ${missingKeys}`);
    }

    console.log('✅ 設定検証完了');
  }

  /**
   * OpenAI APIで記事コンテンツを生成
   * @param {string} prompt - 生成プロンプト
   * @returns {Promise<string>} 生成された記事コンテンツ
   */
  async generateContent(prompt) {
    try {
      console.log('🔄 OpenAI API呼び出し中...');
      console.log(`使用モデル: ${this.config.openai.model}`);
      
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: this.config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'あなたは経験豊富なプロのブログライターです。SEOを意識し、読者に価値を提供する高品質な記事を書くことが得意です。自然で人間らしい文章を心がけ、専門的すぎず親しみやすい内容を作成してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.openai.maxTokens,
        temperature: 0.8, // 創造性とバランス
        presence_penalty: 0.6, // 新しい話題への言及を促進
        frequency_penalty: 0.3, // 繰り返しを適度に避ける
        top_p: 1.0,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.openai.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60秒タイムアウト
      });

      const generatedContent = response.data.choices[0].message.content;
      const tokensUsed = response.data.usage.total_tokens;
      
      console.log(`✅ 記事生成完了 (${tokensUsed} tokens使用)`);
      console.log(`生成文字数: ${generatedContent.length}文字`);
      
      return generatedContent;

    } catch (error) {
      console.error('❌ OpenAI API エラー:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('OpenAI API認証エラー: APIキーを確認してください');
      } else if (error.response?.status === 429) {
        throw new Error('OpenAI APIレート制限エラー: しばらく時間をおいて再試行してください');
      } else if (error.response?.status === 402) {
        throw new Error('OpenAI APIクレジット不足: アカウントの残高を確認してください');
      } else {
        throw new Error(`記事生成エラー: ${error.message}`);
      }
    }
  }

  /**
   * 雛形ベース記事生成
   * @param {string} theme - 記事テーマ
   * @param {string} keywords - カンマ区切りキーワード  
   * @param {string|null} templateName - テンプレート名（nullで自動選択）
   * @returns {Promise<Object>} 生成された記事データ
   */
  async generateArticleWithTemplate(theme, keywords, templateName = null) {
    try {
      console.log(`🚀 記事生成開始`);
      console.log(`テーマ: ${theme}`);
      console.log(`キーワード: ${keywords}`);
      
      // テンプレート選択（自動 or 手動）
      if (!templateName) {
        templateName = suggestTemplate(theme, keywords);
        console.log(`🤖 自動選択テンプレート: ${templateName}`);
      } else {
        console.log(`👤 指定テンプレート: ${templateName}`);
      }

      // 詳細プロンプト生成
      const prompt = generateDetailedPrompt(templateName, theme, keywords);
      if (!prompt) {
        throw new Error(`テンプレート "${templateName}" が見つかりません`);
      }

      console.log('📝 プロンプト生成完了');

      // OpenAIで記事生成
      const articleContent = await this.generateContent(prompt);

      // 記事タイトル抽出
      const title = this.extractTitleFromContent(articleContent) || theme;
      
      // 文字数計算
      const wordCount = this.estimateWordCount(articleContent);

      console.log(`✅ 記事生成完了: "${title}" (${wordCount}文字)`);
      
      return {
        content: articleContent,
        template: templateName,
        wordCount: wordCount,
        title: title,
        originalTheme: theme,
        keywords: keywords
      };

    } catch (error) {
      console.error('❌ 記事生成エラー:', error);
      throw error;
    }
  }

  /**
   * DMM API から関連商品を取得
   * @param {string} keyword - 検索キーワード
   * @param {number} limit - 取得件数
   * @returns {Promise<Array>} 商品データ配列
   */
  async getDMMProducts(keyword, limit = 3) {
    try {
      console.log(`🛍️ DMM商品検索: "${keyword}" (最大${limit}件)`);

      if (!this.config.dmm.affiliateId) {
        console.warn('⚠️ DMMアフィリエイトIDが設定されていません。商品取得をスキップします。');
        return [];
      }

      const response = await axios.get('https://api.dmm.com/affiliate/v3/ItemList', {
        params: {
          api_id: this.config.dmm.apiId,
          affiliate_id: this.config.dmm.affiliateId,
          site: 'FANZA',
          service: 'digital',
          floor: 'videoa',
          hits: limit,
          keyword: keyword,
          sort: 'rank', // 人気順
          output: 'json'
        },
        timeout: 10000
      });

      const items = response.data.result?.items || [];
      console.log(`✅ DMM商品取得完了: ${items.length}件`);
      
      return items;

    } catch (error) {
      console.error('❌ DMM API エラー:', error.response?.data || error.message);
      console.warn('商品取得に失敗しましたが、記事生成を続行します');
      return [];
    }
  }

  /**
   * 商品データから広告コンテンツを生成
   * @param {Array} products - 商品データ配列
   * @param {boolean} isAdult - アダルトコンテンツかどうか
   * @returns {string} 広告HTML/マークダウン
   */
  generateAdContent(products, isAdult = false) {
    if (!products.length) {
      console.log('📝 商品データなし - 広告コンテンツをスキップ');
      return '';
    }

    console.log(`📝 広告コンテンツ生成: ${products.length}商品 (アダルト: ${isAdult})`);

    let adContent = isAdult ? 
      '\n## どこで買える？（PRリンク）\n\n' : 
      '\n## おすすめ商品\n\n';
    
    products.forEach((product, index) => {
      const title = product.title || `商品${index + 1}`;
      const description = product.comment || '高品質でおすすめの人気商品です。';
      const imageUrl = product.imageURL?.large || product.imageURL?.small;
      const affiliateUrl = product.affiliateURL;

      adContent += `### ${index + 1}. ${title}\n\n`;
      
      if (imageUrl) {
        adContent += `![${title}](${imageUrl})\n\n`;
      }
      
      adContent += `${description}\n\n`;
      
      if (affiliateUrl) {
        const linkText = isAdult ? `${title}の詳細・購入はこちら` : '詳細を見る';
        adContent += `👉 [${linkText}](${affiliateUrl})\n\n`;
      }
      
      adContent += '---\n\n';
    });

    if (isAdult) {
      adContent += '\n※この記事にはアフィリエイトリンクが含まれます。\n\n';
    }

    return adContent;
  }

  /**
   * WordPressに記事を投稿
   * @param {string} title - 記事タイトル
   * @param {string} content - 記事本文
   * @param {number} category - カテゴリID
   * @param {Array} tags - タグ配列
   * @param {string|null} scheduledDate - 予約投稿日時
   * @returns {Promise<Object>} WordPressレスポンス
   */
  async publishToWordPress(title, content, category = 1, tags = [], scheduledDate = null) {
    try {
      console.log('📤 WordPress投稿準備中...');
      console.log(`タイトル: ${title}`);
      console.log(`カテゴリ: ${category}, タグ: [${tags.join(', ')}]`);

      // 認証ヘッダー生成
      const auth = Buffer.from(
        `${this.config.wordpress.username}:${this.config.wordpress.password}`
      ).toString('base64');
      
      // マークダウンをHTMLに変換
      const htmlContent = this.convertMarkdownToHtml(content);
      
      // 投稿データ準備
      const postData = {
        title: title,
        content: htmlContent,
        status: scheduledDate ? 'future' : 'publish',
        categories: [category],
        tags: tags,
        excerpt: this.generateExcerpt(content),
        format: 'standard'
      };

      // 予約投稿の場合は日時設定
      if (scheduledDate) {
        postData.date = scheduledDate;
        console.log(`📅 予約投稿設定: ${scheduledDate}`);
      }

      console.log('🌐 WordPress API呼び出し中...');

      // WordPress REST API に投稿
      const response = await axios.post(
        `${this.config.wordpress.baseUrl}/wp-json/wp/v2/posts`,
        postData,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const result = response.data;
      console.log('✅ WordPress投稿完了!');
      console.log(`投稿ID: ${result.id}`);
      console.log(`投稿URL: ${result.link}`);
      
      return result;

    } catch (error) {
      console.error('❌ WordPress投稿エラー:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('WordPress認証エラー: ユーザー名・パスワードを確認してください');
      } else if (error.response?.status === 403) {
        throw new Error('WordPress権限エラー: 投稿権限を確認してください');
      } else if (error.response?.status === 404) {
        throw new Error('WordPress URLエラー: サイトURLを確認してください');
      } else {
        throw new Error(`WordPress投稿エラー: ${error.message}`);
      }
    }
  }

  /**
   * マークダウンをHTMLに変換
   * @param {string} content - マークダウンコンテンツ
   * @returns {string} HTMLコンテンツ
   */
  convertMarkdownToHtml(content) {
    console.log('🔄 マークダウン → HTML変換中...');
    
    let html = content
      // 見出し変換
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      
      // テキスト装飾
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // リンク変換
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      
      // 画像変換
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
      
      // リスト変換（簡易版）
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      
      // 段落変換
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<h[1-6]|<ul|<li|<img|<a)(.+)$/gm, '<p>$1</p>')
      
      // クリーンアップ
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[1-6])/g, '$1')
      .replace(/(<\/h[1-6]>)<\/p>/g, '$1');

    console.log('✅ HTML変換完了');
    return html;
  }

  /**
   * 記事の抜粋を自動生成
   * @param {string} content - 記事コンテンツ
   * @param {number} maxLength - 最大文字数
   * @returns {string} 抜粋テキスト
   */
  generateExcerpt(content, maxLength = 160) {
    // HTMLタグとマークダウン記法を除去
    const textOnly = content
      .replace(/<[^>]*>/g, '') // HTMLタグ除去
      .replace(/[#*\-\[\]()]/g, '') // マークダウン記法除去
      .replace(/\n/g, ' ') // 改行をスペースに
      .replace(/\s+/g, ' ') // 連続スペースを1つに
      .trim();

    return textOnly.length > maxLength ? 
      textOnly.substring(0, maxLength) + '...' : 
      textOnly;
  }

  /**
   * コンテンツから記事タイトルを抽出
   * @param {string} content - 記事コンテンツ
   * @returns {string|null} 抽出されたタイトル
   */
  extractTitleFromContent(content) {
    // マークダウンのH1タイトルを探す
    const titleMatch = content.match(/^# (.+)$/m);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  /**
   * 日本語文字数を推定
   * @param {string} text - テキスト
   * @returns {number} 推定文字数
   */
  estimateWordCount(text) {
    // マークダウン記法やHTMLタグを除去して文字数カウント
    const cleanText = text
      .replace(/<[^>]*>/g, '') // HTMLタグ除去
      .replace(/[#*\-\[\]()]/g, '') // マークダウン記法除去
      .replace(/\s+/g, ''); // 空白除去
    
    return cleanText.length;
  }

  /**
   * メイン記事作成・投稿メソッド
   * @param {string} theme - 記事テーマ
   * @param {string} keywords - キーワード
   * @param {string|null} templateName - テンプレート名
   * @param {number} category - カテゴリID
   * @param {Array} tags - タグ配列
   * @param {string|null} scheduledDate - 予約投稿日時
   * @returns {Promise<Object>} 投稿結果
   */
  async createAndPublishArticle(theme, keywords, templateName = null, category = 1, tags = [], scheduledDate = null) {
    const startTime = Date.now();
    
    try {
      console.log('🚀 記事作成・投稿プロセス開始');
      console.log(`開始時刻: ${new Date().toISOString()}`);
      
      // 1. 記事生成
      const articleData = await this.generateArticleWithTemplate(theme, keywords, templateName);
      
      // 2. 関連商品取得（キーワードから）
      const searchKeyword = keywords.split(',')[0].trim();
      const products = await this.getDMMProducts(searchKeyword);
      
      // 3. 広告コンテンツ生成
      const isAdult = articleData.template === 'adult_review';
      const adContent = this.generateAdContent(products, isAdult);
      
      // 4. 最終記事コンテンツ
      const finalContent = articleData.content + adContent;
      const finalWordCount = this.estimateWordCount(finalContent);
      
      console.log(`📊 最終記事統計: ${finalWordCount}文字, ${products.length}商品`);
      
      // 5. WordPress投稿
      const wpResult = await this.publishToWordPress(
        articleData.title,
        finalContent,
        category,
        tags,
        scheduledDate
      );
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`✅ 全プロセス完了 (${duration.toFixed(1)}秒)`);
      
      return {
        success: true,
        postId: wpResult.id,
        url: wpResult.link,
        title: articleData.title,
        template: articleData.template,
        wordCount: finalWordCount,
        productsCount: products.length,
        duration: duration,
        scheduledDate: scheduledDate,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.error(`❌ 記事作成・投稿エラー (${duration.toFixed(1)}秒):`, error.message);
      
      return {
        success: false,
        error: error.message,
        duration: duration,
        timestamp: new Date().toISOString(),
        theme: theme,
        keywords: keywords
      };
    }
  }

  /**
   * システム情報取得
   * @returns {Object} システム情報
   */
  getSystemInfo() {
    return {
      version: '1.0.0',
      environment: 'Firebase Functions',
      region: 'asia-northeast1',
      runtime: `Node.js ${process.version}`,
      timestamp: new Date().toISOString(),
      config: {
        openai_model: this.config.openai.model,
        wordpress_url: this.config.wordpress.baseUrl,
        dmm_enabled: !!this.config.dmm.affiliateId
      }
    };
  }
  // functions/lib/blog-tool.jsのクラス内に以下のメソッドを追加してください

    /**
     * WordPress接続テスト
     * @returns {Object} 接続テスト結果
     */
    async testWordPressConnection() {
        try {
            const wpUrl = process.env.WP_URL;
            const wpUsername = process.env.WP_USERNAME;
            const wpPassword = process.env.WP_PASSWORD;
            
            if (!wpUrl || !wpUsername || !wpPassword) {
                throw new Error('WordPress環境変数が設定されていません (WP_URL, WP_USERNAME, WP_PASSWORD)');
            }
            
            console.log('🔗 WordPress接続テスト開始:', wpUrl);
            
            // WordPress REST API エンドポイントをテスト
            const response = await fetch(`${wpUrl}/wp-json/wp/v2/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`WordPress認証失敗 (${response.status}): ${errorText}`);
            }
            
            const userData = await response.json();
            
            // サイト情報も取得
            const siteResponse = await fetch(`${wpUrl}/wp-json/wp/v2/`, {
                method: 'GET'
            });
            
            let siteInfo = {};
            if (siteResponse.ok) {
                siteInfo = await siteResponse.json();
            }
            
            console.log('✅ WordPress接続成功:', userData.name);
            
            return {
                success: true,
                siteUrl: wpUrl,
                version: siteInfo.namespaces?.includes('wp/v2') ? 'REST API v2対応' : '不明',
                user: userData.name,
                userRoles: userData.roles,
                message: 'WordPress接続正常'
            };
            
        } catch (error) {
            console.error('❌ WordPress接続エラー:', error);
            return {
                success: false,
                siteUrl: process.env.WP_URL || '未設定',
                version: '不明',
                user: '認証失敗',
                message: error.message
            };
        }
    }
    
    /**
     * 記事をWordPressに投稿
     * @param {Object} article - 投稿する記事データ
     * @returns {Object} 投稿結果
     */
    async publishToWordPress(article) {
        try {
            const wpUrl = process.env.WP_URL;
            const wpUsername = process.env.WP_USERNAME;
            const wpPassword = process.env.WP_PASSWORD;
            
            if (!wpUrl || !wpUsername || !wpPassword) {
                throw new Error('WordPress環境変数が設定されていません');
            }
            
            if (!article || !article.title || !article.content) {
                throw new Error('記事データが不正です（titleまたはcontentが不足）');
            }
            
            console.log('📤 WordPress投稿開始:', article.title);
            
            // マークダウンからHTMLに簡易変換
            const htmlContent = this.convertMarkdownToHtml(article.content);
            
            // WordPressの投稿データ準備
            const postData = {
                title: article.title,
                content: htmlContent,
                status: 'draft', // 下書きとして投稿（安全性のため）
                author: 1, // 管理者ユーザー
                excerpt: this.generateExcerpt(article.content),
                tags: article.keywords ? article.keywords.split(',').map(k => k.trim()) : [],
                categories: [1], // デフォルトカテゴリ
                meta: {
                    generated_by: 'Firebase Functions Blog Automation',
                    template_used: article.template || 'unknown',
                    word_count: article.wordCount || 0,
                    generated_at: new Date().toISOString()
                }
            };
            
            // WordPress REST API 投稿実行
            const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`WordPress投稿エラー (${response.status}): ${errorData.message || 'Unknown error'}`);
            }
            
            const postResult = await response.json();
            
            console.log('✅ WordPress投稿成功:', postResult.id);
            
            return {
                published: true,
                id: postResult.id,
                title: postResult.title.rendered,
                link: postResult.link,
                status: postResult.status,
                date: postResult.date,
                modified: postResult.modified,
                excerpt: postResult.excerpt.rendered,
                author: postResult.author,
                categories: postResult.categories,
                tags: postResult.tags
            };
            
        } catch (error) {
            console.error('❌ WordPress投稿エラー:', error);
            throw new Error(`WordPress投稿失敗: ${error.message}`);
        }
    }
    
    /**
     * マークダウンからHTMLへの簡易変換
     * @param {string} markdown - マークダウンテキスト
     * @returns {string} HTML変換されたテキスト
     */
    convertMarkdownToHtml(markdown) {
        if (!markdown) return '';
        
        let html = markdown;
        
        // 見出しの変換
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
        
        // 太字・斜体
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // リンク
        html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
        
        // 改行をHTMLの改行に変換
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        
        // 段落タグで囲む
        html = '<p>' + html + '</p>';
        
        // 連続するpタグをクリーンアップ
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p><p>/g, '<p>');
        html = html.replace(/<\/p><\/p>/g, '</p>');
        
        return html;
    }
    
    /**
     * 記事の抜粋を生成
     * @param {string} content - 記事本文
     * @returns {string} 抜粋テキスト
     */
    generateExcerpt(content) {
        if (!content) return '';
        
        // マークダウン記法を除去
        let plainText = content.replace(/#+\s/g, ''); // 見出し記号削除
        plainText = plainText.replace(/\*\*(.+?)\*\*/g, '$1'); // 太字記号削除
        plainText = plainText.replace(/\*(.+?)\*/g, '$1'); // 斜体記号削除
        plainText = plainText.replace(/\[(.+?)\]\(.+?\)/g, '$1'); // リンク記号削除
        
        // 最初の段落を取得（改行で分割）
        const firstParagraph = plainText.split('\n\n')[0];
        
        // 120文字に制限
        if (firstParagraph.length > 120) {
            return firstParagraph.substring(0, 120) + '...';
        }
        
        return firstParagraph;
    }
    
    /**
     * WordPress投稿の更新
     * @param {number} postId - 投稿ID
     * @param {Object} updateData - 更新データ
     * @returns {Object} 更新結果
     */
    async updateWordPressPost(postId, updateData) {
        try {
            const wpUrl = process.env.WP_URL;
            const wpUsername = process.env.WP_USERNAME;
            const wpPassword = process.env.WP_PASSWORD;
            
            if (!postId) {
                throw new Error('投稿IDが指定されていません');
            }
            
            console.log(`📝 WordPress投稿更新開始: ID ${postId}`);
            
            const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`WordPress更新エラー (${response.status}): ${errorData.message}`);
            }
            
            const updateResult = await response.json();
            
            console.log('✅ WordPress投稿更新成功:', updateResult.id);
            
            return {
                updated: true,
                id: updateResult.id,
                title: updateResult.title.rendered,
                link: updateResult.link,
                status: updateResult.status,
                modified: updateResult.modified
            };
            
        } catch (error) {
            console.error('❌ WordPress更新エラー:', error);
            throw new Error(`WordPress更新失敗: ${error.message}`);
        }
    }
}

// エクスポート
module.exports = CloudBlogTool;

console.log('🛠️ CloudBlogTool クラス定義完了');
