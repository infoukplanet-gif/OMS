"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, Plus, AlertTriangle, ArrowRightLeft, CheckCircle2 } from "lucide-react";

type Row = {
  id: string;
  order: string;
  product: string;
  sku: string;
  qty: number;
  reason: string;
  from: string;
  to: string;
  registeredAt: string;
  registeredBy: string;
  status: "承認待ち" | "振替待ち" | "振替完了" | "却下";
};

const ROWS: Row[] = [
  { id: "DF-001", order: "ORD-2026-00842", product: "Tシャツ ホワイト M", sku: "TS-WH-M", qty: 2, reason: "検品不良（汚れ）", from: "東京本社倉庫", to: "返品倉庫", registeredAt: "2026-04-25 09:24", registeredBy: "佐藤 健", status: "振替待ち" },
  { id: "DF-002", order: "ORD-2026-00838", product: "スニーカー ブラック 27cm", sku: "SN-BK-27", qty: 1, reason: "配送中破損", from: "東京本社倉庫", to: "返品倉庫", registeredAt: "2026-04-24 14:08", registeredBy: "鈴木 美咲", status: "振替完了" },
  { id: "DF-003", order: "ORD-2026-00835", product: "ジャケット ネイビー L", sku: "JK-NV-L", qty: 1, reason: "色違い納品", from: "大阪倉庫", to: "返品倉庫", registeredAt: "2026-04-24 11:42", registeredBy: "田中 花子", status: "承認待ち" },
  { id: "DF-004", order: "ORD-2026-00829", product: "ワイヤレスイヤホン Pro", sku: "WEP-001", qty: 3, reason: "充電不良ロット", from: "九州物流センター", to: "メーカー返却", registeredAt: "2026-04-23 16:18", registeredBy: "高橋 翔", status: "振替待ち" },
  { id: "DF-005", order: "ORD-2026-00812", product: "USB-Cケーブル 2m", sku: "UCB-002", qty: 5, reason: "包装破れ", from: "東京本社倉庫", to: "アウトレット在庫", registeredAt: "2026-04-22 10:00", registeredBy: "佐藤 健", status: "振替完了" },
];

const STATUS_BADGE: Record<Row["status"], string> = {
  "承認待ち": "bg-blue-500/15 text-blue-700",
  "振替待ち": "bg-amber-500/15 text-amber-700",
  "振替完了": "bg-emerald-500/15 text-emerald-700",
  "却下": "bg-red-500/15 text-red-700",
};

export default function ShipmentsDefectivePage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(ROWS);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("すべて");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.sku.toLowerCase().includes(k) && !r.product.toLowerCase().includes(k)) return false;
      if (statusFilter !== "すべて" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, keyword, statusFilter]);

  const execute = (id: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, status: "振替完了" } : r)));
    toast.show(`${id} の振替を実行しました（在庫数を更新）`, "success");
  };

  const stats = {
    waiting: rows.filter((r) => r.status === "振替待ち" || r.status === "承認待ち").length,
    done: rows.filter((r) => r.status === "振替完了").length,
    qty: rows.filter((r) => r.status !== "却下").reduce((s, r) => s + r.qty, 0),
    rejected: rows.filter((r) => r.status === "却下").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">不良品振替</h1>
            <HelpHint>
              不良品を良品倉庫から返品倉庫・メーカー返却・アウトレット在庫へ振り替えます。{"\n"}
              振替実行時に在庫数を自動更新し、メーカー返品・廃棄処理の起票にも連携できます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未振替: <span className="font-semibold text-amber-700">{stats.waiting}件</span> ／ 累計振替数量:{" "}
            <span className="font-semibold">{stats.qty}点</span>
          </p>
        </div>
        <PrimaryButton onClick={() => toast.show("新規振替登録モーダルを開きました")}>
          <Plus className="h-4 w-4" />新規振替登録
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">処理待ち</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.waiting}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">振替完了</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.done}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">対象数量合計</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.qty}<span className="text-sm font-normal ml-1">点</span></p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">却下件数</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.rejected}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="受注番号・SKU・商品名"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">状態</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "承認待ち", "振替待ち", "振替完了", "却下"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">商品</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">数量</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">理由</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">振替ルート</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">登録</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.id}</td>
                <td className="px-4 py-3 font-medium text-blue-600">{r.order}</td>
                <td className="px-4 py-3">
                  <p className="text-gray-800">{r.product}</p>
                  <p className="text-[10px] font-mono text-gray-500">{r.sku}</p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{r.qty}</td>
                <td className="px-4 py-3 text-gray-700 text-xs">{r.reason}</td>
                <td className="px-4 py-3 text-gray-700 text-xs">
                  <span>{r.from}</span>
                  <ArrowRightLeft className="inline-block h-3 w-3 mx-1 text-gray-400" />
                  <span className="font-medium">{r.to}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  <p className="tabular-nums">{r.registeredAt}</p>
                  <p>{r.registeredBy}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_BADGE[r.status])}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {r.status === "振替待ち" || r.status === "承認待ち" ? (
                    <button
                      onClick={() => execute(r.id)}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                    >
                      実行
                    </button>
                  ) : (
                    <CheckCircle2 className="inline-block h-4 w-4 text-emerald-500" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h2 className="text-base font-semibold text-gray-800">振替で連動する処理</h2>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          {[
            "良品在庫を −数量、不良品在庫を +数量",
            "メーカー返却起票（メーカー返却ルートの場合）",
            "返金処理の自動キュー投入（顧客起因の場合）",
            "ロット不良タグの自動付与",
            "監査ログ出力（操作者・日時・理由を保存）",
            "卸先には不良ロット通知メールを自動送信",
          ].map((s) => (
            <li key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
