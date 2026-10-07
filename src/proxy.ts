import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// ここは前段の振り分けだけを担う。
// Next.js の指針どおり、これは楽観的チェックであって唯一の防御線ではない。
// 実際の権限判定は各 Route Handler 側でも行う。
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const authenticated = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value
  );

  // ログイン済みでログイン画面に来たらトップへ戻す。
  if (pathname === "/login") {
    if (authenticated) {
      return NextResponse.redirect(new URL("/", request.nextUrl));
    }
    return NextResponse.next();
  }

  if (authenticated) {
    return NextResponse.next();
  }

  // API は画面遷移しないため、リダイレクトではなく 401 を返す。
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.nextUrl);
  // 遷移先はパスとクエリのみを引き継ぐ。外部ホストへは飛ばさない。
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // 認証系エンドポイントと静的アセットは除外する。
  matcher: [
    "/((?!api/login|api/logout|_next/static|_next/image|icon\\.jpg|apple-icon\\.jpg|favicon\\.ico).*)",
  ],
};
