import { NextResponse } from "next/server";

const RAKUTEN_API_URL = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

// 楽天APIの keyword 上限に合わせた長さ制限。サーバー側で必ず検証する。
const MAX_KEYWORD_LENGTH = 128;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim();

  if (!keyword) {
    return NextResponse.json(
      { error: "Keyword parameter is required" },
      { status: 400 }
    );
  }

  if (keyword.length > MAX_KEYWORD_LENGTH) {
    return NextResponse.json(
      { error: `キーワードは${MAX_KEYWORD_LENGTH}文字以内で指定してください。` },
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
      // 上流のエラー本文はクライアントに返さない。
      // バックエンド構成や資格情報の状態が推測できる情報源になるため、
      // 詳細はサーバーログだけに残し、利用者には汎用メッセージを返す。
      const errData = await response.json().catch(() => ({}));
      console.error("Rakuten API Error:", response.status, errData);

      if (response.status === 429) {
        return NextResponse.json(
          { error: "現在混み合っています。しばらくしてから再試行してください。" },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "商品情報の取得に失敗しました。" },
        { status: 502 }
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
