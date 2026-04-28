"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";

type Row = {
  id: string;
  order: string;
  customer: string;
  amount: number;
  yahooStatus: "入金待ち" | "入金済" | "キャンセル" | "失敗";
  paidAt: string;
  ourStatus: "未取込" | "取込済" | "差異あり";
  selected: boolean;
};

const INITIAL: Row[] = [
  { id: "Y-001", order: "ORD-2026-00824", customer: "佐藤花子", amount: 38400, yahooStatus: "入金済", paidAt: "2026-04-24", ourStatus: "未取込", selected: false },
  { id: "Y-002", order: "ORD-2026-00818", customer: "高橋健", amount: 22800, yahooStatus: "入金済", paidAt: "2026-04-23", ourStatus: "取込済", selected: false },
  { id: "Y-003", order: "ORD-2026-00812", customer: "中村あかり", amount: 12800, yahooStatus: "入金待ち", paidAt: "—", ourStatus: "未取込", selected: false },
  { id: "Y-004", order: "ORD-2026-00808", customer: "渡辺京子", amount: 67800, yahooStatus: "キャンセル", paidAt: "—", ourStatus: "未取込", selected: false },
  { id: "Y-005", order: "ORD-2026-00800", customer: "伊藤大輔", amount: 22400, yahooStatus: "入金済", paidAt: "2026-04-22", ourStatus: "差異あり", selected: false },
];

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function YahooPaymentPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(INITIAL);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("未取込のみ");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k)) return false;
      if (statusFilter === "未取込のみ" && r.ourStatus !== "未取込") return false;
      if (statusFilter === "差異ありのみ" && r.ourStatus !== "差異あり") return false;
      return true;
    });
  }, [rows, keyword, statusFilter]);

  const toggle = (id: string) => setRows(rows.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  const importSelected = () => {
    const target = rows.filter((r) => r.selected && r.ourStatus === "未取込" && r.yahooStatus === "入金済");
    if (target.length === 0) {
      toast.show("取込対象が選択されていません");
      return;
    }
    setRows(rows.map((r) => (target.find((t) => t.id === r.id) ? { ...r, ourStatus: "取込済", selected: false } : r)));
    toast.show(`${target.length}件をOMSに取込みました`, "success");
  };

  const stats = {
    pending: rows.filter((r) => r.yahooStatus === "入金待ち").length,
    paid: rows.filter((r) => r.yahooStatus === "入金済" && r.ourStatus === "未取込").length,
    diff: rows.filter((r) => r.ourStatus === "差異あり").length,
    cancelled: rows.filter((r) => r.yahooStatus === "キャンセル").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">Yahoo!入金処理</h1>
            <HelpHint>
              Yahoo!ショッピングの入金確認結果を取込み、OMSの入金状態に反映します。{"\n"}
              「Yahoo!かんたん決済」は別画面（Yahoo!かんたん決済入金確認）で処理します。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未取込: <span className="font-semibold text-amber-700">{stats.paid}件</span> ／ 差異:{" "}
            <span className="font-semibold text-red-700">{stats.diff}件</span>
          </p>
        </div>
        <PrimaryButton onClick={importSelected}>
          <CheckCircle2 className="h-4 w-4" />選択を取込
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">入金待ち</p><p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{stats.pending}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">取込待ち</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.paid}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">差異検出</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.diff}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">キャンセル</p><p className="mt-2 text-3xl font-bold text-gray-700 tabular-nums">{stats.cancelled}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="受注番号・顧客名" className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="text-xs text-gray-500">表示</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["未取込のみ", "差異ありのみ", "すべて"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <button onClick={() => toast.show("Yahoo!ストアAPIから最新を取得中…")} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
            <RefreshCw className="h-4 w-4" />API再同期
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-center w-10"></th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">金額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">Yahoo!状態</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">入金日</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">OMS取込</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={cn("border-t border-white/30 hover:bg-white/40", r.ourStatus === "差異あり" && "bg-red-500/5")}>
                <td className="px-3 py-2.5 text-center">
                  <input type="checkbox" checked={r.selected} disabled={r.yahooStatus !== "入金済" || r.ourStatus !== "未取込"} onChange={() => toggle(r.id)} className="accent-blue-500 w-4 h-4 disabled:cursor-not-allowed" />
                </td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{r.order}</td>
                <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(r.amount)}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", r.yahooStatus === "入金済" && "bg-emerald-500/15 text-emerald-700", r.yahooStatus === "入金待ち" && "bg-amber-500/15 text-amber-700", r.yahooStatus === "キャンセル" && "bg-gray-500/15 text-gray-700", r.yahooStatus === "失敗" && "bg-red-500/15 text-red-700")}>
                    {r.yahooStatus}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600">{r.paidAt}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-0.5", r.ourStatus === "取込済" && "bg-emerald-500/15 text-emerald-700", r.ourStatus === "未取込" && "bg-amber-500/15 text-amber-700", r.ourStatus === "差異あり" && "bg-red-500/15 text-red-700")}>
                    {r.ourStatus === "差異あり" && <AlertTriangle className="h-3 w-3" />}
                    {r.ourStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
