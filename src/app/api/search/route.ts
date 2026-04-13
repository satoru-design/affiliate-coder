import { NextResponse } from "next/server";

const RAKUTEN_API_URL = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      { error: "Keyword parameter is required" },
      { status: 400 }
    );
  }

  const appId = process.env.RAKUTEN_APP_ID;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;

  if (!appId || !affiliateId) {
    return NextResponse.json(
      { error: "API configuration is missing" },
      { status: 500 }
    );
  }

  try {
    const params = new URLSearchParams({
      applicationId: appId,
      affiliateId: affiliateId,
      keyword: keyword,
      hits: "1", // 1件のみ取得
      sort: "standard", // 標準の関連度順
      imageFlag: "1", // 画像あり
    });

    const response = await fetch(`${RAKUTEN_API_URL}?${params.toString()}`, {
      cache: "no-store", // Next.jsのキャッシュを強制的に無効化
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Rakuten API Error:", errData);
      return NextResponse.json(
        { error: `楽天APIエラー: ${errData.error_description || errData.error || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.Items || data.Items.length === 0) {
      return NextResponse.json(
        { error: "No products found for the given keyword." },
        { status: 404 }
      );
    }

    const item = data.Items[0].Item;

    // 画像URLのHTTPS化とサイズ調整。できれば大きめの画像を。
    const imageUrl = item.mediumImageUrls?.[0]?.imageUrl?.replace("?_ex=128x128", "") 
      || item.smallImageUrls?.[0]?.imageUrl 
      || "";

    const productData = {
      itemName: item.itemName,
      itemPrice: item.itemPrice,
      imageUrl: imageUrl,
      affiliateUrl: item.affiliateUrl,
      shopName: item.shopName,
    };

    return NextResponse.json(productData);

  } catch (error) {
    console.error("Search API Exception:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
