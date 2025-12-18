// functions/lib/config-manager.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ConfigManager {
  constructor() {
    this.configPath = path.join(__dirname, '../../user-config.json');
    this.config = null;
    this.licenseStatus = null;
  }

  /**
   * 設定ファイルを読み込み
   */
  loadConfig() {
    try {
      // ユーザー設定ファイルが存在するかチェック
      if (!fs.existsSync(this.configPath)) {
        throw new Error(`
        ⚠️ 設定ファイルが見つかりません！
        
        1. config-template.json を user-config.json にコピーしてください
        2. user-config.json を編集して、あなたの情報を入力してください
        3. 再度実行してください
        
        コマンド: cp config-template.json user-config.json
        `);
      }

      // 設定ファイルを読み込み
      const configData = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configData);

      // 必須項目のチェック
      this.validateConfig();

      // ライセンスの検証
      this.validateLicense();

      console.log('✅ 設定ファイルが正常に読み込まれました');
      console.log(`📍 サイト数: ${this.config.wordpress?.sites?.length || 0}`);
      console.log(`🔑 ライセンス: ${this.maskLicenseKey(this.config.license?.key)}`);

      return this.config;

    } catch (error) {
      console.error('❌ 設定ファイルの読み込みエラー:', error.message);
      throw error;
    }
  }

  /**
   * 設定の妥当性チェック
   */
  validateConfig() {
    const errors = [];

    // ライセンス情報のチェック
    if (!this.config.license?.key) {
      errors.push('ライセンスキーが設定されていません');
    }
    if (!this.config.license?.email) {
      errors.push('メールアドレスが設定されていません');
    }

    // WordPress設定のチェック
    if (!this.config.wordpress?.sites || this.config.wordpress.sites.length === 0) {
      errors.push('WordPressサイトが設定されていません');
    } else {
      this.config.wordpress.sites.forEach((site, index) => {
        if (!site.url) errors.push(`サイト${index + 1}: URLが設定されていません`);
        if (!site.username) errors.push(`サイト${index + 1}: ユーザー名が設定されていません`);
        if (!site.password) errors.push(`サイト${index + 1}: パスワードが設定されていません`);
      });
    }

    // API設定のチェック
    if (!this.config.api_keys?.openai?.key) {
      errors.push('OpenAI APIキーが設定されていません');
    }

    if (errors.length > 0) {
      throw new Error(`
      ⚠️ 設定エラー:
      ${errors.map(e => `  - ${e}`).join('\n')}
      
      user-config.json を編集して、必要な情報を入力してください。
      `);
    }
  }

  /**
   * ライセンスキーの検証（簡易版）
   */
  validateLicense() {
    const { key, email } = this.config.license;
    
    // ライセンスキーフォーマットのチェック
    const validFormat = /^BAS-(LITE|PRO|ENT)-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!validFormat.test(key)) {
      throw new Error('無効なライセンスキー形式です');
    }

    // ライセンスタイプの判定
    const type = key.split('-')[1];
    
    // メールアドレスとキーのハッシュ検証（簡易版）
    const hash = crypto.createHash('md5').update(email + key).digest('hex');
    const checksum = hash.substring(0, 4).toUpperCase();
    
    // ライセンスタイプによる機能制限を設定
    this.licenseStatus = {
      valid: true,
      type: type,
      email: email,
      features: this.getFeaturesByType(type),
      checksum: checksum
    };

    console.log(`✅ ライセンス認証成功: ${type}版`);
    return this.licenseStatus;
  }

  /**
   * ライセンスタイプによる機能制限
   */
  getFeaturesByType(type) {
    const features = {
      'LITE': {
        maxSites: 1,
        maxArticlesPerDay: 10,
        maxArticlesPerMonth: 300,
        hasAutoSchedule: false,
        hasImageGeneration: false,
        hasDmmApi: false,
        supportDays: 30
      },
      'PRO': {
        maxSites: 5,
        maxArticlesPerDay: 50,
        maxArticlesPerMonth: 1500,
        hasAutoSchedule: true,
        hasImageGeneration: true,
        hasDmmApi: true,
        supportDays: 90
      },
      'ENT': {
        maxSites: 999,
        maxArticlesPerDay: 999,
        maxArticlesPerMonth: 99999,
        hasAutoSchedule: true,
        hasImageGeneration: true,
        hasDmmApi: true,
        supportDays: 365
      }
    };

    return features[type] || features['LITE'];
  }

  /**
   * ライセンスキーをマスク表示
   */
  maskLicenseKey(key) {
    if (!key) return 'NOT SET';
    const parts = key.split('-');
    if (parts.length < 4) return 'INVALID';
    return `${parts[0]}-${parts[1]}-****-${parts[3]}`;
  }

  /**
   * WordPress設定を取得
   */
  getWordPressSite(siteId = null) {
    const sites = this.config?.wordpress?.sites || [];
    
    if (siteId) {
      return sites.find(s => s.id === siteId);
    }
    
    // デフォルトサイトを返す
    return sites.find(s => s.isDefault) || sites[0];
  }

  /**
   * 全WordPressサイトを取得
   */
  getAllWordPressSites() {
    return this.config?.wordpress?.sites || [];
  }

  /**
   * OpenAI設定を取得
   */
  getOpenAIConfig() {
    return {
      apiKey: this.config?.api_keys?.openai?.key,
      model: this.config?.api_keys?.openai?.model || 'gpt-4o-mini'
    };
  }

  /**
   * DMM API設定を取得
   */
  getDMMConfig() {
    const dmmConfig = this.config?.api_keys?.dmm;
    
    // ライセンスでDMM APIが無効な場合
    if (!this.licenseStatus?.features?.hasDmmApi) {
      return {
        enabled: false,
        message: 'このライセンスではDMM APIは使用できません'
      };
    }
    
    return {
      enabled: dmmConfig?.enabled || false,
      apiId: dmmConfig?.api_id,
      affiliateId: dmmConfig?.affiliate_id
    };
  }

  /**
   * 記事生成制限をチェック
   */
  async checkArticleLimit(count = 1) {
    const features = this.licenseStatus?.features;
    if (!features) return { allowed: false, message: 'ライセンスが無効です' };

    // 今日の投稿数を取得（実装は簡略化）
    const todayCount = await this.getTodayArticleCount();
    
    if (todayCount + count > features.maxArticlesPerDay) {
      return {
        allowed: false,
        message: `1日の投稿制限（${features.maxArticlesPerDay}記事）に達しました`,
        remaining: features.maxArticlesPerDay - todayCount
      };
    }

    return {
      allowed: true,
      remaining: features.maxArticlesPerDay - todayCount
    };
  }

  /**
   * 今日の記事投稿数を取得（簡易実装）
   */
  async getTodayArticleCount() {
    // 実際にはFirestoreから取得
    // ここでは簡略化のため0を返す
    return 0;
  }

  /**
   * 設定を更新
   */
  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    console.log('✅ 設定が更新されました');
  }

  /**
   * 機能が利用可能かチェック
   */
  hasFeature(featureName) {
    return this.licenseStatus?.features?.[featureName] || false;
  }
}

// シングルトンパターンで実装
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new ConfigManager();
    }
    return instance;
  },
  ConfigManager
};
