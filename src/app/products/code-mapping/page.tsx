"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Search, Plus, Pencil, Info, Link as LinkIcon } from "lucide-react";

const mappings = [
  {
    code: "WEP-001",
    name: "ワイヤレスイヤホン Pro",
    rakuten: { number: "wep-001-r", sku: "" },
    amazon: { sku: "B0WEP001" },
    yahoo: { code: "wep001y", subcode: "" },
    shopify: "wep-001",
    status: "ok",
  },
  {
    code: "WEP-001-BK",
    name: "ワイヤレスイヤホン Pro / ブラック",
    rakuten: { number: "wep-001-r", sku: "wep-001-bk" },
    amazon: { sku: "B0WEP001BK" },
    yahoo: { code: "wep001y", subcode: "bk" },
    shopify: "wep-001-bk",
    status: "ok",
  },
  {
    code: "UCB-002",
    name: "USB-Cケーブル 2m",
    rakuten: { number: "ucb-002-r", sku: "" },
    amazon: { sku: "B0UCB002" },
    yahoo: { code: "ucb002y", subcode: "" },
    shopify: "ucb-002",
    status: "ok",
  },
  {
    code: "MBT-004",
    name: "モバイルバッテリー 20000mAh",
    rakuten: { number: "mbt-004-r", sku: "" },
    amazon: { sku: "B0MBT004" },
    yahoo: { code: "", subcode: "" },
    shopify: "mbt-004",
    status: "warning",
  },
  {
    code: "CHG-007",
    name: "急速充電器 65W",
    rakuten: { number: "chg-007-r", sku: "" },
    amazon: { sku: "" },
    yahoo: { code: "chg007y", subcode: "" },
    shopify: "chg-007",
    status: "warning",
  },
];

const sb: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-700",
  warning: "bg-yellow-500/15 text-yellow-700",
  error: "bg-red-500/15 text-red-700",
};

export default function CodeMappingPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">商品コード紐づけ</h1>
          <p className="text-sm text-gray-500 mt-1">各モールの商品コードを、自社の商品コードに関連付けて在庫連携・受注一元管理を実現します。</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">
          <Plus className="h-4 w-4" />新規紐付け
        </button>
      </div>

      {/* 説明カード */}
      <GlassCard className="bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-gray-800 space-y-2">
            <p className="font-medium">紐付けルール（モール別）</p>
            <ul className="text-xs space-y-1 text-gray-700">
              <li>• <span className="font-medium text-orange-600">Amazon</span>: 商品コード = 出品者SKU</li>
              <li>• <span className="font-medium text-red-600">楽天市場</span>: 単体は 商品コード = 商品番号、バリエーションは 代表商品コード = 商品番号、各SKU = システム連携用SKU番号</li>
              <li>• <span className="font-medium text-purple-600">Yahoo!</span>: 単体は 商品コード = code、バリエーションは 代表商品コード = code、各SKU = code + sub-code</li>
              <li>• <span className="font-medium text-green-600">Shopify</span>: 商品コード = SKU</li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* 検索 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="自社コード・モール側コード・商品名で検索..."
            className="w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/60 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <a href="/products/inventory/check" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <LinkIcon className="h-3.5 w-3.5" />在庫連携確認画面へ
        </a>
      </div>

      {/* 紐付けテーブル */}
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">自社コード</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />楽天市場
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />Amazon SKU
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />Yahoo!
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500" />Shopify SKU
                </div>
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">連携状態</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {mappings.map((m) => (
              <tr key={m.code} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                <td className="px-3 py-2.5 font-mono text-xs font-medium text-gray-800">{m.code}</td>
                <td className="px-3 py-2.5 text-gray-700">{m.name}</td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  {m.rakuten.number ? (
                    <div>
                      <div className="text-gray-700">{m.rakuten.number}</div>
                      {m.rakuten.sku && <div className="text-gray-400 text-[10px]">SKU: {m.rakuten.sku}</div>}
                    </div>
                  ) : <span className="text-gray-400">未設定</span>}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  {m.amazon.sku ? <span className="text-gray-700">{m.amazon.sku}</span> : <span className="text-gray-400">未設定</span>}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  {m.yahoo.code ? (
                    <div>
                      <div className="text-gray-700">{m.yahoo.code}</div>
                      {m.yahoo.subcode && <div className="text-gray-400 text-[10px]">sub: {m.yahoo.subcode}</div>}
                    </div>
                  ) : <span className="text-gray-400">未設定</span>}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  {m.shopify ? <span className="text-gray-700">{m.shopify}</span> : <span className="text-gray-400">未設定</span>}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", sb[m.status])}>
                    {m.status === "ok" ? "正常" : m.status === "warning" ? "一部未設定" : "エラー"}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <button className="p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
