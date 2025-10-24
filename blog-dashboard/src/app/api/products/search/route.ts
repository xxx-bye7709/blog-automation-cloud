import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const siteId = searchParams.get('siteId') || 'entamade_jp';
    const limit = searchParams.get('limit') || '20';

    console.log('Searching products:', { query, siteId, limit });

    // マルチサイト対応APIを使用
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/searchProductsMultiSite`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keyword: query,
          siteId: siteId,
          limit: parseInt(limit),
          page: 1
        })
      }
    );

    const data = await response.json();

    if (!data.success) {
      // DMM APIエラーの場合でも空配列を返す
      return NextResponse.json({
        success: false,
        products: [],
        total: 0,
        query: query,
        message: data.error || 'DMM API is currently unavailable'
      });
    }

    // レスポンスを正規化
    const products = (data.products || []).map((product: any) => ({
      id: product.contentId || product.content_id || Math.random().toString(36),
      content_id: product.contentId || product.content_id,
      title: product.title || '',
      price: product.price || '価格不明',
      affiliateURL: product.affiliateUrl || product.affiliateURL || '',
      imageURL: {
        large: product.imageUrl || '',
        small: product.imageUrl || ''
      },
      description: product.description || '',
      rating: product.rating || 0,
      maker: product.maker || ''
    }));

    return NextResponse.json({
      success: true,
      products: products,
      total: data.totalCount || products.length,
      query: query,
      siteName: data.siteName
    });

  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        products: []
      },
      { status: 500 }
    );
  }
}