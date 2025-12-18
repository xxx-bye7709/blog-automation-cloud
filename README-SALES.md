# 📝 Blog Automation System v1.0

WordPress自動投稿システムへようこそ！

## 🚀 クイックスタート

### 必要環境
- Node.js 18以上
- Firebaseアカウント（無料でOK）
- WordPress 5.0以上（XML-RPC有効）
- OpenAI APIキー

### インストール手順

#### 1. ファイルを解凍
```bash
unzip blog-automation-system.zip
cd blog-automation-system
```

#### 2. 依存関係をインストール
```bash
npm install
```

#### 3. セットアップウィザードを実行
```bash
npm run setup
```
画面の指示に従って、以下を入力してください：
- ライセンスキー
- メールアドレス
- Firebase設定
- WordPress情報
- OpenAI APIキー

#### 4. Firebaseにデプロイ
```bash
firebase deploy --only functions
```

#### 5. 動作確認
```bash
npm run test-connection
```

## 📖 基本的な使い方

### 記事を生成する

#### コマンドラインから
```bash
# エンタメ記事を生成
npm run generate -- --category entertainment

# キーワード指定で生成
npm run generate -- --keyword "最新ゲーム" --category game
```

#### APIエンドポイント
```javascript
// 記事生成
POST https://[YOUR-REGION]-[PROJECT-ID].cloudfunctions.net/generateArticle
{
  "category": "entertainment",
  "keyword": "トレンド",
  "autoPost": true
}

// 商品レビュー生成
POST https://[YOUR-REGION]-[PROJECT-ID].cloudfunctions.net/generateProductReview
{
  "products": [...],
  "keyword": "おすすめ",
  "autoPost": true
}
```

### 管理画面を使う
```bash
npm run dashboard
```
ブラウザで http://localhost:3000 を開いてください。

## 🔧 設定ファイル

### user-config.json の構成
```json
{
  "license": {
    "key": "あなたのライセンスキー",
    "email": "your@email.com"
  },
  "wordpress": {
    "sites": [
      {
        "id": "site_001",
        "name": "メインサイト",
        "url": "https://your-site.com",
        "username": "admin",
        "password": "アプリケーションパスワード"
      }
    ]
  }
}
```

### 複数サイトの追加
```json
"sites": [
  {
    "id": "site_001",
    "name": "メインサイト",
    "url": "https://site1.com",
    "isDefault": true
  },
  {
    "id": "site_002", 
    "name": "サブサイト",
    "url": "https://site2.com",
    "isDefault": false
  }
]
```

## 📊 ライセンスタイプ別機能

| 機能 | LITE | PRO | ENT |
|------|------|-----|-----|
| サイト数 | 1 | 5 | 無制限 |
| 記事/日 | 10 | 50 | 無制限 |
| 記事/月 | 300 | 1,500 | 無制限 |
| 自動スケジュール | ❌ | ✅ | ✅ |
| 画像生成 | ❌ | ✅ | ✅ |
| DMM API | ❌ | ✅ | ✅ |
| サポート期間 | 30日 | 90日 | 365日 |

## ⚠️ トラブルシューティング

### WordPress接続エラー
```
エラー: WordPress接続に失敗しました
```
**解決方法:**
1. WordPressの管理画面でアプリケーションパスワードを再生成
2. プラグインでXML-RPCがブロックされていないか確認
3. .htaccessでアクセス制限がないか確認

### OpenAI APIエラー
```
エラー: OpenAI API呼び出しに失敗
```
**解決方法:**
1. APIキーが正しいか確認
2. 使用制限に達していないか確認
3. 課金状況を確認

### Firebase デプロイエラー
```
エラー: Firebase functions deployment failed
```
**解決方法:**
1. `firebase login` でログイン
2. 正しいプロジェクトを選択: `firebase use [PROJECT-ID]`
3. 課金設定を確認（Blazeプラン必須）

## 📞 サポート

### メールサポート
- support@blog-automation.com
- 営業時間: 平日 10:00-18:00
- 返信目安: 24時間以内

### よくある質問
https://docs.blog-automation.com/faq

### アップデート情報
https://blog-automation.com/updates

## 📜 利用規約

- 1ライセンスにつき1サイトでの利用
- 再配布・転売禁止
- ソースコードの改変は自己責任

## 🔄 アップデート方法

新バージョンがリリースされた場合：
```bash
# バックアップを作成
cp -r . ../backup-$(date +%Y%m%d)

# 新バージョンをダウンロード・解凍
unzip blog-automation-system-v1.1.zip

# user-config.json を復元
cp ../backup-*/user-config.json .

# 再デプロイ
firebase deploy --only functions
```

## 📝 更新履歴

### v1.0.0 (2024-01-01)
- 初回リリース
- 基本機能実装
- 3つのライセンスタイプ

---
© 2024 Blog Automation System. All rights reserved.
