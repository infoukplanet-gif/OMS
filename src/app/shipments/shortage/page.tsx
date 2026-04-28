"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { AlertTriangle, Search, GitBranch, Ban, RefreshCw, ShoppingCart } from "lucide-react";

type Row = {
  id: string;
  order: string;
  customer: string;
  product: string;
  sku: string;
  needed: number;
  available: number;
  reason: "在庫切れ" | "不良品検出" | "ロケ違い" | "未入荷" | "予約集中";
  status: "保留中" | "代替提案中" | "交換手配中" | "キャンセル承認待ち" | "解決済";
  age: number;
  amount: number;
};

const ROWS: Row[] = [
  { id: "S001", order: "ORD-2026-00849", customer: "田中一郎", product: "スマートウォッチバンド", sku: "SWB-003", needed: 2, available: 0, reason: "在庫切れ", status: "保留中", age: 1, amount: 154000 },
  { id: "S002", order: "ORD-2026-00846", customer: "渡辺京子", product: "完全ワイヤレスイヤホン", sku: "TWS-006-BK", needed: 1, available: 0, reason: "在庫切れ", status: "代替提案中", age: 2, amount: 67800 },
  { id: "S003", order: "ORD-2026-00840", customer: "高橋健", product: "モバイルバッテリー", sku: "MBT-004", needed: 1, available: 1, reason: "不良品検出", status: "交換手配中", age: 3, amount: 22800 },
  { id: "S004", order: "ORD-2026-00833", customer: "鈴木美咲", product: "保護フィルム セット", sku: "PFS-005", needed: 4, available: 2, reason: "予約集中", status: "保留中", age: 1, amount: 8400 },
  { id: "S005", order: "ORD-2026-00821", customer: "山田太郎", product: "USB-Cケーブル 2m", sku: "UCB-002", needed: 3, available: 0, reason: "未入荷", status: "キャンセル承認待ち", age: 5, amount: 4500 },
];

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function ShipmentsShortagePage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(ROWS);
  const [keyword, setKeyword] = useState("");
  const [reasonFilter, setReasonFilter] = useState("すべて");
  const [statusFilter, setStatusFilter] = useState<string>("未解決のみ");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k) && !r.sku.toLowerCase().includes(k)) return false;
      if (reasonFilter !== "すべて" && r.reason !== reasonFilter) return false;
      if (statusFilter === "未解決のみ" && r.status === "解決済") return false;
      if (statusFilter !== "未解決のみ" && statusFilter !== "すべて" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, keyword, reasonFilter, statusFilter]);

  const handleAction = (id: string, action: "hold" | "alternative" | "cancel") => {
    const labels = { hold: "保留", alternative: "代替提案", cancel: "キャンセル承認" };
    setRows(rows.map((r) => (r.id === id ? { ...r, status: action === "alternative" ? "代替提案中" : action === "cancel" ? "キャンセル承認待ち" : "保留中" } : r)));
    toast.show(`${id} を ${labels[action]} に変更しました`, "success");
  };

  const stats = {
    open: rows.filter((r) => r.status !== "解決済").length,
    inStock: rows.reduce((s, r) => s + Math.min(r.needed, r.available), 0),
    short: rows.reduce((s, r) => s + Math.max(0, r.needed - r.available), 0),
    impact: rows.filter((r) => r.status !== "解決済").reduce((s, r) => s + r.amount, 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">欠品・不良欠品処理</h1>
            <HelpHint>
              在庫不足・不良品検出によって出荷ブロックされている受注を一覧表示。{"\n"}
              代替提案・交換手配・キャンセル承認のいずれかで決着させます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未解決: <span className="font-semibold text-amber-700">{stats.open}件</span> ／ 売上影響:{" "}
            <span className="font-semibold text-red-700">{fmt(stats.impact)}</span>
          </p>
        </div>
        <PrimaryButton onClick={() => toast.show("発注計算画面に遷移します")}>
          <ShoppingCart className="h-4 w-4" />発注計算へ
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">未解決件数</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.open}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">在庫充当可能</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.inStock}<span className="text-sm font-normal ml-1">点</span></p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">不足数量</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.short}<span className="text-sm font-normal ml-1">点</span></p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">売上影響</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{fmt(stats.impact)}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="受注番号・顧客名・SKUで検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">理由</label>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "在庫切れ", "不良品検出", "ロケ違い", "未入荷", "予約集中"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">対応状況</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["未解決のみ", "すべて", "保留中", "代替提案中", "交換手配中", "キャンセル承認待ち", "解決済"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">必要/在庫</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">理由</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">影響額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">滞留</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-12 text-center text-gray-400">対象なし</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5 font-medium text-blue-600">{r.order}</td>
                  <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                  <td className="px-3 py-2.5">
                    <p className="text-gray-800">{r.product}</p>
                    <p className="text-[10px] font-mono text-gray-500">{r.sku}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="tabular-nums">
                      <span className="text-gray-700">{r.needed}</span>
                      <span className="mx-1 text-gray-400">/</span>
                      <span className={cn(r.available < r.needed ? "text-red-600 font-bold" : "text-emerald-600")}>{r.available}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{r.reason}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(r.amount)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs tabular-nums", r.age >= 3 ? "bg-red-500/15 text-red-700" : "bg-gray-500/15 text-gray-700")}>{r.age}日</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        r.status === "保留中" && "bg-amber-500/15 text-amber-700",
                        r.status === "代替提案中" && "bg-blue-500/15 text-blue-700",
                        r.status === "交換手配中" && "bg-purple-500/15 text-purple-700",
                        r.status === "キャンセル承認待ち" && "bg-red-500/15 text-red-700",
                        r.status === "解決済" && "bg-emerald-500/15 text-emerald-700"
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => handleAction(r.id, "hold")}
                        title="保留"
                        className="inline-flex p-1 rounded-lg hover:bg-white/60 text-amber-600"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "alternative")}
                        title="代替提案"
                        className="inline-flex p-1 rounded-lg hover:bg-white/60 text-blue-600"
                      >
                        <GitBranch className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "cancel")}
                        title="キャンセル"
                        className="inline-flex p-1 rounded-lg hover:bg-white/60 text-red-600"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h2 className="text-base font-semibold text-gray-800">代替提案テンプレート</h2>
          <HelpHint>顧客に代替商品を提案する際の標準文面。商品コードを差し込むと自動展開されます。</HelpHint>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: "在庫切れ → 上位互換提案", desc: "より高品質な代替商品を提示し、差額無料で対応" },
            { name: "在庫切れ → 同等品提案", desc: "同価格帯の代替商品を提示" },
            { name: "未入荷 → 入荷待ち or キャンセル選択", desc: "入荷予定日を案内し、待つかキャンセルを選択" },
          ].map((t) => (
            <div key={t.name} className="p-3 rounded-xl bg-white/50 border border-white/40">
              <p className="text-sm font-medium text-gray-800">{t.name}</p>
              <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
