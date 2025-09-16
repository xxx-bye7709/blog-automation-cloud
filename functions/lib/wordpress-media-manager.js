const fetch = require('node-fetch');

class WordPressMediaManager {
  constructor(config = {}) {
    this.url = config.url || process.env.WORDPRESS_URL;
    this.username = config.username || process.env.WORDPRESS_USERNAME;
    this.password = config.password || process.env.WORDPRESS_PASSWORD;
  }

  async uploadImage(imageUrl, filename) {
    try {
      console.log('Uploading image to WordPress:', filename);
      
      if (!this.url || !this.username || !this.password) {
        console.warn('WordPress credentials not configured');
        return null;
      }

      // 画像をダウンロード
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.buffer();
      
      // WordPressにアップロード
      const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      
      const response = await fetch(`${this.url}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': 'image/jpeg'
        },
        body: buffer
      });

      if (response.ok) {
        const data = await response.json();
        return data.id;
      }
      
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }
}

module.exports = WordPressMediaManager;
