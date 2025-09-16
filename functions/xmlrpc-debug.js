// xmlrpc-debug-v2.js - より詳細なXML-RPCデバッグ
const https = require('https');
const http = require('http');

const WORDPRESS_URL = 'https://www.entamade.jp';
const WORDPRESS_USERNAME = 'entamade';
const WORDPRESS_PASSWORD = 'IChL 1yMu 4OUF YpL6 Wz8d oxln';

console.log('🔍 XML-RPC詳細デバッグ V2\n');

// 手動でXML-RPCリクエストを送信
function sendRawXmlRpcRequest() {
  console.log('📌 RAW XML-RPCリクエストを送信...\n');
  
  // 最もシンプルなXML-RPCリクエスト（system.listMethods）
  const xmlPayload = `<?xml version="1.0"?>
<methodCall>
  <methodName>system.listMethods</methodName>
  <params></params>
</methodCall>`;

  const options = {
    hostname: 'www.entamade.jp',
    port: 443,
    path: '/xmlrpc.php',
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      'Content-Length': Buffer.byteLength(xmlPayload),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  console.log('送信するXML:');
  console.log(xmlPayload);
  console.log('\n---\n');

  const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\nレスポンス (最初の1000文字):');
      console.log(data.substring(0, 1000));
      
      // HTMLが返されているかチェック
      if (data.includes('<html') || data.includes('<!DOCTYPE')) {
        console.log('\n⚠️ HTMLページが返されています！');
        
        // タイトルタグを抽出
        const titleMatch = data.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) {
          console.log('ページタイトル:', titleMatch[1]);
        }
        
        // エラーメッセージを探す
        if (data.includes('403') || data.includes('Forbidden')) {
          console.log('❌ 403 Forbidden - アクセスが拒否されています');
        }
        if (data.includes('security') || data.includes('blocked')) {
          console.log('❌ セキュリティによってブロックされています');
        }
        if (data.includes('Cloudflare')) {
          console.log('❌ Cloudflareによってブロックされている可能性があります');
        }
        
        console.log('\n対処法:');
        console.log('1. WordPress管理画面でXML-RPC設定を確認');
        console.log('2. セキュリティプラグインの設定を確認');
        console.log('3. .htaccessファイルを確認');
        console.log('4. サーバーのファイアウォール設定を確認');
        
      } else if (data.includes('<?xml')) {
        console.log('\n✅ XMLレスポンスが返されました');
        
        // 認証テストに進む
        testAuthentication();
      } else {
        console.log('\n❓ 予期しないレスポンス形式');
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ リクエストエラー:', e.message);
  });

  req.write(xmlPayload);
  req.end();
}

// 認証テスト
function testAuthentication() {
  console.log('\n📌 認証テスト（手動XML送信）\n');
  
  const xmlPayload = `<?xml version="1.0"?>
<methodCall>
  <methodName>wp.getUsersBlogs</methodName>
  <params>
    <param><value><string>${WORDPRESS_USERNAME}</string></value></param>
    <param><value><string>${WORDPRESS_PASSWORD}</string></value></param>
  </params>
</methodCall>`;

  const options = {
    hostname: 'www.entamade.jp',
    port: 443,
    path: '/xmlrpc.php',
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=UTF-8',
      'Content-Length': Buffer.byteLength(xmlPayload),
      'User-Agent': 'WordPress/6.0'
    }
  };

  const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\nレスポンス (最初の500文字):');
      console.log(data.substring(0, 500));
      
      if (data.includes('faultCode')) {
        const faultMatch = data.match(/<int>(\d+)<\/int>/);
        const faultString = data.match(/<string>(.*?)<\/string>/);
        if (faultMatch && faultString) {
          console.log('\n❌ エラーコード:', faultMatch[1]);
          console.log('エラーメッセージ:', faultString[1]);
          
          if (faultMatch[1] === '403') {
            console.log('\n認証情報が正しくないか、XML-RPCが無効化されています');
          }
        }
      } else if (data.includes('isAdmin')) {
        console.log('\n✅ 認証成功！');
      }
    });
  });

  req.write(xmlPayload);
  req.end();
}

// REST API テスト
function testRestAPI() {
  console.log('\n📌 REST APIテスト（代替手段）\n');
  
  const auth = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_PASSWORD}`).toString('base64');
  
  const options = {
    hostname: 'www.entamade.jp',
    port: 443,
    path: '/wp-json/wp/v2/users/me',
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'User-Agent': 'Mozilla/5.0'
    }
  };
  
  https.get(options, (res) => {
    console.log('REST API Status:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.id) {
          console.log('✅ REST API認証成功！');
          console.log('ユーザーID:', json.id);
          console.log('ユーザー名:', json.name);
          console.log('\nREST APIが使えるので、XML-RPCの代わりにREST APIを使用することをお勧めします。');
        } else {
          console.log('❌ REST API認証失敗');
          console.log(data);
        }
      } catch (e) {
        console.log('REST APIレスポンス:', data.substring(0, 500));
      }
    });
  });
}

// 実行
sendRawXmlRpcRequest();
setTimeout(testRestAPI, 3000);  // 3秒後にREST APIもテスト
