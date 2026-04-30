"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, RefreshCw, Search, Send, Truck } from "lucide-react";

type Outbound = {
  id: string;
  orderNo: string;
  customer: string;
  zipPrefix: string;
  items: number;
  qty: number;
  cutoff: string;
  shippedAt: string;
  carrier: string;
  trackingNo: string;
  status: "指示送信" | "ピッキング中" | "梱包中" | "発送済" | "保留" | "失敗";
  shop: string;
};

const data: Outbound[] = [
  { id: "RSL-OUT-20260430-0145", orderNo: "ORD-2026-08423", customer: "田中 太郎", zipPrefix: "100", items: 2, qty: 3, cutoff: "2026/04/30 12:00", shippedAt: "—", carrier: "—", trackingNo: "—", status: "ピッキング中", shop: "楽天店" },
  { id: "RSL-OUT-20260430-0144", orderNo: "ORD-2026-08418", customer: "山田 花子", zipPrefix: "150", items: 1, qty: 1, cutoff: "2026/04/30 12:00", shippedAt: "2026/04/30 10:30", carrier: "ヤマト", trackingNo: "1234-5678-9012", status: "発送済", shop: "楽天店" },
  { id: "RSL-OUT-20260430-0143", orderNo: "ORD-2026-08410", customer: "佐藤 一郎", zipPrefix: "060", items: 3, qty: 5, cutoff: "2026/04/30 12:00", shippedAt: "2026/04/30 10:15", carrier: "ヤマト", trackingNo: "2345-6789-0123", status: "発送済", shop: "楽天店" },
  { id: "RSL-OUT-20260430-0142", orderNo: "ORD-2026-08405", customer: "渡辺 美咲", zipPrefix: "530", items: 1, qty: 2, cutoff: "2026/04/30 12:00", shippedAt: "—", carrier: "—", trackingNo: "—", status: "梱包中", shop: "楽天店" },
  { id: "RSL-OUT-20260430-0141", orderNo: "ORD-2026-08400", customer: "木村 健", zipPrefix: "812", items: 2, qty: 2, cutoff: "2026/04/30 12:00", shippedAt: "—", carrier: "—", trackingNo: "—", status: "指示送信", shop: "楽天店" },
  { id: "RSL-OUT-20260429-0418", orderNo: "ORD-2026-08398", customer: "伊藤 さくら", zipPrefix: "900", items: 1, qty: 1, cutoff: "2026/04/29 12:00", shippedAt: "—", carrier: "—", trackingNo: "—", status: "保留", shop: "楽天店" },
  { id: "RSL-OUT-20260429-0417", orderNo: "ORD-2026-08395", customer: "小林 大輔", zipPrefix: "240", items: 2, qty: 4, cutoff: "2026/04/29 12:00", shippedAt: "2026/04/29 16:00", carrier: "ヤマト", trackingNo: "3456-7890-1234", status: "発送済", shop: "楽天店" },
  { id: "RSL-OUT-20260429-0416", orderNo: "ORD-2026-08390", customer: "吉田 あゆみ", zipPrefix: "950", items: 1, qty: 1, cutoff: "2026/04/29 12:00", shippedAt: "—", carrier: "—", trackingNo: "—", status: "失敗", shop: "楽天店" },
];

const sb: Record<string, string> = {
  指示送信: "bg-blue-500/15 text-blue-700",
  ピッキング中: "bg-violet-500/15 text-violet-700",
  梱包中: "bg-amber-500/15 text-amber-700",
  発送済: "bg-emerald-500/15 text-emerald-700",
  保留: "bg-gray-500/15 text-gray-500",
  失敗: "bg-red-500/15 text-red-700",
};

export default function RsrLogiOutboundPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Outbound["status"]>("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return data.filter((d) => {
      if (k && !`${d.id} ${d.orderNo} ${d.customer} ${d.trackingNo}`.toLowerCase().includes(k)) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      return true;
    });
  }, [keyword, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">RSL 出荷処理</h1>
            <HelpHint>RSLへの出荷指示と進捗管理。締切時刻までに送信できなかった指示はアラートされます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">楽天店受注をRSLに自動委託し、ピッキング・梱包・発送状況をリアルタイム確認。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => toast.show("失敗キューを再送します", "info")}>
            <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-4 w-4" />失敗を再送</span>
          </SecondaryButton>
          <PrimaryButton onClick={() => toast.show("選択受注の指示を即時送信しました", "success")}>
            <span className="inline-flex items-center gap-1.5"><Send className="h-4 w-4" />即時送信</span>
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">本日指示</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{data.filter((d) => d.cutoff.startsWith("2026/04/30")).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">処理中</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">{data.filter((d) => d.status === "ピッキング中" || d.status === "梱包中").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">発送済</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{data.filter((d) => d.status === "発送済").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">失敗・保留</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{data.filter((d) => d.status === "失敗" || d.status === "保留").length}</div>
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
              placeholder="出荷ID・受注番号・顧客名・送り状番号"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <DatePicker placeholder="締切日" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">状態: すべて</option>
            <option value="指示送信">指示送信</option>
            <option value="ピッキング中">ピッキング中</option>
            <option value="梱包中">梱包中</option>
            <option value="発送済">発送済</option>
            <option value="保留">保留</option>
            <option value="失敗">失敗</option>
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
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">出荷ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">配送先〒</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">SKU</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">数量</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">締切</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">発送日時 / 送り状</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{d.id}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-blue-700">{d.orderNo}</td>
                <td className="px-3 py-2.5 text-gray-800">{d.customer}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{d.zipPrefix}-xxxx</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{d.items}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{d.qty}</td>
                <td className="px-3 py-2.5 text-gray-700 text-xs">{d.cutoff}</td>
                <td className="px-3 py-2.5 text-xs">
                  <div className="text-gray-700">{d.shippedAt}</div>
                  {d.trackingNo !== "—" && (
                    <div className="text-gray-400 font-mono inline-flex items-center gap-1"><Truck className="h-3 w-3" />{d.trackingNo}</div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[d.status])}>
                    {d.status === "発送済" && <CheckCircle2 className="h-3 w-3" />}
                    {d.status === "保留" && <Clock className="h-3 w-3" />}
                    {d.status}
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
