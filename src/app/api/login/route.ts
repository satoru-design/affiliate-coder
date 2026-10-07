import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  isAuthConfigured,
  verifyPassword,
} from "@/lib/auth";

// 総当たりの試行間隔を空けるための簡易スロットル。
// プロセス内のみの記録なので、サーバーレスでは完全な制限にはならない。
// 恒久的な対策は外部ストア（Vercel KV など）での共有が必要。
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; firstAt: number }>();

function clientKey(request: Request): string {
  // Vercel が付与する実クライアントIP。無い場合はまとめて1枠として扱う。
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function throttled(key: string): boolean {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now - record.firstAt > ATTEMPT_WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return false;
  }
  record.count += 1;
  return record.count > MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    // 設定漏れで誰でも通る状態を作らない。
    console.error("Auth is not configured: SESSION_SECRET / APP_PASSWORD");
    return NextResponse.json(
      { error: "サーバーの認証設定が未完了です。" },
      { status: 503 }
    );
  }

  if (throttled(clientKey(request))) {
    return NextResponse.json(
      { error: "試行回数が多すぎます。しばらく待ってから再試行してください。" },
      { status: 429 }
    );
  }

  let password: unknown;
  try {
    const body = await request.json();
    password = body?.password;
  } catch {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  if (typeof password !== "string" || password.length === 0 || password.length > 256) {
    return NextResponse.json({ error: "パスワードを入力してください。" }, { status: 400 });
  }

  if (!(await verifyPassword(password))) {
    // 失敗理由は区別せず、同じ文面を返す。
    return NextResponse.json({ error: "パスワードが違います。" }, { status: 401 });
  }

  const token = await createSessionToken();
  if (!token) {
    return NextResponse.json(
      { error: "サーバーの認証設定が未完了です。" },
      { status: 503 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
