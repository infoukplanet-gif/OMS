"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Eye, Plus, Search, Undo2 } from "lucide-react";

type Return = {
  id: string;
  orderNo: string;
  customer: string;
  product: string;
  qty: number;
  reason: string;
  receivedAt: string;
  inspectedAt: string;
  result: "再販可" | "不良在庫" | "廃棄" | "—";
  refund: number;
  status: "受付" | "返送中" | "RSL受領" | "検品中" | "在庫戻し済" | "廃棄処理済";
  trackingNo: string;
};

const data: Return[] = [
  { id: "RSL-RET-20260430-008", orderNo: "ORD-2026-08350", customer: "田中 太郎", product: "コットンTシャツ ホワイト M", qty: 1, reason: "サイズ違い", receivedAt: "2026/04/30 09:00", inspectedAt: "2026/04/30 11:00", result: "再販可", refund: 1980, status: "在庫戻し済", trackingNo: "1234-5678-9012" },
  { id: "RSL-RET-20260430-007", orderNo: "ORD-2026-08348", customer: "山田 花子", product: "デニムジャケット M", qty: 1, reason: "イメージ違い", receivedAt: "2026/04/30 09:30", inspectedAt: "—", result: "—", refund: 14_800, status: "検品中", trackingNo: "2345-6789-0123" },
  { id: "RSL-RET-20260430-006", orderNo: "ORD-2026-08345", customer: "佐藤 一郎", product: "ステンレスタンブラー 350ml", qty: 2, reason: "破損", receivedAt: "2026/04/30 10:00", inspectedAt: "2026/04/30 11:30", result: "廃棄", refund: 4400, status: "廃棄処理済", trackingNo: "3456-7890-1234" },
  { id: "RSL-RET-20260429-018", orderNo: "ORD-2026-08340", customer: "渡辺 美咲", product: "オーガニックコーヒー豆", qty: 3, reason: "誤発送", receivedAt: "—", inspectedAt: "—", result: "—", refund: 6000, status: "返送中", trackingNo: "4567-8901-2345" },
  { id: "RSL-RET-20260429-017", orderNo: "ORD-2026-08338", customer: "木村 健", product: "ナチュラルコスメセット", qty: 1, reason: "肌に合わない", receivedAt: "2026/04/29 14:00", inspectedAt: "2026/04/29 15:00", result: "不良在庫", refund: 6000, status: "在庫戻し済", trackingNo: "5678-9012-3456" },
  { id: "RSL-RET-20260430-009", orderNo: "ORD-2026-08355", customer: "伊藤 さくら", product: "ワイヤレスイヤホン", qty: 1, reason: "初期不良", receivedAt: "—", inspectedAt: "—", result: "—", refund: 15_000, status: "受付", trackingNo: "—" },
];

const sb: Record<string, string> = {
  受付: "bg-blue-500/15 text-blue-700",
  返送中: "bg-violet-500/15 text-violet-700",
  RSL受領: "bg-amber-500/15 text-amber-700",
  検品中: "bg-orange-500/15 text-orange-700",
  在庫戻し済: "bg-emerald-500/15 text-emerald-700",
  廃棄処理済: "bg-rose-500/15 text-rose-700",
};

const resultBadge: Record<string, string> = {
  再販可: "bg-emerald-500/15 text-emerald-700",
  不良在庫: "bg-amber-500/15 text-amber-700",
  廃棄: "bg-red-500/15 text-red-700",
  "—": "bg-gray-500/10 text-gray-500",
};

export default function RsrLogiReturnPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Return["status"]>("all");

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
            <h1 className="text-2xl font-bold text-gray-800">RSL 返品処理</h1>
            <HelpHint>RSLを経由した返品の入荷・検品・在庫戻しまでの一連の処理を管理。検品結果から自動で返金処理がトリガーされます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">楽天店受注の返品をRSLで受領・検品し、再販可・不良・廃棄の3区分で在庫を整理。</p>
        </div>
        <PrimaryButton onClick={() => toast.show("新規返品受付を登録します", "info")}>
          <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />返品受付</span>
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">本日返品</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{data.filter((d) => d.receivedAt.startsWith("2026/04/30")).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">検品中</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{data.filter((d) => d.status === "検品中" || d.status === "RSL受領").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">在庫戻し済</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{data.filter((d) => d.status === "在庫戻し済").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">返金合計</div>
          <div className="text-2xl font-bold text-red-600 mt-1">¥{data.reduce((s, d) => s + d.refund, 0).toLocaleString()}</div>
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
              placeholder="返品ID・受注番号・顧客名・送り状番号"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <DatePicker placeholder="受領日" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">状態: すべて</option>
            <option value="受付">受付</option>
            <option value="返送中">返送中</option>
            <option value="RSL受領">RSL受領</option>
            <option value="検品中">検品中</option>
            <option value="在庫戻し済">在庫戻し済</option>
            <option value="廃棄処理済">廃棄処理済</option>
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
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">返品ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客 / 商品</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">数量</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">理由</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">RSL受領 / 検品</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">検品結果</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">返金額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{d.id}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-blue-700">{d.orderNo}</td>
                <td className="px-3 py-2.5">
                  <div className="font-medium text-gray-800">{d.customer}</div>
                  <div className="text-xs text-gray-500">{d.product}</div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{d.qty}</td>
                <td className="px-3 py-2.5 text-gray-700 text-xs">{d.reason}</td>
                <td className="px-3 py-2.5 text-xs">
                  <div className="text-gray-700">{d.receivedAt}</div>
                  <div className="text-gray-400">{d.inspectedAt}</div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", resultBadge[d.result])}>{d.result}</span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-red-600">¥{d.refund.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[d.status])}>
                    {d.status === "在庫戻し済" && <CheckCircle2 className="h-3 w-3" />}
                    {d.status === "受付" && <Clock className="h-3 w-3" />}
                    {d.status === "返送中" && <Undo2 className="h-3 w-3" />}
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
