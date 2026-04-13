"use client";

import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { toast } from "sonner";

export function SettingsDialog() {
  const [amazonId, setAmazonId] = useState("strkkcogmailc-22");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // コンポーネントマウント時にLocalStorageから読み込む
    const savedId = localStorage.getItem("amazon_tracking_id");
    if (savedId !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmazonId(savedId);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("amazon_tracking_id", amazonId);
    setOpen(false);
    toast("設定を保存しました", {
      description: "AmazonトラッキングIDが更新されました。",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: "outline", size: "icon" })}>
        <Settings className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
          <DialogDescription>
            アフィリエイトのトラッキングIDを設定します。この情報はブラウザにのみ保存されます。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amazon" className="text-right">
              Amazon ID
            </Label>
            <Input
              id="amazon"
              placeholder="your-id-22"
              value={amazonId}
              onChange={(e) => setAmazonId(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>保存する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
