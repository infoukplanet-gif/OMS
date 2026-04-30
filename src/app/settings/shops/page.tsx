"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Globe, Pause, Pencil, Play, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

type Shop = {
  id: string;
  name: string;
  code: string;
  mall: string;
  color: string;
  status: "連携中" | "エラー" | "停止中" | "未設定";
  lastSync: string;
  lastSyncAt: string;
  apiAuthType: "OAuth" | "APIキー" | "Basic" | "—";
  monthlySales: number;
  monthlyOrders: number;
  defaultWarehouse: string;
  fromAddress: string;
  notes: string;
};

const initial: Shop[] = [
  { id: "S001", name: "楽天市場 サンプルショップ", code: "rakuten-main", mall: "楽天市場", color: "bg-red-500", status: "連携中", lastSync: "2分前", lastSyncAt: "2026/04/30 10:28", apiAuthType: "OAuth", monthlySales: 18_450_000, monthlyOrders: 1245, defaultWarehouse: "東京本社倉庫", fromAddress: "rakuten@example.com", notes: "メイン店舗、24時間自動同期" },
  { id: "S002", name: "Amazon 公式ストア", code: "amazon-main", mall: "Amazon", color: "bg-orange-400", status: "連携中", lastSync: "5分前", lastSyncAt: "2026/04/30 10:25", apiAuthType: "OAuth", monthlySales: 9_820_000, monthlyOrders: 580, defaultWarehouse: "FBA（Amazon）", fromAddress: "amazon@example.com", notes: "FBA連携、SP-API利用" },
  { id: "S003", name: "Shopify 自社EC", code: "shopify-main", mall: "Shopify", color: "bg-green-500", status: "連携中", lastSync: "1分前", lastSyncAt: "2026/04/30 10:29", apiAuthType: "APIキー", monthlySales: 12_300_000, monthlyOrders: 980, defaultWarehouse: "東京本社倉庫", fromAddress: "info@example.com", notes: "プライマリECサイト" },
  { id: "S004", name: "Yahoo!ショッピング店", code: "yahoo-main", mall: "Yahoo!ショッピング", color: "bg-purple-500", status: "エラー", lastSync: "3時間前", lastSyncAt: "2026/04/30 07:30", apiAuthType: "OAuth", monthlySales: 6_140_000, monthlyOrders: 420, defaultWarehouse: "大阪倉庫", fromAddress: "yahoo@example.com", notes: "認証期限切れ、要再認証" },
  { id: "S005", name: "卸売チャネル", code: "wholesale", mall: "卸売", color: "bg-amber-500", status: "停止中", lastSync: "—", lastSyncAt: "—", apiAuthType: "—", monthlySales: 4_200_000, monthlyOrders: 32, defaultWarehouse: "東京本社倉庫", fromAddress: "wholesale@example.com", notes: "FAX/メール受注のみ" },
  { id: "S006", name: "au PAY マーケット店", code: "aupay-main", mall: "au PAY マーケット", color: "bg-cyan-500", status: "連携中", lastSync: "8分前", lastSyncAt: "2026/04/30 10:22", apiAuthType: "APIキー", monthlySales: 2_180_000, monthlyOrders: 145, defaultWarehouse: "東京本社倉庫", fromAddress: "aupay@example.com", notes: "" },
  { id: "S007", name: "Qoo10ショップ", code: "qoo10-main", mall: "Qoo10", color: "bg-pink-500", status: "未設定", lastSync: "—", lastSyncAt: "—", apiAuthType: "—", monthlySales: 0, monthlyOrders: 0, defaultWarehouse: "—", fromAddress: "—", notes: "API登録予定" },
];

const sb: Record<string, string> = {
  連携中: "bg-emerald-500/15 text-emerald-700",
  エラー: "bg-red-500/15 text-red-700",
  停止中: "bg-gray-500/15 text-gray-600",
  未設定: "bg-amber-500/15 text-amber-700",
};

export default function ShopsPage() {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [keyword, setKeyword] = useState("");
  const [mallFilter, setMallFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Shop["status"]>("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((s) => {
      if (k && !`${s.name} ${s.code} ${s.mall}`.toLowerCase().includes(k)) return false;
      if (mallFilter !== "all" && s.mall !== mallFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      return true;
    });
  }, [items, keyword, mallFilter, statusFilter]);

  const malls = Array.from(new Set(items.map((i) => i.mall)));

  const toggleStatus = (id: string) =>
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, status: s.status === "連携中" ? "停止中" : "連携中" } : s)));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">店舗マスタ</h1>
            <HelpHint>連携モール・自社ECなど店舗ごとの基本情報・API認証・既定倉庫・送信元アドレスを管理します。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">店舗別の連携状況と売上を一望し、設定変更・一時停止が可能。</p>
        </div>
        <Link href="/settings/shops/new">
          <PrimaryButton>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />店舗を新規登録</span>
          </PrimaryButton>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録店舗</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">連携中 {items.filter((i) => i.status === "連携中").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">エラー店舗</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{items.filter((i) => i.status === "エラー").length}</div>
          <div className="text-xs text-gray-500 mt-0.5">要対応</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">月間売上合計</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">¥{items.reduce((s, i) => s + i.monthlySales, 0).toLocaleString()}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">月間受注合計</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.reduce((s, i) => s + i.monthlyOrders, 0).toLocaleString()}</div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="店舗名・コード・モール"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select value={mallFilter} onChange={(e) => setMallFilter(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">モール: すべて</option>
            {malls.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">状態: すべて</option>
            <option value="連携中">連携中</option>
            <option value="エラー">エラー</option>
            <option value="停止中">停止中</option>
            <option value="未設定">未設定</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setMallFilter("all"); setStatusFilter("all"); }}>クリア</SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {items.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">店舗名</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">コード</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">モール</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">認証</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">最終同期</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">月間売上</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">月間受注</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">既定倉庫</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-gray-800">{s.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.fromAddress}</div>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{s.code}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", s.color)} />
                    <span className="text-gray-700">{s.mall}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-gray-600">{s.apiAuthType}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[s.status])}>
                    {s.status === "連携中" && <CheckCircle2 className="h-3 w-3" />}
                    {s.status === "エラー" && <AlertCircle className="h-3 w-3" />}
                    {s.status === "未設定" && <Globe className="h-3 w-3" />}
                    {s.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">
                  <div>{s.lastSync}</div>
                  <div className="text-[10px] text-gray-400">{s.lastSyncAt}</div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-blue-700">{s.monthlySales > 0 ? `¥${s.monthlySales.toLocaleString()}` : "—"}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{s.monthlyOrders > 0 ? s.monthlyOrders.toLocaleString() : "—"}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{s.defaultWarehouse}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    {s.status === "エラー" && (
                      <button onClick={() => toast.show(`${s.name} を再接続しました`, "success")} className="p-1.5 rounded-lg bg-orange-500/15 text-orange-700 hover:bg-orange-500/25" title="再接続">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <Link href={`/settings/shops/${s.id}/edit`} className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600" title="編集">
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button onClick={() => { toggleStatus(s.id); toast.show(`${s.name} を切替しました`, "info"); }} className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-orange-500" title="一時停止/再開">
                      {s.status === "連携中" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => { setItems((p) => p.filter((x) => x.id !== s.id)); toast.show("店舗を削除しました", "info"); }} className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25" title="削除">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
