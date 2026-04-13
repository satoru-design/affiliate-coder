"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsDialog } from "@/components/settings-dialog";
import { toast } from "sonner";

interface ProductData {
  itemName: string;
  itemPrice: number;
  imageUrl: string;
  affiliateUrl: string;
  shopName: string;
}

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [amazonId, setAmazonId] = useState("strkkcogmailc-22");
  const [copied, setCopied] = useState(false);

  // Load Amazon ID from localStorage
  useEffect(() => {
    const id = localStorage.getItem("amazon_tracking_id");
    if (id !== null) setAmazonId(id);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword) return;

    // re-fetch amazonId just in case it was changed
    const currentAmazonId = localStorage.getItem("amazon_tracking_id");
    if (currentAmazonId !== null) setAmazonId(currentAmazonId);

    setLoading(true);
    setProduct(null);

    try {
      const res = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "検索に失敗しました");
      }
      setProduct(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("エラーが発生しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const getAmazonUrl = (productName: string) => {
    const baseUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(productName)}`;
    return amazonId ? `${baseUrl}&tag=${amazonId}` : baseUrl;
  };

  const generateHtmlContent = () => {
    if (!product) return "";
    const amzUrl = getAmazonUrl(keyword || product.itemName); // Use keyword preferred for broader search, or itemName
    
    // インラインスタイル多用のHTML
    return `
<div style="background:#fff; border:1px solid #f1f5f9; border-radius:8px; padding:24px; max-width:600px; margin:24px auto; font-family:sans-serif; box-shadow:0 1px 2px rgba(0,0,0,0.02); box-sizing:border-box;">
  <div style="display:flex; gap:24px; flex-wrap:wrap; align-items:center;">
    <div style="flex-shrink:0; margin:0 auto;">
      <a href="${product.affiliateUrl}" target="_blank" rel="noopener sponsored">
        <img src="${product.imageUrl}" alt="${product.itemName}" style="max-width:128px; height:auto; border-radius:4px; border:none;" />
      </a>
    </div>
    <div style="flex:1; min-width:200px;">
      <a href="${product.affiliateUrl}" target="_blank" rel="noopener sponsored" style="text-decoration:none; color:#0f172a; font-size:16px; font-weight:500; line-height:1.6; display:block;">
        ${product.itemName}
      </a>
      <div style="display:flex; gap:12px; margin-top:20px; flex-wrap:wrap;">
        <a href="${amzUrl}" target="_blank" rel="noopener sponsored" style="flex:1; min-width:120px; text-align:center; padding:10px 16px; border:1px solid #e69a00; border-radius:6px; color:#ffffff; text-decoration:none; font-size:14px; font-weight:500; background:#f5a623; transition:opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          Amazonで見る
        </a>
        <a href="${product.affiliateUrl}" target="_blank" rel="noopener sponsored" style="flex:1; min-width:120px; text-align:center; padding:10px 16px; border:1px solid #a80000; border-radius:6px; color:#ffffff; text-decoration:none; font-size:14px; font-weight:500; background:#bf0000; transition:opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          楽天で見る
        </a>
      </div>
    </div>
  </div>
</div>
`.trim();
  };

  const handleCopy = () => {
    const html = generateHtmlContent();
    navigator.clipboard.writeText(html);
    setCopied(true);
    toast.success("クリップボードにコピーしました");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Widget Generator</h1>
            <p className="text-sm text-slate-500 mt-1">Invisible Commerce Style</p>
          </div>
          <SettingsDialog />
        </header>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                placeholder="商品名やキーワードを入力..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                検索
              </Button>
            </form>
          </CardContent>
        </Card>

        {product && (
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">HTML Code</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-0">
              <Card className="border-slate-200 p-8 flex items-center justify-center bg-white/50">
                {/* プレビュー表示: 実際のHTML出力をそのまま dangerouslySetInnerHTML で流し込む */}
                <div dangerouslySetInnerHTML={{ __html: generateHtmlContent() }} className="w-full" />
              </Card>
            </TabsContent>

            <TabsContent value="code" className="mt-0">
              <Card className="border-slate-200 overflow-hidden flex flex-col">
                <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200">
                  <span className="text-xs font-mono text-slate-500">HTML / Inline CSS</span>
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied" : "Copy Code"}
                  </Button>
                </div>
                <div className="p-4 bg-slate-950 text-slate-50 overflow-x-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {generateHtmlContent()}
                  </pre>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
