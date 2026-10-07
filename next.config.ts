import type { NextConfig } from "next";

// セキュリティヘッダ。
// script-src / style-src / img-src / default-src は意図的に入れていない。
// それらを足すには nonce が必要で、nonce はページの動的レンダリングを前提とする。
// 現在 / と /login は静的生成のため、nonce とヘッダが食い違ってスクリプトが
// 全て落ちる。あわせてウィジェットのプレビューは inline style に依存している。
// ここでは破壊リスクのない指令だけを有効にしている。
const CSP_DIRECTIVES = [
  // クリックジャッキング対策。外部サイトからの frame 埋め込みを禁止する。
  "frame-ancestors 'none'",
  // <object> / <embed> を禁止する。このアプリは使っていない。
  "object-src 'none'",
  // <base> の差し込みで相対URLの解決先を奪われるのを防ぐ。
  "base-uri 'self'",
  // フォームの送信先を自サイトに限定する。
  "form-action 'self'",
  // http のサブリソース参照を https に引き上げる。
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
  // MIME スニッフィングを止める。JSON応答をHTMLとして解釈されるのを防ぐ。
  { key: "X-Content-Type-Options", value: "nosniff" },
  // frame-ancestors を解さない古いブラウザ向け。
  { key: "X-Frame-Options", value: "DENY" },
  // 検索キーワードを含むURLが外部サイトのRefererに乗るのを防ぐ。
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 常時HTTPS。preload は申請を伴うため付けない。
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
