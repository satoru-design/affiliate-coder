"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

// オープンリダイレクト対策。
// 前方一致での判定は正規化の差で抜けるため、実際にURLとして解決し、
// オリジンが変わらないものだけを許可する。
// これで //evil.example、/\evil.example、https://evil.example を弾く。
function safeNextPath(value: string | null): string {
  if (!value) return "/";
  try {
    const origin = window.location.origin;
    const resolved = new URL(value, origin);
    // 解決後のオリジンが変わるものは外部サイト。
    if (resolved.origin !== origin) return "/";
    // ログイン画面へ戻す指定は無限ループになるため落とす。
    if (resolved.pathname.startsWith("/login")) return "/";
    return `${resolved.pathname}${resolved.search}`;
  } catch {
    return "/";
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "ログインに失敗しました。");
        return;
      }

      setPassword("");
      router.replace(safeNextPath(searchParams.get("next")));
      router.refresh();
    } catch {
      setError("通信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 w-full max-w-sm">
      <CardContent className="p-6">
        <h1 className="text-xl font-bold text-slate-800">Widget Generator</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          続けるにはパスワードを入力してください。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !password}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            ログイン
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  // useSearchParams を使うため Suspense で包む。
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
      <Suspense
        fallback={<Card className="border-slate-200 w-full max-w-sm h-64" />}
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
