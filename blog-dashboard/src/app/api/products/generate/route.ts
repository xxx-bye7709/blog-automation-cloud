// マルチサイト対応版
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { products, keyword, targetSiteId, autoPost = true } = body;

    console.log('Generating article for site:', targetSiteId);
    console.log('Products count:', products?.length);

    if (!targetSiteId) {
      return NextResponse.json(
        { success: false, error: 'Target site ID is required' },
        { status: 400 }
      );
    }

    // 商品データの正規化
    const normalizedProducts = products.map((product: any) => ({
      title: product.title || '',
      price: product.price || '',
      affiliateUrl: product.affiliateURL || product.affiliateUrl || '',
      imageUrl: product.imageURL?.large || product.imageURL?.small || product.imageUrl || '',
      videoUrl: product.videoUrl || null,
      contentId: product.contentId || product.content_id || null,
      hasVideo: product.hasVideo || false,
      rating: product.rating || '4.5',
      description: product.description || '',
      maker: product.maker || ''
    }));

    // マルチサイト対応APIを呼び出し
    const wpResponse = await fetch(
      `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/generateProductReviewMultiSite`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSiteId: targetSiteId,  // サイトID追加
          products: normalizedProducts,
          keyword: keyword || 'レビュー',
          autoPost: autoPost
        })
      }
    );

    const wpResult = await wpResponse.json();

    if (wpResult.success) {
      return NextResponse.json({
        success: true,
        title: wpResult.title,
        postId: wpResult.postId,
        postUrl: wpResult.postUrl,
        site: wpResult.site,
        message: wpResult.message
      });
    } else {
      // APIエラーが発生した場合
      console.error('WordPress API error:', wpResult);
      
      // DMM APIが停止中の場合のメッセージ
      if (wpResult.error && wpResult.error.includes('DMM')) {
        return NextResponse.json({
          success: false,
          error: 'DMM APIが現在利用できません。APIが復旧次第、記事生成が可能になります。'
        });
      }
      
      return NextResponse.json({
        success: false,
        error: wpResult.error || '記事生成に失敗しました'
      });
    }

  } catch (error) {
    console.error('Article generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}