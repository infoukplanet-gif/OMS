"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, AlertTriangle, RotateCcw, Mail, CheckCircle2 } from "lucide-react";

type Mismatch = {
  id: string;
  order: string;
  customer: string;
  orderAmt: number;
  paidAmt: number;
  diff: number;
  status: "未対応" | "返金処理中" | "再請求中" | "差額調整済" | "完了";
  daysOpen: number;
  reason: string;
};

const ROWS: Mismatch[] = [
  { id: "MM-001", order: "ORD-2026-00838", customer: "井上智", orderAmt: 28500, paidAmt: 25000, diff: -3500, status: "未対応", daysOpen: 3, reason: "送料の未加算" },
  { id: "MM-002", order: "ORD-2026-00820", customer: "佐藤花子", orderAmt: 12400, paidAmt: 12800, diff: 400, status: "返金処理中", daysOpen: 5, reason: "二重振込" },
  { id: "MM-003", order: "ORD-2026-00815", customer: "山田太郎", orderAmt: 5600, paidAmt: 0, diff: -5600, status: "再請求中", daysOpen: 12, reason: "口座番号間違い" },
  { id: "MM-004", order: "ORD-2026-00810", customer: "中村あかり", orderAmt: 24800, paidAmt: 24600, diff: -200, status: "差額調整済", daysOpen: 0, reason: "クレカ手数料端数" },
  { id: "MM-005", order: "ORD-2026-00808", customer: "田中花子", orderAmt: 8400, paidAmt: 8500, diff: 100, status: "完了", daysOpen: 0, reason: "切り上げ" },
];

const fmt = (n: number) => `${n >= 0 ? "+" : ""}¥${Math.abs(n).toLocaleString()}`;

export default function PaymentMismatchPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("未完了のみ");
  const [diffFilter, setDiffFilter] = useState<"all" | "short" | "over">("all");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return ROWS.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k)) return false;
      if (statusFilter === "未完了のみ" && r.status === "完了") return false;
      if (statusFilter !== "未完了のみ" && statusFilter !== "すべて" && r.status !== statusFilter) return false;
      if (diffFilter === "short" && r.diff >= 0) return false;
      if (diffFilter === "over" && r.diff <= 0) return false;
      return true;
    });
  }, [keyword, statusFilter, diffFilter]);

  const stats = {
    open: ROWS.filter((r) => r.status !== "完了").length,
    shortTotal: ROWS.filter((r) => r.diff < 0 && r.status !== "完了").reduce((s, r) => s + Math.abs(r.diff), 0),
    overTotal: ROWS.filter((r) => r.diff > 0 && r.status !== "完了").reduce((s, r) => s + r.diff, 0),
    overdue: ROWS.filter((r) => r.daysOpen >= 7 && r.status !== "完了").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">金額不整合確認</h1>
            <HelpHint>
              入金額と受注額に差額が発生した受注を一覧表示します。{"\n"}
              不足は再請求、過剰は返金、わずかな端数は差額調整で対応します。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未対応: <span className="font-semibold text-amber-700">{stats.open}件</span> ／ 不足合計:{" "}
            <span className="font-semibold text-red-700">¥{stats.shortTotal.toLocaleString()}</span> ／ 過剰合計:{" "}
            <span className="font-semibold text-purple-700">¥{stats.overTotal.toLocaleString()}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">未対応件数</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.open}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">不足合計</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">¥{stats.shortTotal.toLocaleString()}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">過剰合計</p><p className="mt-2 text-3xl font-bold text-purple-700 tabular-nums">¥{stats.overTotal.toLocaleString()}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">7日以上滞留</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.overdue}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="受注番号・顧客名"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">対応状態</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["未完了のみ", "すべて", "未対応", "返金処理中", "再請求中", "差額調整済", "完了"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">差額種別</label>
            <select
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value as typeof diffFilter)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">すべて</option>
              <option value="short">不足のみ</option>
              <option value="over">過剰のみ</option>
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">受注額</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">入金額</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">差額</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">理由</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">滞留</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{r.id}</td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{r.order}</td>
                <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">¥{r.orderAmt.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">¥{r.paidAmt.toLocaleString()}</td>
                <td className={cn("px-3 py-2.5 text-right tabular-nums font-bold", r.diff < 0 ? "text-red-700" : r.diff > 0 ? "text-purple-700" : "text-gray-400")}>{fmt(r.diff)}</td>
                <td className="px-3 py-2.5 text-xs text-gray-700">{r.reason}</td>
                <td className={cn("px-3 py-2.5 text-center text-xs tabular-nums", r.daysOpen >= 7 && "text-red-700 font-semibold")}>{r.daysOpen}日</td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      r.status === "未対応" && "bg-red-500/15 text-red-700",
                      r.status === "返金処理中" && "bg-purple-500/15 text-purple-700",
                      r.status === "再請求中" && "bg-amber-500/15 text-amber-700",
                      r.status === "差額調整済" && "bg-blue-500/15 text-blue-700",
                      r.status === "完了" && "bg-emerald-500/15 text-emerald-700"
                    )}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => toast.show(`${r.id} 顧客にメールで連絡`)} title="顧客連絡" className="inline-flex p-1 rounded-lg hover:bg-white/60 text-blue-600">
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => toast.show(`${r.id} 再請求/返金処理を開始`)} title="調整" className="inline-flex p-1 rounded-lg hover:bg-white/60 text-amber-600">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => toast.show(`${r.id} 差額を承認しました`, "success")} title="差額承認" className="inline-flex p-1 rounded-lg hover:bg-white/60 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h2 className="text-base font-semibold text-gray-800">差額対応の選択肢</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
          <div className="p-3 rounded-xl bg-white/50 border border-white/40">
            <p className="font-medium text-red-700 mb-1">不足: 再請求</p>
            <p className="text-xs">不足分の再請求書を発行し、お客様にメール送信。</p>
          </div>
          <div className="p-3 rounded-xl bg-white/50 border border-white/40">
            <p className="font-medium text-purple-700 mb-1">過剰: 返金処理</p>
            <p className="text-xs">過剰分を顧客口座へ返金。返金台帳に自動登録。</p>
          </div>
          <div className="p-3 rounded-xl bg-white/50 border border-white/40">
            <p className="font-medium text-blue-700 mb-1">少額: 差額調整</p>
            <p className="text-xs">数百円以下の端数を「雑損」「雑収入」勘定で吸収。</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
