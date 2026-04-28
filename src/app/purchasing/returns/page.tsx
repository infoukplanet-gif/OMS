"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Search, RotateCcw, AlertTriangle, Banknote } from "lucide-react";

type Ret = {
  id: string;
  order: string;
  customer: string;
  product: string;
  reason: "初期不良" | "誤配送" | "顧客都合" | "サイズ違い" | "破損" | "その他";
  amount: number;
  registeredAt: string;
  status: "受付済" | "返送中" | "検品中" | "返金処理中" | "返金済";
};

const RETURNS: Ret[] = [
  { id: "RET-2026-0042", order: "ORD-2026-00820", customer: "渡辺京子", product: "ワイヤレスイヤホン Pro", reason: "初期不良", amount: 12800, registeredAt: "2026-04-25", status: "検品中" },
  { id: "RET-2026-0041", order: "ORD-2026-00815", customer: "松本愛", product: "USB-Cケーブル 2m", reason: "誤配送", amount: 1500, registeredAt: "2026-04-23", status: "返金済" },
  { id: "RET-2026-0040", order: "ORD-2026-00810", customer: "木村拓也", product: "モバイルバッテリー", reason: "顧客都合", amount: 4800, registeredAt: "2026-04-22", status: "受付済" },
  { id: "RET-2026-0039", order: "ORD-2026-00802", customer: "佐藤花子", product: "Tシャツ ホワイト M", reason: "サイズ違い", amount: 3200, registeredAt: "2026-04-20", status: "返送中" },
  { id: "RET-2026-0038", order: "ORD-2026-00788", customer: "田中一郎", product: "ジャケット ネイビー L", reason: "破損", amount: 24800, registeredAt: "2026-04-15", status: "返金処理中" },
];

const STATUS_BADGE: Record<Ret["status"], string> = {
  受付済: "bg-blue-500/15 text-blue-700",
  返送中: "bg-amber-500/15 text-amber-700",
  検品中: "bg-purple-500/15 text-purple-700",
  返金処理中: "bg-yellow-500/15 text-yellow-700",
  返金済: "bg-emerald-500/15 text-emerald-700",
};

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function PurchasingReturnsPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("未完了のみ");
  const [reasonFilter, setReasonFilter] = useState("すべて");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return RETURNS.filter((r) => {
      if (k && !r.id.toLowerCase().includes(k) && !r.order.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k)) return false;
      if (statusFilter === "未完了のみ" && r.status === "返金済") return false;
      if (statusFilter !== "未完了のみ" && statusFilter !== "すべて" && r.status !== statusFilter) return false;
      if (reasonFilter !== "すべて" && r.reason !== reasonFilter) return false;
      return true;
    });
  }, [keyword, statusFilter, reasonFilter]);

  const stats = {
    open: RETURNS.filter((r) => r.status !== "返金済").length,
    inspecting: RETURNS.filter((r) => r.status === "検品中").length,
    refundTotal: RETURNS.filter((r) => r.status !== "返金済").reduce((s, r) => s + r.amount, 0),
    monthRefund: RETURNS.filter((r) => r.status === "返金済").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">返品伝票管理</h1>
            <HelpHint>
              顧客からの返品申請を受付〜返送〜検品〜返金まで一気通貫で管理します。{"\n"}
              不良品検出時は「不良品振替」と連動できます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未完了: <span className="font-semibold text-amber-700">{stats.open}件</span> ／ 検品中:{" "}
            <span className="font-semibold text-purple-700">{stats.inspecting}件</span> ／ 返金処理予定額:{" "}
            <span className="font-semibold">{fmt(stats.refundTotal)}</span>
          </p>
        </div>
        <Link href="/purchasing/returns/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">
          <Plus className="h-4 w-4" />返品登録
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><RotateCcw className="h-4 w-4" />未完了</div><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.open}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><AlertTriangle className="h-4 w-4" />検品中</div><p className="mt-2 text-3xl font-bold text-purple-700 tabular-nums">{stats.inspecting}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><Banknote className="h-4 w-4" />返金予定額</div><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{fmt(stats.refundTotal)}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><RotateCcw className="h-4 w-4" />本月の返金完了</div><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.monthRefund}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="返品番号・受注番号・顧客名" className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="text-xs text-gray-500">状態</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["未完了のみ", "すべて", "受付済", "返送中", "検品中", "返金処理中", "返金済"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">理由</label>
            <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)} className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["すべて", "初期不良", "誤配送", "顧客都合", "サイズ違い", "破損", "その他"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">返品番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">理由</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">返金額</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受付日</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-medium text-gray-800">{r.id}</td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{r.order}</td>
                <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                <td className="px-3 py-2.5 text-gray-700 text-xs">{r.product}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{r.reason}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(r.amount)}</td>
                <td className="px-3 py-2.5 text-xs text-gray-500 tabular-nums">{r.registeredAt}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_BADGE[r.status])}>{r.status}</span>
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/purchasing/returns/${r.id}/edit`} onClick={(e) => { e.preventDefault(); toast.show(`${r.id} の編集画面を開きます`); }} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600">
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
