"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Check, AlertCircle, Search } from "lucide-react";

interface CheckResult {
  type: "success" | "error";
  messages: string[];
}

export default function InventoryCheckPage() {
  const [shop, setShop] = useState("楽天市場");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);

  const handleCheck = () => {
    if (!code) return;
    if (code.startsWith("WEP")) {
      setResult({
        type: "success",
        messages: [
          "在庫連携可能な状態です。",
          `店舗: ${shop}`,
          `自社商品コード: ${code}`,
          "モール側商品: 紐付け済み",
          "フリー在庫数: 25個",
          "最終連携日時: 2026/04/13 18:55",
        ],
      });
    } else {
      setResult({
        type: "error",
        messages: [
          "商品が登録されていません。",
          `指定されたコード "${code}" は本システムに存在しません。`,
          "対応: 商品マスタに登録するか、商品コード紐づけ画面で関連付けを行ってください。",
        ],
      });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">在庫連携確認</h1>
        <p className="text-sm text-gray-500 mt-1">店舗と商品コードを指定して、在庫連携の状況を確認します。</p>
      </div>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">確認したい商品を指定</h2>
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-3 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">店舗</label>
            <select
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option>楽天市場</option>
              <option>Amazon</option>
              <option>Yahoo!ショッピング</option>
              <option>Shopify</option>
            </select>
          </div>
          <div className="col-span-7 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">商品コード</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="自社商品コード または モール側商品コードを入力"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="col-span-2">
            <button
              onClick={handleCheck}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
            >
              <Search className="h-4 w-4" />設定を確認
            </button>
          </div>
        </div>
      </GlassCard>

      {result && (
        <GlassCard className={cn(
          result.type === "success" ? "bg-blue-500/5 border-blue-500/20" : "bg-red-500/5 border-red-500/20"
        )}>
          <div className="flex items-start gap-3">
            {result.type === "success" ? (
              <Check className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <p className={cn("text-sm font-medium", result.type === "success" ? "text-blue-800" : "text-red-800")}>
                {result.messages[0]}
              </p>
              <ul className="mt-2 space-y-1">
                {result.messages.slice(1).map((m, i) => (
                  <li key={i} className="text-xs text-gray-700">{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard className="bg-gray-500/5">
        <p className="text-xs text-gray-500 mb-2">表示メッセージの凡例</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full font-medium bg-blue-500/15 text-blue-700">青</span>
            <span className="text-gray-600">「在庫連携可能な状態です。」など正常</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full font-medium bg-red-500/15 text-red-700">赤</span>
            <span className="text-gray-600">「商品が登録されていません。」など要修正</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
