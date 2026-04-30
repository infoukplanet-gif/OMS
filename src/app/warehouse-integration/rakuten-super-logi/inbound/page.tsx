"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Eye, Plus, Search, Truck } from "lucide-react";

type Inbound = {
  id: string;
  poNo: string;
  supplier: string;
  items: number;
  qty: number;
  scheduled: string;
  arrived: string;
  carrier: string;
  trackingNo: string;
  status: "予定" | "輸送中" | "RSL受入中" | "検品中" | "完了" | "差異あり";
  diff: number;
};

const data: Inbound[] = [
  { id: "RSL-IN-20260430-005", poNo: "PO-2026-0042", supplier: "メーカーA", items: 8, qty: 1200, scheduled: "2026/04/30", arrived: "2026/04/30 09:30", carrier: "佐川急便", trackingNo: "1234-5678-9012", status: "検品中", diff: 0 },
  { id: "RSL-IN-20260430-004", poNo: "PO-2026-0041", supplier: "メーカーB", items: 5, qty: 800, scheduled: "2026/04/30", arrived: "2026/04/30 08:00", carrier: "ヤマト運輸", trackingNo: "2345-6789-0123", status: "RSL受入中", diff: 0 },
  { id: "RSL-IN-20260430-003", poNo: "PO-2026-0040", supplier: "問屋C", items: 12, qty: 600, scheduled: "2026/04/30", arrived: "—", carrier: "ヤマト運輸", trackingNo: "3456-7890-1234", status: "輸送中", diff: 0 },
  { id: "RSL-IN-20260429-018", poNo: "PO-2026-0039", supplier: "メーカーA", items: 4, qty: 450, scheduled: "2026/04/29", arrived: "2026/04/29 14:00", carrier: "佐川急便", trackingNo: "4567-8901-2345", status: "完了", diff: 0 },
  { id: "RSL-IN-20260429-017", poNo: "PO-2026-0038", supplier: "輸入商社D", items: 8, qty: 1800, scheduled: "2026/04/29", arrived: "2026/04/29 11:30", carrier: "西濃運輸", trackingNo: "5678-9012-3456", status: "差異あり", diff: -8 },
  { id: "RSL-IN-20260501-001", poNo: "PO-2026-0043", supplier: "メーカーA", items: 6, qty: 980, scheduled: "2026/05/01", arrived: "—", carrier: "—", trackingNo: "—", status: "予定", diff: 0 },
];

const sb: Record<string, string> = {
  予定: "bg-gray-500/15 text-gray-600",
  輸送中: "bg-blue-500/15 text-blue-700",
  RSL受入中: "bg-violet-500/15 text-violet-700",
  検品中: "bg-amber-500/15 text-amber-700",
  完了: "bg-emerald-500/15 text-emerald-700",
  差異あり: "bg-red-500/15 text-red-700",
};

export default function RsrLogiInboundPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Inbound["status"]>("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return data.filter((d) => {
      if (k && !`${d.id} ${d.poNo} ${d.supplier} ${d.trackingNo}`.toLowerCase().includes(k)) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      return true;
    });
  }, [keyword, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">RSL 入荷処理</h1>
            <HelpHint>RSL倉庫への入荷予定・実績を管理。発注書に紐付けて入荷予定を登録・取消・差異確認できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">発注書からRSLへの入荷予定を作成し、輸送・受入・検品の進捗を確認します。</p>
        </div>
        <PrimaryButton onClick={() => toast.show("新規入荷予定を登録します", "info")}>
          <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />入荷予定登録</span>
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">本日入荷予定</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{data.filter((d) => d.scheduled === "2026/04/30").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">輸送中</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{data.filter((d) => d.status === "輸送中").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">検品中</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{data.filter((d) => d.status === "検品中" || d.status === "RSL受入中").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">差異あり</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{data.filter((d) => d.status === "差異あり").length}</div>
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
              placeholder="入荷ID・発注番号・仕入先・送り状番号"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <DatePicker placeholder="入荷予定日" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">状態: すべて</option>
            <option value="予定">予定</option>
            <option value="輸送中">輸送中</option>
            <option value="RSL受入中">RSL受入中</option>
            <option value="検品中">検品中</option>
            <option value="完了">完了</option>
            <option value="差異あり">差異あり</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setStatusFilter("all"); }}>クリア</SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {data.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">入荷ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">発注書</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">仕入先</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">SKU</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">数量</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">予定日</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">到着</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">配送業者 / 送り状</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">差異</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{d.id}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-blue-700">{d.poNo}</td>
                <td className="px-3 py-2.5 text-gray-800">{d.supplier}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{d.items}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{d.qty.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-gray-700 text-xs">{d.scheduled}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{d.arrived}</td>
                <td className="px-3 py-2.5 text-xs">
                  <div className="text-gray-700 inline-flex items-center gap-1"><Truck className="h-3 w-3" />{d.carrier}</div>
                  <div className="text-gray-400 font-mono">{d.trackingNo}</div>
                </td>
                <td className={cn("px-3 py-2.5 text-center tabular-nums text-xs", d.diff !== 0 ? "text-red-600 font-medium" : "text-gray-400")}>
                  {d.diff !== 0 ? d.diff : "—"}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[d.status])}>
                    {d.status === "完了" && <CheckCircle2 className="h-3 w-3" />}
                    {d.status === "予定" && <Clock className="h-3 w-3" />}
                    {d.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button onClick={() => toast.show(`${d.id} の詳細を表示します`, "info")} className="p-1.5 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25" title="詳細">
                    <Eye className="h-3.5 w-3.5" />
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
