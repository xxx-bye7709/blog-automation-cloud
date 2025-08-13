// functions/lib/blog-tool.js
// WordPress自動投稿システム - SEO最適化完全版

const axios = require('axios');
const OpenAI = require('openai');

// 既存のQUALITY_CONFIG（変更なし）
const QUALITY_CONFIG = {
  minLength: 2500,
  maxRetries: 3,
  gptModel: 'gpt-4o-mini',
  temperature: 0.8,
  maxTokens: 4000,
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
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.wpUrl = process.env.WP_URL || 'https://www.entamade.jp';
    this.wpUsername = process.env.WP_USERNAME || 'entamade';
    this.wpPassword = process.env.WP_PASSWORD || '8fFf Ys5r dPUp TDPp 8oqg JWQy';
    
    const credentials = Buffer.from(`${this.wpUsername}:${this.wpPassword}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;

    try {
      const DMMIntegration = require('./dmm-integration');
      this.dmmIntegration = new DMMIntegration();
      this.enableDMM = process.env.ENABLE_DMM === 'true' || false;
    } catch (error) {
      console.log('DMM統合は無効です');
      this.enableDMM = false;
    }

    try {
      const ImageGenerator = require('./image-generator');
      this.imageGenerator = new ImageGenerator();
    } catch (error) {
      console.log('画像生成モジュールが見つかりません');
    }

    try {
      const templates = require('./templates');
      this.templates = templates;
    } catch (error) {
      console.log('テンプレートモジュールが見つかりません');
    }
    
    this.lastAPICall = 0;
    this.minTimeBetweenCalls = 3000;
  }

  /**
   * 強化版SEO最適化メソッド - すべてのSEO要件を確実に満たす
   */
  enhancedSEOOptimization(content, keyword, category, title) {
    console.log(`🔍 Enhanced SEO Optimization for keyword: "${keyword}"`);
    
    // letに変更して再代入可能にする
    let optimizedContent = content;
    
    // Step 1: キーフレーズを第一段落に確実に含める
    optimizedContent = this.ensureKeywordInFirstParagraph(optimizedContent, keyword);
    
    // Step 2: キーフレーズ密度を最適化（5-8回）
    optimizedContent = this.optimizeKeywordDensity(optimizedContent, keyword);
    
    // Step 3: 外部リンクを確実に追加（2-3個）
    optimizedContent = this.ensureExternalLinks(optimizedContent, category, keyword);
    
    // Step 4: 内部リンクを追加
    optimizedContent = this.addInternalLinks(optimizedContent, category);
    
    // Step 5: H2/H3見出しにキーワードを含める
    optimizedContent = this.optimizeHeadings(optimizedContent, keyword);
    
    // Step 6: 画像のalt属性を最適化
    optimizedContent = this.optimizeImageAlt(optimizedContent, keyword, title);
    
    // Step 7: 文章の可読性を向上
    optimizedContent = this.shortenSentences(optimizedContent);
    
    // SEO分析レポート
    this.reportSEOStatus(optimizedContent, keyword);
    
    return optimizedContent;
  }

  /**
   * 第一段落にキーフレーズを確実に含める
   */
  ensureKeywordInFirstParagraph(content, keyword) {
    const firstParagraphRegex = /<p>([^<]+)<\/p>/;
    const match = content.match(firstParagraphRegex);
    
    if (match && !match[1].toLowerCase().includes(keyword.toLowerCase())) {
      console.log('⚠️ キーフレーズが第一段落にありません。追加します...');
      
      // 第一段落の最初にキーフレーズを自然に追加
      const newFirstParagraph = `<p>今回は、${keyword}について詳しく解説します。${match[1]}</p>`;
      content = content.replace(match[0], newFirstParagraph);
      
      console.log('✅ キーフレーズを第一段落に追加しました');
    }
    
    return content;
  }

  /**
   * キーフレーズ密度を最適化（確実に5-8回含める）
   */
  optimizeKeywordDensity(content, keyword) {
    let optimizedContent = content;  // letに変更
    let currentCount = (optimizedContent.match(new RegExp(keyword, 'gi')) || []).length;
    console.log(`📊 現在のキーフレーズ出現回数: ${currentCount}回`);
    
    // キーフレーズが多すぎる場合は減らす
    if (currentCount > 8) {
      console.log(`⚠️ キーフレーズが多すぎます（${currentCount}回）。調整します...`);
      // 一部のキーフレーズを代名詞や類義語に置き換える処理
      // ここでは最初の8回以降を別の表現に置き換える
      let replacedCount = 0;
      const maxOccurrences = 8;
      
      optimizedContent = optimizedContent.replace(new RegExp(keyword, 'gi'), (match) => {
        replacedCount++;
        if (replacedCount > maxOccurrences) {
          // 8回を超えたら「それ」「この」などに置き換える
          return 'この分野';
        }
        return match;
      });
      
      currentCount = (optimizedContent.match(new RegExp(keyword, 'gi')) || []).length;
      console.log(`✅ キーフレーズを${currentCount}回に調整しました`);
    }
    
    // キーフレーズが少ない場合は増やす
    if (currentCount < 5) {
      const needed = 5 - currentCount;
      console.log(`⚠️ キーフレーズが不足しています。${needed}回追加します...`);
      
      // 各セクションに自然にキーフレーズを追加
      const sections = optimizedContent.split(/<\/h[23]>/);
      let addedCount = 0;
      
      for (let i = 0; i < sections.length && addedCount < needed; i++) {
        if (!sections[i].includes(keyword) || (sections[i].match(new RegExp(keyword, 'gi')) || []).length < 2) {
          // 段落の中間あたりにキーフレーズを挿入
          const paragraphs = sections[i].split('</p>');
          if (paragraphs.length > 1) {
            const midIndex = Math.floor(paragraphs.length / 2);
            paragraphs[midIndex] = paragraphs[midIndex].replace(
              /<p>([^<]+)/,
              `<p>$1 ${keyword}の観点から見ると、`
            );
            sections[i] = paragraphs.join('</p>');
            addedCount++;
          }
        }
      }
      
      optimizedContent = sections.join('</h3>').replace(/<\/h3><\/h3>/g, '</h3>');
      currentCount = (optimizedContent.match(new RegExp(keyword, 'gi')) || []).length;
      console.log(`✅ キーフレーズ密度を最適化しました（${currentCount}回）`);
    }
    
    return optimizedContent;
  }

  /**
   * 外部リンクを確実に追加（修正版）
   */
  ensureExternalLinks(content, category, keyword) {
    let optimizedContent = content;  // letに変更
    const existingExternalLinks = (optimizedContent.match(/<a\s+href="https?:\/\/(?!www\.entamade\.jp)/gi) || []).length;
    console.log(`🔗 現在の外部リンク数: ${existingExternalLinks}個`);
    
    if (existingExternalLinks < 2) {
      console.log('⚠️ 外部リンクが不足しています。追加します...');
      
      const externalLinks = this.getExternalLinksForCategory(category);
      
      // 記事の中盤に外部リンクセクションを追加
      const h3Tags = optimizedContent.match(/<\/h3>/g) || [];
      if (h3Tags.length >= 2) {
        const insertPoint = optimizedContent.indexOf('</h3>', optimizedContent.indexOf('</h3>') + 1);
        const linkSection = `</h3>
<p>より詳しい情報については、以下の信頼できるソースもご参照ください：</p>
<ul>
<li>${externalLinks[0]}</li>
<li>${externalLinks[1]}</li>
${externalLinks[2] ? `<li>${externalLinks[2]}</li>` : ''}
</ul>
<p>${keyword}に関する最新情報は、これらのサイトでも確認できます。</p>`;
        
        optimizedContent = optimizedContent.slice(0, insertPoint) + linkSection + optimizedContent.slice(insertPoint + 5);
      } else {
        // H3タグがない場合は記事の最後に追加
        const linkSection = `
<h3>参考リンク</h3>
<p>${keyword}についてさらに詳しく知りたい方は、以下のリンクもご覧ください：</p>
<ul>
<li>${externalLinks[0]}</li>
<li>${externalLinks[1]}</li>
</ul>`;
        // まとめセクションの前に挿入
        const summaryIndex = optimizedContent.lastIndexOf('<h2>まとめ');
        if (summaryIndex !== -1) {
          optimizedContent = optimizedContent.slice(0, summaryIndex) + linkSection + optimizedContent.slice(summaryIndex);
        } else {
          optimizedContent += linkSection;
        }
      }
      
      console.log('✅ 外部リンクを追加しました');
    }
    
    return optimizedContent;
  }

  /**
   * カテゴリ別の外部リンクを取得（拡張版）
   */
  getExternalLinksForCategory(category) {
    const links = {
      tech: [
        '<a href="https://www.gartner.com/jp" target="_blank" rel="nofollow noopener">Gartner Japan（IT調査会社）</a>',
        '<a href="https://www.meti.go.jp/" target="_blank" rel="nofollow noopener">経済産業省</a>',
        '<a href="https://www.nikkei.com/tech/" target="_blank" rel="nofollow noopener">日経テクノロジー</a>'
      ],
      anime: [
        '<a href="https://www.animenewsnetwork.com/" target="_blank" rel="nofollow noopener">Anime News Network</a>',
        '<a href="https://www.oricon.co.jp/anime/" target="_blank" rel="nofollow noopener">オリコンアニメ</a>',
        '<a href="https://natalie.mu/comic" target="_blank" rel="nofollow noopener">コミックナタリー</a>'
      ],
      game: [
        '<a href="https://www.famitsu.com/" target="_blank" rel="nofollow noopener">ファミ通</a>',
        '<a href="https://www.4gamer.net/" target="_blank" rel="nofollow noopener">4Gamer</a>',
        '<a href="https://game.watch.impress.co.jp/" target="_blank" rel="nofollow noopener">GAME Watch</a>'
      ],
      movie: [
        '<a href="https://eiga.com/" target="_blank" rel="nofollow noopener">映画.com</a>',
        '<a href="https://www.cinematoday.jp/" target="_blank" rel="nofollow noopener">シネマトゥデイ</a>',
        '<a href="https://www.imdb.com/" target="_blank" rel="nofollow noopener">IMDb（映画データベース）</a>'
      ],
      music: [
        '<a href="https://www.oricon.co.jp/" target="_blank" rel="nofollow noopener">オリコン</a>',
        '<a href="https://www.billboard-japan.com/" target="_blank" rel="nofollow noopener">Billboard Japan</a>',
        '<a href="https://natalie.mu/music" target="_blank" rel="nofollow noopener">音楽ナタリー</a>'
      ],
      beauty: [
        '<a href="https://www.cosme.net/" target="_blank" rel="nofollow noopener">@cosme（コスメ口コミサイト）</a>',
        '<a href="https://maquia.hpplus.jp/" target="_blank" rel="nofollow noopener">MAQUIA ONLINE</a>',
        '<a href="https://www.vogue.co.jp/beauty/" target="_blank" rel="nofollow noopener">VOGUE Beauty</a>'
      ],
      food: [
        '<a href="https://tabelog.com/" target="_blank" rel="nofollow noopener">食べログ</a>',
        '<a href="https://www.hotpepper.jp/mesitsu/" target="_blank" rel="nofollow noopener">メシ通</a>',
        '<a href="https://www.gnavi.co.jp/" target="_blank" rel="nofollow noopener">ぐるなび</a>'
      ],
      entertainment: [
        '<a href="https://www.oricon.co.jp/" target="_blank" rel="nofollow noopener">オリコン</a>',
        '<a href="https://natalie.mu/" target="_blank" rel="nofollow noopener">ナタリー</a>',
        '<a href="https://mdpr.jp/" target="_blank" rel="nofollow noopener">モデルプレス</a>'
      ],
      selfhelp: [
        '<a href="https://diamond.jp/" target="_blank" rel="nofollow noopener">ダイヤモンド・オンライン</a>',
        '<a href="https://toyokeizai.net/" target="_blank" rel="nofollow noopener">東洋経済オンライン</a>',
        '<a href="https://president.jp/" target="_blank" rel="nofollow noopener">プレジデントオンライン</a>'
      ]
    };
    
    return links[category] || links.entertainment;
  }

  /**
   * 内部リンクを追加（改善版）
   */
  addInternalLinks(content, category) {
    let optimizedContent = content;  // letに変更
    const internalLinks = this.getInternalLinks(category);
    
    // 最初のH3の後に内部リンクを追加
    const firstH3Index = optimizedContent.indexOf('</h3>');
    if (firstH3Index !== -1 && !optimizedContent.includes('関連記事もご覧ください')) {
      const linkSection = `</h3>
<p>関連記事もご覧ください：${internalLinks.slice(0, 2).join('、')}</p>`;
      optimizedContent = optimizedContent.slice(0, firstH3Index) + linkSection + optimizedContent.slice(firstH3Index + 5);
      console.log('✅ 内部リンクを追加しました');
    }
    
    return optimizedContent;
  }

  /**
   * 見出しを最適化
   */
  optimizeHeadings(content, keyword) {
    let optimizedContent = content;  // letに変更
    
    // H2見出しの少なくとも1つにキーワードを含める
    const h2Regex = /<h2>([^<]+)<\/h2>/g;
    let h2Optimized = false;
    
    optimizedContent = optimizedContent.replace(h2Regex, (match, heading) => {
      if (!h2Optimized && !heading.includes(keyword)) {
        h2Optimized = true;
        return `<h2>${keyword}の${heading}</h2>`;
      }
      return match;
    });
    
    if (h2Optimized) {
      console.log('✅ H2見出しにキーフレーズを追加しました');
    }
    
    return optimizedContent;
  }

  /**
   * 文章を短くする（可読性向上）
   */
  shortenSentences(content) {
    let optimizedContent = content;  // letに変更
    
    // 長い文章を分割
    optimizedContent = optimizedContent.replace(/<p>([^<]+)<\/p>/g, (match, paragraph) => {
      // 100文字以上の文を分割
      if (paragraph.length > 100) {
        const sentences = paragraph.split(/(?<=[。！？])/);
        const shortSentences = [];
        
        sentences.forEach(sentence => {
          if (sentence.length > 40) {
            // 「、」で分割
            const parts = sentence.split('、');
            if (parts.length > 2) {
              shortSentences.push(parts.slice(0, 2).join('、') + '。');
              shortSentences.push(parts.slice(2).join('、'));
            } else {
              shortSentences.push(sentence);
            }
          } else {
            shortSentences.push(sentence);
          }
        });
        
        return `<p>${shortSentences.join('')}</p>`;
      }
      return match;
    });
    
    return optimizedContent;
  }

  /**
   * SEOステータスをレポート
   */
  reportSEOStatus(content, keyword) {
    const keywordCount = (content.match(new RegExp(keyword, 'gi')) || []).length;
    const externalLinkCount = (content.match(/<a\s+href="https?:\/\/(?!www\.entamade\.jp)/gi) || []).length;
    const internalLinkCount = (content.match(/<a\s+href="https?:\/\/www\.entamade\.jp/gi) || []).length;
    const h2Count = (content.match(/<h2>/gi) || []).length;
    const h3Count = (content.match(/<h3>/gi) || []).length;
    
    console.log('📊 === SEO最適化レポート ===');
    console.log(`✅ キーフレーズ「${keyword}」: ${keywordCount}回`);
    console.log(`✅ 外部リンク: ${externalLinkCount}個`);
    console.log(`✅ 内部リンク: ${internalLinkCount}個`);
    console.log(`✅ H2見出し: ${h2Count}個`);
    console.log(`✅ H3見出し: ${h3Count}個`);
    
    // 第一段落のチェック
    const firstParagraph = content.match(/<p>([^<]+)<\/p>/);
    const hasKeywordInFirst = firstParagraph && firstParagraph[1].toLowerCase().includes(keyword.toLowerCase());
    console.log(`✅ 第一段落にキーフレーズ: ${hasKeywordInFirst ? 'あり' : 'なし'}`);
  }

  /**
   * メタディスクリプションを生成（キーフレーズを確実に含める）
   */
  generateSEOMetaDescription(content, keyword, title) {
    // コンテンツから最初の段落を抽出
    const firstParagraph = content.match(/<p>([^<]+)<\/p>/);
    let metaDesc = '';
    
    if (firstParagraph) {
      metaDesc = firstParagraph[1].replace(/<[^>]*>/g, '');
    } else {
      metaDesc = title;
    }
    
    // キーフレーズが含まれていることを確認
    if (!metaDesc.toLowerCase().includes(keyword.toLowerCase())) {
      metaDesc = `${keyword}について詳しく解説。${metaDesc}`;
    }
    
    // 155文字以内に調整
    if (metaDesc.length > 155) {
      metaDesc = metaDesc.substring(0, 152) + '...';
    }
    
    // 再度キーフレーズの確認
    if (!metaDesc.includes(keyword)) {
      metaDesc = `【${keyword}】${metaDesc.substring(keyword.length + 2)}`;
    }
    
    console.log(`📝 Meta description: "${metaDesc}"`);
    return metaDesc;
  }

  /**
   * 記事生成のメインフロー（SEO強化版）
   */
  async generateArticle(category = 'entertainment') {
    try {
      console.log(`🔍 ${category}カテゴリーの記事を生成中...`);
      
      const template = this.getTemplate(category);
      const article = await this.generateWithGPT(category, template);
      
      // SEOキーワードを決定（最初のタグをフォーカスキーワードに）
      const focusKeyword = article.tags[0] || this.getCategoryName(category);
      
      // 強化版SEO最適化を適用
      console.log(`🔍 強化版SEO最適化を適用中... キーワード: ${focusKeyword}`);
      article.content = this.enhancedSEOOptimization(
        article.content, 
        focusKeyword, 
        category,
        article.title
      );
      
      // メタディスクリプションを生成
      article.metaDescription = this.generateSEOMetaDescription(
        article.content,
        focusKeyword,
        article.title
      );
      
      // フォーカスキーワードをメタデータに追加
      article.focusKeyword = focusKeyword;
      
      // DMMコンテンツを挿入（有効な場合）
      if (this.enableDMM && this.dmmIntegration) {
        console.log('🛒 DMM商品を検索中...');
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
          const imagePrompt = `${focusKeyword} ${article.title}`;
          const fullPrompt = this.imageGenerator.generateImagePrompt(imagePrompt, category);
          
          const imageResult = await this.imageGenerator.generateImage(
            fullPrompt,
            '1792x1024',
            'standard'
          );
          
          if (imageResult.success) {
            article.featuredImage = imageResult.imageUrl;
            console.log('🎨 DALL-E 3画像生成成功:', imageResult.imageUrl);
          }
        } catch (error) {
          console.error('画像生成エラー:', error.message);
        }
      }
      
      console.log(`✅ SEO最適化完了: キーワード「${focusKeyword}」`);
      
      return article;
      
    } catch (error) {
      console.error('記事生成エラー:', error);
      throw error;
    }
  }

  /**
   * WordPressに投稿（SEOメタデータ付き）
   */
  async postToWordPress(article) {
    try {
      console.log('📤 WordPressに投稿中...');
      
      let attachmentId = null;
      let uploadedImageUrl = null;
      
      // 画像のアップロード処理
      if (article.featuredImage) {
        try {
          const safeTitle = article.title
            .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '-')
            .substring(0, 50);
          const filename = `${safeTitle}-${Date.now()}.png`;
          
          const mediaInfo = await this.uploadImageViaXMLRPC(
            article.featuredImage,
            filename
          );
          
          if (mediaInfo && mediaInfo.id) {
            attachmentId = mediaInfo.id;
            uploadedImageUrl = mediaInfo.url || article.featuredImage;
            console.log(`✅ 画像アップロード成功: Attachment ID ${attachmentId}`);
          } else {
            console.log('⚠️ 画像アップロード失敗（記事は投稿続行）');
            uploadedImageUrl = article.featuredImage;
          }
          
        } catch (imageError) {
          console.error('⚠️ 画像アップロードエラー（記事は投稿続行）:', imageError.message);
          uploadedImageUrl = article.featuredImage;
        }
      }
      
      // 記事内に画像を挿入（SEO最適化されたalt属性付き）
      if (uploadedImageUrl) {
        article.content = this.insertImageIntoContent(
          article.content,
          uploadedImageUrl,
          article.title,
          2,
          article.focusKeyword || ''
        );
        console.log('📸 記事内に画像を挿入しました（SEO最適化済み）');
      }
      
      // SEOカスタムフィールドを含むXMLリクエストを作成
      const xmlRequest = this.createWordPressXMLWithSEO(article, attachmentId);
      
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

      console.log('📨 WordPress Response Status:', response.status);

      let postId = null;
      
      if (typeof response.data === 'string') {
        const stringMatch = response.data.match(/<string>(\d+)<\/string>/);
        if (stringMatch) {
          postId = stringMatch[1];
          console.log('✅ String Pattern Match - Post ID:', postId);
        }
        
        if (!postId) {
          const intMatch = response.data.match(/<int>(\d+)<\/int>/);
          if (intMatch) {
            postId = intMatch[1];
            console.log('✅ Int Pattern Match - Post ID:', postId);
          }
        }
        
        const faultMatch = response.data.match(/<fault>/);
        if (faultMatch) {
          const errorMatch = response.data.match(/<name>faultString<\/name>\s*<value><string>(.*?)<\/string>/);
          const errorMessage = errorMatch ? errorMatch[1] : 'Unknown WordPress XML-RPC Fault';
          
          console.error('❌ WordPress Fault:', errorMessage);
          
          const codeMatch = response.data.match(/<name>faultCode<\/name>\s*<value><int>(\d+)<\/int>/);
          const errorCode = codeMatch ? codeMatch[1] : 'unknown';
          console.error('❌ Fault Code:', errorCode);
          
          throw new Error(`WordPress Error: ${errorMessage} (Code: ${errorCode})`);
        }
      }

      if (postId && parseInt(postId) > 0) {
        console.log(`✅ 投稿成功！ Post ID: ${postId}`);
        console.log(`🔍 アイキャッチ画像: ${attachmentId ? 'あり (ID: ' + attachmentId + ')' : 'なし'}`);
        console.log(`📊 SEO最適化: 完了（キーワード: ${article.focusKeyword || 'なし'}）`);
        console.log(`📝 メタディスクリプション: ${article.metaDescription ? '設定済み' : 'なし'}`);
        
        return {
          success: true,
          postId,
          url: `${this.wpUrl}/?p=${postId}`,
          title: article.title,
          imageUrl: article.featuredImage || null,
          attachmentId: attachmentId,
          focusKeyword: article.focusKeyword || null,
          metaDescription: article.metaDescription || null
        };
      } else {
        console.error('❌ 有効な投稿IDが見つかりません');
        throw new Error(`有効な投稿IDを取得できませんでした`);
      }
      
    } catch (error) {
      console.error('WordPress投稿エラー:', error.message);
      if (error.response) {
        console.error('❌ Error Status:', error.response.status);
        console.error('❌ Error Data:', error.response.data?.substring(0, 500));
      }
      throw error;
    }
  }

  /**
   * WordPress XML-RPC リクエストを作成（SEOカスタムフィールド付き）
   */
  createWordPressXMLWithSEO(article, attachmentId = null) {
    const { title, content, excerpt, tags, category, status } = article;
    
    // SEO最適化されたタイトル（60文字以内）
    const seoTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
    
    // SEO最適化された抜粋（155文字以内）
    const seoExcerpt = article.metaDescription || 
                       (excerpt.length > 155 ? excerpt.substring(0, 152) + '...' : excerpt);
    
    const tagsXML = tags.map(tag => 
      `<value><string>${this.escapeXML(tag)}</string></value>`
    ).join('');

    const categoryName = this.getCategoryName(category);

    const thumbnailXML = attachmentId ? `
          <member>
            <name>post_thumbnail</name>
            <value><int>${attachmentId}</int></value>
          </member>` : '';

    // Yoast SEO用のカスタムフィールド
    const customFieldsXML = article.focusKeyword ? `
          <member>
            <name>custom_fields</name>
            <value>
              <array>
                <data>
                  <value>
                    <struct>
                      <member>
                        <name>key</name>
                        <value><string>_yoast_wpseo_focuskw</string></value>
                      </member>
                      <member>
                        <name>value</name>
                        <value><string>${this.escapeXML(article.focusKeyword)}</string></value>
                      </member>
                    </struct>
                  </value>
                  <value>
                    <struct>
                      <member>
                        <name>key</name>
                        <value><string>_yoast_wpseo_metadesc</string></value>
                      </member>
                      <member>
                        <name>value</name>
                        <value><string>${this.escapeXML(seoExcerpt)}</string></value>
                      </member>
                    </struct>
                  </value>
                </data>
              </array>
            </value>
          </member>` : '';

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
            <value><string>${this.escapeXML(seoTitle)}</string></value>
          </member>
          <member>
            <name>post_content</name>
            <value><string>${this.escapeXML(content)}</string></value>
          </member>
          <member>
            <name>post_excerpt</name>
            <value><string>${this.escapeXML(seoExcerpt)}</string></value>
          </member>${thumbnailXML}${customFieldsXML}
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

  // ===== 以下、既存のメソッドはそのまま維持 =====
  
  // 既存のヘルパーメソッド（変更なし）
  optimizeContentForSEO(content, keyword, category) {
    // このメソッドは enhancedSEOOptimization に置き換えられますが、
    // 後方互換性のために残します
    return this.enhancedSEOOptimization(content, keyword, category, '');
  }
  
  getInternalLinks(category) {
    const baseUrl = 'https://www.entamade.jp';
    const links = {
      tech: [
        `<a href="${baseUrl}/category/tech/">テクノロジー記事一覧</a>`,
        `<a href="${baseUrl}/tag/ai/">AI関連記事</a>`,
        `<a href="${baseUrl}/tag/gadget/">ガジェット記事</a>`
      ],
      anime: [
        `<a href="${baseUrl}/category/anime/">アニメ記事一覧</a>`,
        `<a href="${baseUrl}/tag/2025-anime/">2025年アニメ</a>`,
        `<a href="${baseUrl}/tag/review/">レビュー記事</a>`
      ],
      game: [
        `<a href="${baseUrl}/category/game/">ゲーム記事一覧</a>`,
        `<a href="${baseUrl}/tag/ps5/">PS5関連記事</a>`,
        `<a href="${baseUrl}/tag/review/">レビュー記事</a>`
      ],
      movie: [
        `<a href="${baseUrl}/category/movie/">映画記事一覧</a>`,
        `<a href="${baseUrl}/tag/2025-movie/">2025年映画</a>`,
        `<a href="${baseUrl}/tag/review/">レビュー記事</a>`
      ],
      music: [
        `<a href="${baseUrl}/category/music/">音楽記事一覧</a>`,
        `<a href="${baseUrl}/tag/j-pop/">J-POP記事</a>`,
        `<a href="${baseUrl}/tag/live/">ライブ情報</a>`
      ],
      beauty: [
        `<a href="${baseUrl}/category/beauty/">美容記事一覧</a>`,
        `<a href="${baseUrl}/tag/skincare/">スキンケア記事</a>`,
        `<a href="${baseUrl}/tag/cosmetics/">コスメ記事</a>`
      ],
      food: [
        `<a href="${baseUrl}/category/food/">グルメ記事一覧</a>`,
        `<a href="${baseUrl}/tag/recipe/">レシピ記事</a>`,
        `<a href="${baseUrl}/tag/restaurant/">レストラン記事</a>`
      ],
      entertainment: [
        `<a href="${baseUrl}/category/entertainment/">エンタメ記事一覧</a>`,
        `<a href="${baseUrl}/tag/news/">ニュース記事</a>`,
        `<a href="${baseUrl}/tag/celebrity/">芸能記事</a>`
      ],
      selfhelp: [
        `<a href="${baseUrl}/category/selfhelp/">自己啓発記事一覧</a>`,
        `<a href="${baseUrl}/tag/communication/">コミュニケーション記事</a>`,
        `<a href="${baseUrl}/tag/growth/">成長記事</a>`
      ]
    };
    
    return links[category] || links.tech;
  }

  getExternalLinks(category) {
    // enhancedSEOOptimization で使用される新しいメソッドに委譲
    return this.getExternalLinksForCategory(category);
  }

  optimizeImageAlt(content, keyword, title) {
    // 画像のalt属性にキーワードを含める
    content = content.replace(
      /<img([^>]*?)alt="([^"]*)"([^>]*?)>/g,
      (match, before, alt, after) => {
        if (!alt.includes(keyword)) {
          return `<img${before}alt="${keyword}を使った${title}"${after}>`;
        }
        return match;
      }
    );
    
    // alt属性がない画像に追加
    content = content.replace(
      /<img(?![^>]*alt=)([^>]*?)>/g,
      `<img$1 alt="${keyword}に関する${title}">`
    );
    
    return content;
  }

  shortenSentences(content) {
    // 長い文章を分割
    return content.replace(/<p>([^<]+)<\/p>/g, (match, paragraph) => {
      // 100文字以上の文を分割
      if (paragraph.length > 100) {
        const sentences = paragraph.split(/(?<=[。！？])/);
        const shortSentences = [];
        
        sentences.forEach(sentence => {
          if (sentence.length > 40) {
            // 「、」で分割
            const parts = sentence.split('、');
            if (parts.length > 2) {
              shortSentences.push(parts.slice(0, 2).join('、') + '。');
              shortSentences.push(parts.slice(2).join('、'));
            } else {
              shortSentences.push(sentence);
            }
          } else {
            shortSentences.push(sentence);
          }
        });
        
        return `<p>${shortSentences.join('')}</p>`;
      }
      return match;
    });
  }

  // ===== 以下、既存のメソッドをそのまま維持 =====
  
  uploadImageViaXMLRPC(imageUrl, filename = 'featured-image.png') {
    // 既存のコードをそのまま維持
    return this.uploadImageViaXMLRPCOriginal(imageUrl, filename);
  }
  
  async uploadImageViaXMLRPCOriginal(imageUrl, filename = 'featured-image.png') {
    try {
      console.log('🖼️ XML-RPC画像アップロード開始:', imageUrl);
      
      const maxRetries = 3;
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            maxContentLength: 50 * 1024 * 1024,
            maxBodyLength: 50 * 1024 * 1024
          });
          
          const imageBuffer = Buffer.from(imageResponse.data);
          
          if (imageBuffer.length > 10 * 1024 * 1024) {
            console.log('⚠️ 画像サイズが大きすぎます:', imageBuffer.length, 'bytes');
          }
          
          const base64Image = imageBuffer.toString('base64');
          console.log('📥 画像ダウンロード完了:', imageBuffer.length, 'bytes');
          
          const xmlContent = `<?xml version="1.0"?>
<methodCall>
  <methodName>wp.uploadFile</methodName>
  <params>
    <param><value><int>1</int></value></param>
    <param><value><string>${this.wpUsername}</string></value></param>
    <param><value><string>${this.wpPassword}</string></value></param>
    <param>
      <value>
        <struct>
          <member>
            <name>name</name>
            <value><string>${filename}</string></value>
          </member>
          <member>
            <name>type</name>
            <value><string>image/png</string></value>
          </member>
          <member>
            <name>bits</name>
            <value><base64>${base64Image}</base64></value>
          </member>
          <member>
            <name>overwrite</name>
            <value><boolean>0</boolean></value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;
          
          const response = await axios.post(
            `${this.wpUrl}/xmlrpc.php`,
            xmlContent,
            {
              headers: {
                'Content-Type': 'text/xml',
                'Content-Length': Buffer.byteLength(xmlContent)
              },
              timeout: 60000,
              maxContentLength: Infinity,
              maxBodyLength: Infinity
            }
          );
          
          const mediaInfo = this.parseUploadResponse(response.data);
          
          if (mediaInfo && mediaInfo.id) {
            console.log('✅ XML-RPC画像アップロード成功:', mediaInfo);
            return mediaInfo;
          } else {
            throw new Error('画像IDを取得できませんでした');
          }
          
        } catch (error) {
          lastError = error;
          console.error(`❌ アップロード試行 ${attempt}/${maxRetries} 失敗:`, error.message);
          
          if (attempt < maxRetries) {
            console.log(`⏳ ${3 * attempt}秒待機して再試行...`);
            await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
          }
        }
      }
      
      console.error('❌ XML-RPC画像アップロード最終失敗:', lastError?.message);
      return null;
      
    } catch (error) {
      console.error('❌ XML-RPC画像アップロードエラー:', error.message);
      return null;
    }
  }

  parseUploadResponse(xmlResponse) {
    try {
      let id = null;
      
      const idMatch1 = xmlResponse.match(/<name>id<\/name>\s*<value>(?:<string>)?(\d+)(?:<\/string>)?<\/value>/);
      if (idMatch1) id = parseInt(idMatch1[1]);
      
      if (!id) {
        const idMatch2 = xmlResponse.match(/<name>attachment_id<\/name>\s*<value>(?:<i4>|<int>)?(\d+)(?:<\/i4>|<\/int>)?<\/value>/);
        if (idMatch2) id = parseInt(idMatch2[1]);
      }
      
      const urlMatch = xmlResponse.match(/<name>url<\/name>\s*<value><string>([^<]+)<\/string><\/value>/);
      const url = urlMatch ? urlMatch[1] : null;
      
      const fileMatch = xmlResponse.match(/<name>file<\/name>\s*<value><string>([^<]+)<\/string><\/value>/);
      const file = fileMatch ? fileMatch[1] : null;
      
      console.log('📋 パース結果:', { id, url, file });
      
      return {
        id: id,
        url: url,
        file: file
      };
    } catch (error) {
      console.error('❌ レスポンスパースエラー:', error);
      return null;
    }
  }

  insertImageIntoContent(content, imageUrl, title, position = 1, keyword = '') {
    if (!imageUrl) return content;
    
    const altText = keyword ? `${keyword}に関する${title}` : this.escapeXML(title);
    const imageHtml = `
<figure class="wp-block-image">
<img src="${imageUrl}" alt="${altText}" loading="lazy" />
</figure>
`;
    
    if (position === 1) {
      const firstParagraphEnd = content.indexOf('</p>');
      if (firstParagraphEnd !== -1) {
        return content.slice(0, firstParagraphEnd + 4) + imageHtml + content.slice(firstParagraphEnd + 4);
      }
    } else if (position === 2) {
      const paragraphs = content.split('</p>');
      if (paragraphs.length > 3) {
        const midPoint = Math.floor(paragraphs.length / 2);
        paragraphs.splice(midPoint, 0, imageHtml);
        return paragraphs.join('</p>');
      }
    }
    
    const firstH3 = content.indexOf('<h3>');
    if (firstH3 !== -1) {
      return content.slice(0, firstH3) + imageHtml + content.slice(firstH3);
    }
    
    const firstH2End = content.indexOf('</h2>');
    if (firstH2End !== -1) {
      return content.slice(0, firstH2End + 5) + imageHtml + content.slice(firstH2End + 5);
    }
    
    return imageHtml + content;
  }

  // ===== 以下、既存のメソッドをそのまま継続 =====
  
  parseGPTResponse(content, category) {
    // 既存のコードをそのまま維持
    return this.parseGPTResponseOriginal(content, category);
  }
  
  parseGPTResponseOriginal(content, category) {
    console.log('[parseGPTResponse] Content length:', content.length);
    console.log('[parseGPTResponse] First 300 chars:', content.substring(0, 300));
    
    let title = null;
    let bodyContent = content;
    
    const htmlTitleMatch = content.match(/<title>([^<]+)<\/title>/i);
    if (htmlTitleMatch) {
      title = htmlTitleMatch[1].trim();
      console.log('[Title from HTML tag]:', title);
      
      if (title.includes(' - ')) {
        title = title.split(' - ')[0].trim();
      }
    }
    
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      bodyContent = bodyMatch[1].trim();
      console.log('[Body content extracted from HTML]');
    }
    
    bodyContent = bodyContent
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head>[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>/gi, '')
      .replace(/<\/body>/gi, '')
      .replace(/<meta[^>]*>/gi, '');
    
    bodyContent = bodyContent.replace(/^```(?:html|HTML)?\s*\n?/gm, '');
    bodyContent = bodyContent.replace(/\n?```\s*$/gm, '');
    
    if (!title || title.length < 10 || title === '導入') {
      const h1Match = bodyContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match) {
        title = h1Match[1].replace(/<[^>]*>/g, '').trim();
        console.log('[Title from H1]:', title);
      }
      
      if (!title || title === '導入') {
        const h2Matches = bodyContent.match(/<h2[^>]*>([^<]+)<\/h2>/gi);
        if (h2Matches) {
          for (const h2Match of h2Matches) {
            const h2Text = h2Match.replace(/<[^>]*>/g, '').trim();
            if (h2Text && h2Text !== '導入' && h2Text !== 'まとめ' && h2Text.length > 10) {
              title = h2Text;
              console.log('[Title from H2]:', title);
              break;
            }
          }
        }
      }
      
      if (!title || title === '導入') {
        const mdTitleMatch = bodyContent.match(/^#\s+(.+)$/m);
        if (mdTitleMatch) {
          title = mdTitleMatch[1].trim();
          console.log('[Title from Markdown]:', title);
        }
      }
      
      if (!title || title === '導入') {
        const bracketMatch = bodyContent.match(/【[^】]+】[^<\n]+/);
        if (bracketMatch) {
          title = bracketMatch[0].trim();
          console.log('[Title from Brackets]:', title);
        }
      }
    }
    
    if (!title || title.length < 10 || title === '導入') {
      console.log('[Warning] No valid title found, generating default');
      title = this.generateDefaultTitle(category);
    }
    
    if (title.length > 60) {
      title = title.substring(0, 57) + '...';
    }
    
    bodyContent = bodyContent
      .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
      .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
      .replace(/^#\s+(.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^\*\s+(.+)$/gm, '<li>$1</li>');
    
    bodyContent = bodyContent.replace(/(<li>.*?<\/li>\s*)+/gs, (match) => {
      return '<ul>' + match + '</ul>';
    });
    
    if (!bodyContent.includes('<h2>') && !bodyContent.includes('<h3>')) {
      console.log('[Adding structure] No H2/H3 tags found, adding default structure');
      
      const paragraphs = bodyContent.split('\n\n').filter(p => p.trim());
      if (paragraphs.length >= 3) {
        bodyContent = `
<h2>はじめに</h2>
<p>${paragraphs[0]}</p>

<h3>主要なポイント</h3>
<p>${paragraphs[1] || paragraphs[0]}</p>

<h3>詳細な解説</h3>
<p>${paragraphs[2] || paragraphs[1] || paragraphs[0]}</p>

<h2>まとめ</h2>
<p>${paragraphs[paragraphs.length - 1]}</p>`;
      }
    }
    
    if (!bodyContent || bodyContent.length < 100) {
      console.log('[Warning] Body content too short, using full content');
      bodyContent = content;
    }
    
    const plainText = bodyContent.replace(/<[^>]*>/g, '').trim();
    const excerpt = plainText.substring(0, 150) + '...';
    
    console.log('[parseGPTResponse Result]', {
      titleLength: title.length,
      contentLength: bodyContent.length,
      hasTitle: title !== this.generateDefaultTitle(category),
      hasH2: bodyContent.includes('<h2>'),
      hasH3: bodyContent.includes('<h3>'),
      category: category
    });
    
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

  // ===== 残りの既存メソッドもそのまま維持 =====
  
  async generateWithGPT(category, template) {
    // 既存のコードをそのまま維持
    const now = Date.now();
    const timeSinceLastCall = now - this.lastAPICall;
    if (timeSinceLastCall < this.minTimeBetweenCalls) {
      const waitTime = this.minTimeBetweenCalls - timeSinceLastCall;
      console.log(`[Rate Limit Prevention] Waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastAPICall = Date.now();
    
    const categoryName = this.getCategoryName(category);
    const topics = template.topics || this.getDefaultTopics(category);
    const selectedTopic = topics[Math.floor(Math.random() * topics.length)];
    
    const now2 = new Date();
    const month = now2.getMonth() + 1;
    const year = now2.getFullYear();
    const season = this.getCurrentSeason(month);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][now2.getDay()];
    
    const prompt = `
${categoryName}の専門ライターとして、SEOに最適化された記事を作成してください。

【基本情報】
- 現在: ${year}年${month}月
- トピック: ${selectedTopic}
- 季節: ${season}

【重要な指示】
- HTMLのDOCTYPE、html、head、bodyタグは含めないでください
- 記事本文のみを出力してください
- 最初に魅力的なタイトルを1行で書いてください

【必須要件】
- 最低2000文字以上
- 以下の構造で記事を作成：

【タイトル】（1行目、60文字以内、【】や数字を含めて魅力的に）

<h2>導入</h2>
<p>300文字以上の導入文...</p>

<h3>詳細セクション1</h3>
<p>400文字以上...</p>

<h3>詳細セクション2</h3>
<p>400文字以上...</p>

<h3>詳細セクション3</h3>
<p>400文字以上...</p>

<h2>まとめ</h2>
<p>300文字以上...</p>

※HTMLのheadタグやmetaタグは不要です。記事本文のみ出力してください。`;

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
              content: `あなたは${categoryName}専門のWebライターです。HTMLのheadタグやDOCTYPEは含めず、記事本文のみを作成します。最初の行に必ずタイトルを書いてください。`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4500,
          presence_penalty: 0.3,
          frequency_penalty: 0.3
        });

        const content = response.choices[0].message.content;
        
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
        
        if (error.status === 429) {
          const waitTime = Math.min(60000, Math.pow(2, attempt) * 5000);
          console.log(`[429エラー] ${waitTime/1000}秒待機します`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    console.error('GPT生成に完全失敗、強化版フォールバックを使用');
    return this.generateEnhancedFallback(category, selectedTopic);
  }

  // ===== 以下、すべての既存メソッドをそのまま維持 =====
  
  getSeasonalContext(season, category) {
    // 既存のコードをそのまま維持
    const contexts = {
      '冬': {
        anime: '冬アニメの新作情報、年末年始特番、コミケ情報',
        game: '年末商戦、ゲームアワード、福袋情報',
        movie: 'アカデミー賞候補作、年末年始の大作映画',
        music: '紅白歌合戦、年間ランキング、冬フェス',
        tech: 'CES発表、年末商戦、新年の技術トレンド',
        beauty: '冬の乾燥対策、クリスマスコフレ、年末パーティーメイク',
        food: 'おせち料理、冬の温活グルメ、年末年始の特別メニュー',
        entertainment: '年末特番、紅白歌合戦、新年の芸能界',
        selfhelp: '新年の目標設定、年末の振り返り、習慣化'
      },
      '春': {
        anime: '春アニメ新番組、卒業・入学シーズン作品',
        game: '新生活応援セール、春の新作ラッシュ',
        movie: '春休み映画、卒業シーズン作品',
        music: '卒業ソング、春フェス、新人アーティスト',
        tech: '新生活ガジェット、春の新製品',
        beauty: '春の新作コスメ、花粉症対策スキンケア',
        food: '花見弁当、春野菜レシピ、新メニュー',
        entertainment: '春の改編、新番組スタート',
        selfhelp: '新生活の人間関係、新年度の目標'
      },
      '夏': {
        anime: '夏アニメ、夏休み特別編、海・プール回',
        game: '夏休み向けゲーム、e-sports夏大会',
        movie: '夏の大作映画、ホラー映画',
        music: '夏フェス、花火大会BGM、夏ソング',
        tech: '夏のガジェット、Prime Day',
        beauty: '美白ケア、汗に強いメイク',
        food: '夏バテ対策レシピ、かき氷特集',
        entertainment: '24時間テレビ、夏の特番',
        selfhelp: '夏休みの自己投資、リフレッシュ法'
      },
      '秋': {
        anime: '秋アニメ、秋の夜長に見たい作品',
        game: '東京ゲームショウ、年末商戦前哨戦',
        movie: '秋の映画祭、芸術作品',
        music: '秋の音楽祭、紅葉シーズンBGM',
        tech: '新型iPhone、秋の新製品ラッシュ',
        beauty: '秋の新作コスメ、乾燥対策',
        food: '秋の味覚、新米シーズン',
        entertainment: '秋の改編、新番組',
        selfhelp: '秋の学び直し、年末に向けた準備'
      }
    };
    
    return contexts[season]?.[category] || '';
  }

  getCurrentSeason(month) {
    if (month >= 3 && month <= 5) return '春';
    if (month >= 6 && month <= 8) return '夏';
    if (month >= 9 && month <= 11) return '秋';
    return '冬';
  }

  validateGPTContent(content) {
    if (content.length < 1500) {
      console.log(`品質NG: 文字数不足 ${content.length}/1500`);
      return false;
    }
    
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
    
    const numberMatches = content.match(/\d+/g);
    if (!numberMatches || numberMatches.length < 3) {
      console.log(`品質NG: 具体的な数値不足`);
      return false;
    }
    
    return true;
  }

  escapeXML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  getTemplate(category) {
    if (this.templates && this.templates[category]) {
      return this.templates[category];
    }
    return this.getDefaultTemplate(category);
  }

  getDefaultTemplate(category) {
    const templates = {
      entertainment: {
        topics: ['最新の芸能ニュース', '話題のドラマ・バラエティ', '注目のタレント・俳優', 'エンタメ業界の裏話']
      },
      anime: {
        topics: ['今期の注目アニメ', '人気声優の最新情報', 'アニメ映画レビュー', '原作とアニメの違い']
      },
      game: {
        topics: ['新作ゲームレビュー', 'ゲーム攻略情報', 'eスポーツ最新情報', 'レトロゲーム特集']
      },
      movie: {
        topics: ['話題の新作映画', '映画館での体験', '名作映画の解説', '映画業界のトレンド']
      },
      music: {
        topics: ['新曲リリース情報', 'ライブ・コンサート情報', 'アーティストインタビュー', '音楽ストリーミング動向']
      },
      tech: {
        topics: ['最新ガジェットレビュー', 'AI・テクノロジートレンド', 'プログラミング入門', 'デジタルライフハック']
      },
      beauty: {
        topics: ['スキンケア最新情報', 'メイクアップトレンド', '美容成分の解説', 'セルフケア方法']
      },
      food: {
        topics: ['話題のレストラン', '簡単レシピ紹介', 'グルメトレンド', '食材の豆知識']
      },
      lifestyle: {
        topics: ['大人の恋愛心理学', '健康的な人間関係の築き方', 'パートナーとのコミュニケーション術', '大人向けライフスタイル情報']
      },
      selfhelp: {
        topics: ['コミュニケーション能力の向上方法', '信頼関係を築くコツ', '人間関係を良好にする方法', '効果的な会話術']
      }
    };
    
    return templates[category] || templates.entertainment;
  }

  getDefaultTopics(category) {
    const template = this.getDefaultTemplate(category);
    return template.topics;
  }

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

  generateTags(category) {
    const tagSets = {
      entertainment: ['エンタメ', '芸能', 'ニュース', '話題', '2025'],
      anime: ['アニメ', '声優', '新作', '2025年夏アニメ', 'おすすめ'],
      game: ['ゲーム', '新作', 'レビュー', '攻略', 'PS5'],
      movie: ['映画', '新作', 'レビュー', '興行収入', '2025'],
      music: ['音楽', '新曲', 'ランキング', 'ライブ', 'J-POP'],
      tech: ['テクノロジー', 'IT', 'ガジェット', 'AI', '最新技術'],
      beauty: ['美容', 'コスメ', 'スキンケア', 'メイク', 'トレンド'],
      food: ['グルメ', 'レシピ', 'レストラン', '料理', '食べ歩き'],
      lifestyle: ['大人向け', 'ライフスタイル', '恋愛', '人間関係', '自己啓発'],
      selfhelp: ['自己啓発', '人間関係', 'コミュニケーション', '心理学', '成長']
    };
    return tagSets[category] || tagSets.entertainment;
  }

  generateDefaultTitle(category) {
    const date = new Date().toLocaleDateString('ja-JP');
    const categoryName = this.getCategoryName(category);
    return `【${date}】${categoryName}の最新情報まとめ`;
  }

  generateEnhancedFallback(category, topic = null) {
    // 既存のコードをそのまま維持
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const season = this.getCurrentSeason(month);
    const categoryName = this.getCategoryName(category);
    
    const title = `【${year}年${month}月最新】${categoryName}業界の注目トレンド完全ガイド`;
    
    const content = `
<h2>はじめに：${year}年${month}月の${categoryName}最新動向</h2>
<p>${season}シーズンの${categoryName}業界は、今まさに大きな転換期を迎えています。最新のデータによると、前年同期比で市場規模は<strong>150%</strong>の成長を記録し、新規参入企業も<strong>50社</strong>を超えました。この記事では、業界の最新トレンドから今後の展望まで、詳しく解説していきます。</p>

<p>特に注目すべきは、技術革新による業界構造の変化です。AIやビッグデータの活用により、従来では考えられなかったサービスが次々と誕生しています。また、消費者のニーズも多様化し、より個別化されたサービスが求められるようになってきました。</p>

<h3>今月の注目トピック①：最新技術の導入による革新</h3>
<p>業界では新技術の導入により、従来の<strong>3倍</strong>の効率化を実現しています。特に注目されているのが、AIを活用した新しいアプローチです。これにより、作業時間が大幅に短縮され、品質も向上しています。</p>

<p>具体的な事例として、大手企業のA社では、AIを導入することで年間<strong>10億円</strong>のコスト削減に成功しました。また、中小企業でも導入が進んでおり、業界全体の底上げが期待されています。技術導入に関する投資額も前年比<strong>200%</strong>増加しており、今後もこの傾向は続くと予想されます。</p>

<p>さらに、技術導入による副次的な効果として、従業員の働き方改革も進んでいます。リモートワークの導入率は<strong>80%</strong>を超え、ワークライフバランスの改善にも貢献しています。</p>

<h3>今月の注目トピック②：大手企業の参入と市場の活性化</h3>
<p>大手企業の参入により、市場規模が<strong>1000億円</strong>を突破しました。これにより、業界全体が活性化し、競争も激化しています。特に、グローバル企業の参入により、国際的な競争力も高まっています。</p>

<p>B社の参入により、サービスの質が大幅に向上し、消費者満足度も<strong>85%</strong>という高い水準を記録しています。また、価格競争も適正化され、消費者にとってもメリットが大きい状況となっています。新規参入企業の中には、独自の技術を持つスタートアップも多く、イノベーションの加速が期待されます。</p>

<p>市場の成長に伴い、雇用も拡大しています。業界全体での新規雇用者数は前年比<strong>30%</strong>増加し、特に若年層の雇用が活発です。また、専門人材の需要も高まっており、教育機関との連携も強化されています。</p>

<h3>今月の注目トピック③：ユーザー数の急増と市場の拡大</h3>
<p>ユーザー数が<strong>500万人</strong>を超え、過去最高を更新しました。特に若年層での利用が急増しており、20代の利用率は<strong>70%</strong>を超えています。この背景には、サービスの使いやすさの向上と、価格の適正化があります。</p>

<p>地域別では、都市部だけでなく地方でも利用が拡大しており、全国的な普及が進んでいます。特に、地方創生の観点からも注目されており、地域経済の活性化にも貢献しています。海外展開も視野に入れており、アジア市場への進出を計画している企業も増えています。</p>

<p>ユーザーの満足度調査では、<strong>90%</strong>以上が「満足」または「非常に満足」と回答しており、リピート率も<strong>75%</strong>という高い水準を維持しています。今後もユーザー数の増加が見込まれ、市場規模のさらなる拡大が期待されます。</p>

<h3>業界の課題と対策：持続可能な成長に向けて</h3>
<p>急速な成長の一方で、いくつかの課題も浮き彫りになっています。まず、人材不足が深刻化しており、特に専門技術を持つ人材の確保が難しくなっています。この問題に対して、業界団体では教育プログラムの充実や、海外人材の活用などの対策を進めています。</p>

<p>また、環境への配慮も重要な課題となっています。SDGsへの取り組みとして、カーボンニュートラルを目指す企業が増えており、<strong>2030年</strong>までに業界全体でCO2排出量を<strong>50%</strong>削減する目標が掲げられています。具体的な取り組みとして、再生可能エネルギーの活用や、リサイクルシステムの構築などが進められています。</p>

<h3>技術トレンド：次世代技術の展望</h3>
<p>今後注目される技術トレンドとして、量子コンピューティングやブロックチェーン技術の活用が挙げられます。これらの技術により、セキュリティの向上や処理速度の飛躍的な向上が期待されています。すでに一部の企業では実証実験が始まっており、<strong>2026年</strong>には実用化される見込みです。</p>

<p>また、5G通信の普及により、リアルタイムでの大容量データ通信が可能となり、新たなサービスの創出が期待されています。IoT機器の普及も進んでおり、あらゆるものがインターネットに接続される時代が到来しています。これにより、ビッグデータの活用がさらに進み、より精度の高い予測や分析が可能となります。</p>

<h2>まとめ：今後の展望と準備すべきこと</h2>
<p>来月は更なる市場の拡大が予想されます。業界アナリストによると、新サービスの投入により、市場規模は<strong>前月比120%</strong>の成長が見込まれています。特に、秋のシーズンに向けた新商品の投入や、年末商戦に向けた準備が本格化することで、さらなる活性化が期待されます。</p>

<p>企業にとっては、この成長機会を最大限に活用するために、技術投資と人材育成が重要となります。また、消費者にとっても、サービスの選択肢が増え、より良いサービスを受けられる環境が整いつつあります。業界全体として、持続可能な成長を目指し、社会に貢献できる産業として発展していくことが期待されています。</p>

<p>最後に、${categoryName}業界の変化は私たちの生活にも大きな影響を与えています。今後も業界の動向に注目し、新しいトレンドをいち早くキャッチすることが重要です。この記事が、皆様の${categoryName}業界への理解を深める一助となれば幸いです。</p>`;
    
    return {
      title,
      content,
      excerpt: `${year}年${month}月の${categoryName}最新トレンドを徹底分析。業界の最新動向、注目企業、技術革新、市場予測まで完全網羅。専門家による詳細な解説付き。`,
      category,
      tags: [...this.generateTags(category), `${year}年`, `${month}月`, 'トレンド', '最新情報', '市場分析'],
      status: 'publish'
    };
  }

  setFeaturedImage(postId, attachmentId) {
    // 既存のコードをそのまま維持
    const xmlContent = `<?xml version="1.0"?>
<methodCall>
  <methodName>wp.editPost</methodName>
  <params>
    <param><value><int>1</int></value></param>
    <param><value><string>${this.wpUsername}</string></value></param>
    <param><value><string>${this.wpPassword}</string></value></param>
    <param><value><int>${postId}</int></value></param>
    <param>
      <value>
        <struct>
          <member>
            <name>post_thumbnail</name>
            <value><int>${attachmentId}</int></value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;
    
    return axios.post(
      `${this.wpUrl}/xmlrpc.php`,
      xmlContent,
      {
        headers: {
          'Content-Type': 'text/xml'
        }
      }
    ).then(response => {
      console.log(`✅ Post ${postId} にアイキャッチ画像 ${attachmentId} を設定`);
      return response.data;
    });
  }

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
