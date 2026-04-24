"use client";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Pause, Play } from "lucide-react";

const shops = [
  { id: "S001", name: "楽天市場 サンプルショップ", code: "rakuten-main", mall: "楽天市場", status: "連携中", color: "bg-red-500", lastSync: "2分前" },
  { id: "S002", name: "Amazon 公式ストア", code: "amazon-main", mall: "Amazon", status: "連携中", color: "bg-orange-400", lastSync: "5分前" },
  { id: "S003", name: "Shopify 自社EC", code: "shopify-main", mall: "Shopify", status: "連携中", color: "bg-green-500", lastSync: "1分前" },
  { id: "S004", name: "Yahoo!ショッピング店", code: "yahoo-main", mall: "Yahoo!ショッピング", status: "エラー", color: "bg-purple-500", lastSync: "3時間前" },
  { id: "S005", name: "卸売チャネル", code: "wholesale", mall: "卸売", status: "停止中", color: "bg-amber-500", lastSync: "—" },
];

const sb: Record<string, string> = {
  "連携中": "bg-emerald-500/15 text-emerald-700",
  "エラー": "bg-red-500/15 text-red-700",
  "停止中": "bg-gray-500/15 text-gray-600",
};

export default function ShopsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">店舗設定</h1>
          <p className="text-sm text-gray-500 mt-1">店舗の追加・編集・削除を行います。</p>
        </div>
        <Link href="/settings/shops/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">
          <Plus className="h-4 w-4" />店舗を新規登録
        </Link>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">店舗名</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">店舗コード</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">出店モール</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">最終同期</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody>{shops.map(s => (
            <tr key={s.id} className="border-t border-white/30 hover:bg-white/40 transition-colors">
              <td className="px-3 py-2.5 font-medium text-gray-800">{s.name}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{s.code}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", s.color)} />
                  <span className="text-gray-700">{s.mall}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[s.status])}>{s.status}</span></td>
              <td className="px-3 py-2.5 text-gray-500 text-xs">{s.lastSync}</td>
              <td className="px-3 py-2.5 text-center">
                <div className="flex justify-center gap-1">
                  <Link href={`/settings/shops/${s.id}/edit`} className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="編集"><Pencil className="h-3.5 w-3.5" /></Link>
                  <button className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-orange-500 transition-colors" title="一時停止/再開">
                    {s.status === "連携中" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
