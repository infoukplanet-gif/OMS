"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { ArrowRightLeft, Plus, Search, History } from "lucide-react";

type Row = {
  id: string;
  order: string;
  product: string;
  sku: string;
  qty: number;
  reason: string;
  from: string;
  to: string;
  status: "承認待ち" | "振替待ち" | "振替完了";
};

const INITIAL: Row[] = [
  { id: "DT-001", order: "ORD-2026-00842", product: "Tシャツ ホワイト M", sku: "TS-WH-M", qty: 2, reason: "検品不良", from: "東京本社倉庫", to: "返品倉庫", status: "振替待ち" },
  { id: "DT-002", order: "ORD-2026-00838", product: "スニーカー ブラック 27cm", sku: "SN-BK-27", qty: 1, reason: "配送中破損", from: "東京本社倉庫", to: "返品倉庫", status: "振替完了" },
  { id: "DT-003", order: "ORD-2026-00835", product: "ジャケット ネイビー L", sku: "JK-NV-L", qty: 1, reason: "色違い", from: "大阪倉庫", to: "返品倉庫", status: "承認待ち" },
  { id: "DT-004", order: "ORD-2026-00829", product: "ワイヤレスイヤホン Pro", sku: "WEP-001", qty: 3, reason: "充電不良", from: "九州物流センター", to: "メーカー返却", status: "振替待ち" },
];

const HISTORY = [
  { id: 1, at: "2026-04-25 14:32", who: "佐藤 健", action: "振替完了", target: "DT-002 スニーカー × 1", from: "東京本社倉庫", to: "返品倉庫" },
  { id: 2, at: "2026-04-25 11:18", who: "鈴木 美咲", action: "振替登録", target: "DT-004 ワイヤレスイヤホン × 3", from: "九州物流センター", to: "メーカー返却" },
  { id: 3, at: "2026-04-24 16:42", who: "田中 花子", action: "承認", target: "DT-001 Tシャツ × 2", from: "東京本社倉庫", to: "返品倉庫" },
  { id: 4, at: "2026-04-24 09:24", who: "佐藤 健", action: "振替登録", target: "DT-003 ジャケット × 1", from: "大阪倉庫", to: "返品倉庫" },
];

export default function ShipmentsDefectiveTransferPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(INITIAL);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("すべて");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.sku.toLowerCase().includes(k)) return false;
      if (statusFilter !== "すべて" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, keyword, statusFilter]);

  const execute = (id: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, status: "振替完了" } : r)));
    toast.show(`${id} の振替を実行しました`, "success");
  };

  const stats = {
    waiting: rows.filter((r) => r.status === "振替待ち").length,
    pendingApproval: rows.filter((r) => r.status === "承認待ち").length,
    done: rows.filter((r) => r.status === "振替完了").length,
    qty: rows.reduce((s, r) => s + r.qty, 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">不良品振替（一括）</h1>
            <HelpHint>
              不良品在庫の倉庫間振替を一括実行します。{"\n"}
              不良品振替（個別）と監査ログが連動し、メーカー返却・廃棄処分・アウトレット移管が選択可能。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            振替待ち: <span className="font-semibold text-amber-700">{stats.waiting}件</span> ／ 承認待ち:{" "}
            <span className="font-semibold text-blue-700">{stats.pendingApproval}件</span>
          </p>
        </div>
        <PrimaryButton onClick={() => toast.show("新規振替登録モーダルを開きました")}>
          <Plus className="h-4 w-4" />新規振替登録
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">承認待ち</p><p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{stats.pendingApproval}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">振替待ち</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.waiting}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">完了</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.done}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">対象数量合計</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.qty}<span className="text-sm font-normal ml-1">点</span></p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="受注番号・SKUで検索"
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
              {["すべて", "承認待ち", "振替待ち", "振替完了"].map((o) => <option key={o}>{o}</option>)}
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">数量</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">理由</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">振替元</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">振替先</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.id}</td>
                <td className="px-4 py-3 font-medium text-blue-600">{d.order}</td>
                <td className="px-4 py-3 text-gray-800">{d.product}<p className="text-[10px] font-mono text-gray-500">{d.sku}</p></td>
                <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{d.qty}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{d.reason}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{d.from}</td>
                <td className="px-4 py-3 text-gray-600 text-xs font-medium">{d.to}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      d.status === "承認待ち" && "bg-blue-500/15 text-blue-700",
                      d.status === "振替待ち" && "bg-amber-500/15 text-amber-700",
                      d.status === "振替完了" && "bg-emerald-500/15 text-emerald-700"
                    )}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {d.status !== "振替完了" ? (
                    <button
                      onClick={() => execute(d.id)}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                    >
                      実行
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">完了</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">振替操作ログ</h2>
          <HelpHint>振替の登録・承認・実行履歴です。社内・税務監査時の証跡として保存されます。</HelpHint>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">日時</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">操作者</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">操作</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">対象</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">振替ルート</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h) => (
                <tr key={h.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2 text-xs text-gray-500 tabular-nums">{h.at}</td>
                  <td className="px-3 py-2 text-gray-700">{h.who}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-700">{h.action}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-700 text-xs">{h.target}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">
                    {h.from}
                    <ArrowRightLeft className="inline-block h-3 w-3 mx-1 text-gray-400" />
                    <span className="font-medium">{h.to}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
