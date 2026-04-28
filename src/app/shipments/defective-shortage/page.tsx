"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, AlertTriangle, RefreshCw, FileText, Mail } from "lucide-react";

type Row = {
  id: string;
  lot: string;
  sku: string;
  product: string;
  detected: number;
  affected: number;
  rootCause: "メーカー由来" | "輸送中破損" | "倉庫保管不良" | "原因調査中";
  reportedAt: string;
  status: "未対応" | "メーカー連絡済" | "代替手配中" | "全件対応完了" | "終結";
  responsibility: "メーカー" | "配送業者" | "自社" | "未確定";
};

const ROWS: Row[] = [
  { id: "DS-001", lot: "LOT-2026-04-12-A", sku: "WEP-001", product: "ワイヤレスイヤホン Pro", detected: 8, affected: 12, rootCause: "メーカー由来", reportedAt: "2026-04-25 09:00", status: "メーカー連絡済", responsibility: "メーカー" },
  { id: "DS-002", lot: "LOT-2026-04-08-B", sku: "MBT-004", product: "モバイルバッテリー 20000mAh", detected: 3, affected: 5, rootCause: "輸送中破損", reportedAt: "2026-04-23 14:32", status: "代替手配中", responsibility: "配送業者" },
  { id: "DS-003", lot: "LOT-2026-04-05-A", sku: "TS-WH-M", product: "Tシャツ ホワイト M", detected: 12, affected: 28, rootCause: "倉庫保管不良", reportedAt: "2026-04-22 10:00", status: "未対応", responsibility: "自社" },
  { id: "DS-004", lot: "LOT-2026-03-30-C", sku: "PFS-005", product: "保護フィルム セット", detected: 4, affected: 4, rootCause: "原因調査中", reportedAt: "2026-04-20 16:18", status: "未対応", responsibility: "未確定" },
  { id: "DS-005", lot: "LOT-2026-03-25-A", sku: "UCB-002", product: "USB-Cケーブル 2m", detected: 2, affected: 8, rootCause: "メーカー由来", reportedAt: "2026-04-15 11:42", status: "全件対応完了", responsibility: "メーカー" },
];

export default function ShipmentsDefectiveShortagePage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(ROWS);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("未終結のみ");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.lot.toLowerCase().includes(k) && !r.sku.toLowerCase().includes(k) && !r.product.toLowerCase().includes(k)) return false;
      if (statusFilter === "未終結のみ" && r.status === "終結") return false;
      if (statusFilter !== "未終結のみ" && statusFilter !== "すべて" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, keyword, statusFilter]);

  const updateStatus = (id: string, newStatus: Row["status"]) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    toast.show(`${id} のステータスを「${newStatus}」に更新`, "success");
  };

  const stats = {
    open: rows.filter((r) => r.status !== "終結" && r.status !== "全件対応完了").length,
    detected: rows.reduce((s, r) => s + r.detected, 0),
    affected: rows.reduce((s, r) => s + r.affected, 0),
    closed: rows.filter((r) => r.status === "全件対応完了" || r.status === "終結").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">不良欠品処理</h1>
            <HelpHint>
              ロット単位で不良が発覚した商品の対応状況を管理します。{"\n"}
              影響を受けた受注・顧客のリストアップ、代替手配、メーカー連絡、責任分界などを記録します。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未対応: <span className="font-semibold text-amber-700">{stats.open}件</span> ／ 影響受注総数:{" "}
            <span className="font-semibold">{stats.affected}件</span>
          </p>
        </div>
        <PrimaryButton onClick={() => toast.show("新規ロット不良登録モーダルを開きました")}>
          <AlertTriangle className="h-4 w-4" />新規ロット不良登録
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">未対応・進行中</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.open}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">検出不良数</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.detected}<span className="text-sm font-normal ml-1">点</span></p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">影響受注数</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.affected}<span className="text-sm font-normal ml-1">件</span></p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">完了</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.closed}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ロット番号・SKU・商品名"
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
              {["未終結のみ", "すべて", "未対応", "メーカー連絡済", "代替手配中", "全件対応完了", "終結"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ロット</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">不良/影響</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">原因</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">責任</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">通報日時</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{r.id}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{r.lot}</td>
                <td className="px-3 py-2.5">
                  <p className="text-gray-800">{r.product}</p>
                  <p className="text-[10px] font-mono text-gray-500">{r.sku}</p>
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums text-xs">
                  <span className="text-red-600 font-bold">{r.detected}</span>
                  <span className="mx-1 text-gray-400">/</span>
                  <span className="text-gray-700">{r.affected}</span>
                </td>
                <td className="px-3 py-2.5 text-gray-700 text-xs">{r.rootCause}</td>
                <td className="px-3 py-2.5 text-xs">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md font-medium",
                      r.responsibility === "メーカー" && "bg-purple-500/15 text-purple-700",
                      r.responsibility === "配送業者" && "bg-orange-500/15 text-orange-700",
                      r.responsibility === "自社" && "bg-red-500/15 text-red-700",
                      r.responsibility === "未確定" && "bg-gray-500/15 text-gray-700"
                    )}
                  >
                    {r.responsibility}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-500 tabular-nums">{r.reportedAt}</td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      r.status === "未対応" && "bg-red-500/15 text-red-700",
                      r.status === "メーカー連絡済" && "bg-blue-500/15 text-blue-700",
                      r.status === "代替手配中" && "bg-amber-500/15 text-amber-700",
                      r.status === "全件対応完了" && "bg-emerald-500/15 text-emerald-700",
                      r.status === "終結" && "bg-gray-500/15 text-gray-700"
                    )}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => updateStatus(r.id, "メーカー連絡済")}
                      title="メーカー連絡"
                      className="inline-flex p-1 rounded-lg hover:bg-white/60 text-purple-600"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, "代替手配中")}
                      title="代替手配"
                      className="inline-flex p-1 rounded-lg hover:bg-white/60 text-amber-600"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toast.show(`${r.id} の影響受注リストを表示`)}
                      title="影響受注を表示"
                      className="inline-flex p-1 rounded-lg hover:bg-white/60 text-blue-600"
                    >
                      <FileText className="h-3.5 w-3.5" />
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
