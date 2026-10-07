// 単一ユーザー向けのパスワード認証。
// 依存を増やさず Web Crypto だけで署名付きセッションを組む。
// proxy.ts（Edge）と Route Handler（Node）の両方から読まれるため、
// グローバルへのキャッシュは行わず毎回鍵をインポートする。

export const SESSION_COOKIE = "ac_session";

// セッションの有効期間。7日。
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// パスワードの最低長。これを下回る設定は総当たりに耐えないため拒否する。
const MIN_PASSWORD_LENGTH = 12;

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    const bytes = new Uint8Array(new ArrayBuffer(binary.length));
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function importSigningKey(): Promise<CryptoKey | null> {
  const secret = process.env.SESSION_SECRET;
  // 秘密が未設定なら署名も検証もできない。fail closed にする。
  if (!secret || secret.length < 32) return null;
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** ログイン成功時に発行する署名付きトークンを返す。 */
export async function createSessionToken(): Promise<string | null> {
  const key = await importSigningKey();
  if (!key) return null;

  const payload = toBase64Url(
    encoder.encode(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }))
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * Cookie のトークンを検証する。
 * 署名の照合は crypto.subtle.verify に任せるため比較は定数時間になる。
 */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;

  const key = await importSigningKey();
  if (!key) return false;

  const signatureBytes = fromBase64Url(signature);
  if (!signatureBytes) return false;

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(payload)
  );
  if (!valid) return false;

  // 署名が正しいことを確認してから中身を読む。
  const payloadBytes = fromBase64Url(payload);
  if (!payloadBytes) return false;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(payloadBytes));
    return typeof parsed?.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

/**
 * 入力パスワードを照合する。
 * 固定長のハッシュ同士を全バイト走査で比較し、長さと一致位置を漏らさない。
 */
export async function verifyPassword(input: string): Promise<boolean> {
  const expected = process.env.APP_PASSWORD;
  // パスワード未設定、または短すぎる場合は誰も通さない。
  if (!expected || expected.length < MIN_PASSWORD_LENGTH) return false;

  const [a, b] = await Promise.all([sha256(input), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** 認証に必要な環境変数が揃っているか。設定漏れの切り分け用。 */
export function isAuthConfigured(): boolean {
  const secret = process.env.SESSION_SECRET;
  const password = process.env.APP_PASSWORD;
  return Boolean(
    secret && secret.length >= 32 && password && password.length >= MIN_PASSWORD_LENGTH
  );
}
