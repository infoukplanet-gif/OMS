"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { CheckCircle2, Search, RefreshCw, AlertTriangle, CreditCard } from "lucide-react";

type Auth = {
  id: string;
  order: string;
  customer: string;
  amount: number;
  authAt: string;
  authExpire: string;
  daysToExpire: number;
  status: "売上確定待ち" | "売上確定済" | "オーソリ期限切れ" | "失敗";
  selected: boolean;
};

const INITIAL: Auth[] = [
  { id: "RC-001", order: "ORD-2026-00851", customer: "山田太郎", amount: 32400, authAt: "2026-04-25", authExpire: "2026-05-25", daysToExpire: 30, status: "売上確定待ち", selected: false },
  { id: "RC-002", order: "ORD-2026-00845", customer: "高橋健", amount: 22800, authAt: "2026-04-24", authExpire: "2026-05-24", daysToExpire: 29, status: "売上確定待ち", selected: false },
  { id: "RC-003", order: "ORD-2026-00838", customer: "井上智", amount: 28500, authAt: "2026-04-23", authExpire: "2026-05-23", daysToExpire: 28, status: "売上確定済", selected: false },
  { id: "RC-004", order: "ORD-2026-00824", customer: "佐藤花子", amount: 38400, authAt: "2026-04-22", authExpire: "2026-05-22", daysToExpire: 27, status: "売上確定待ち", selected: false },
  { id: "RC-005", order: "ORD-2026-00802", customer: "中村あかり", amount: 12800, authAt: "2026-03-30", authExpire: "2026-04-29", daysToExpire: 4, status: "売上確定待ち", selected: false },
];

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function RakutenCardPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Auth[]>(INITIAL);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("売上確定待ちのみ");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k)) return false;
      if (statusFilter === "売上確定待ちのみ" && r.status !== "売上確定待ち") return false;
      if (statusFilter !== "売上確定待ちのみ" && statusFilter !== "すべて" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, keyword, statusFilter]);

  const toggle = (id: string) => setRows(rows.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  const toggleAll = (v: boolean) => setRows(rows.map((r) => (filtered.find((f) => f.id === r.id) ? { ...r, selected: v } : r)));
  const selected = rows.filter((r) => r.selected && r.status === "売上確定待ち");

  const confirm = () => {
    if (selected.length === 0) {
      toast.show("売上確定待ちが選択されていません");
      return;
    }
    setRows(rows.map((r) => (selected.find((s) => s.id === r.id) ? { ...r, status: "売上確定済", selected: false } : r)));
    toast.show(`${selected.length}件の売上を確定しました`, "success");
  };

  const stats = {
    waiting: rows.filter((r) => r.status === "売上確定待ち").length,
    done: rows.filter((r) => r.status === "売上確定済").length,
    expiring: rows.filter((r) => r.status === "売上確定待ち" && r.daysToExpire <= 7).length,
    total: rows.filter((r) => r.status === "売上確定待ち").reduce((s, r) => s + r.amount, 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">楽天カード決済確定</h1>
            <HelpHint>
              楽天カードのオーソリ済受注に対して、売上確定処理を一括実行します。{"\n"}
              オーソリ期限（30日）を超過する前に必ず確定してください。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            確定待ち: <span className="font-semibold text-amber-700">{stats.waiting}件</span> ／ 期限7日以内:{" "}
            <span className="font-semibold text-red-700">{stats.expiring}件</span> ／ 確定待ち合計額:{" "}
            <span className="font-semibold">{fmt(stats.total)}</span>
          </p>
        </div>
        <PrimaryButton onClick={confirm}>
          <CheckCircle2 className="h-4 w-4" />選択{selected.length}件を売上確定
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><CreditCard className="h-4 w-4" />売上確定待ち</div><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.waiting}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><CheckCircle2 className="h-4 w-4" />売上確定済</div><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.done}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><AlertTriangle className="h-4 w-4" />期限7日以内</div><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.expiring}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">確定待ち合計額</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{fmt(stats.total)}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="受注番号・顧客名" className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="text-xs text-gray-500">状態</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["売上確定待ちのみ", "すべて", "売上確定待ち", "売上確定済", "オーソリ期限切れ", "失敗"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <button onClick={() => toast.show("楽天RMSから最新オーソリを取得中…")} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
            <RefreshCw className="h-4 w-4" />RMS再同期
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-center w-10">
                <input type="checkbox" checked={filtered.length > 0 && filtered.every((r) => r.selected)} onChange={(e) => toggleAll(e.target.checked)} className="accent-blue-500 w-4 h-4" />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">金額</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">オーソリ日</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">期限</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">残日数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={cn("border-t border-white/30 hover:bg-white/40", r.selected && "bg-blue-500/8", r.daysToExpire <= 7 && r.status === "売上確定待ち" && "bg-red-500/5")}>
                <td className="px-3 py-2.5 text-center">
                  <input type="checkbox" checked={r.selected} disabled={r.status !== "売上確定待ち"} onChange={() => toggle(r.id)} className="accent-blue-500 w-4 h-4 disabled:cursor-not-allowed" />
                </td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{r.order}</td>
                <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(r.amount)}</td>
                <td className="px-3 py-2.5 text-xs text-gray-600">{r.authAt}</td>
                <td className="px-3 py-2.5 text-xs text-gray-600">{r.authExpire}</td>
                <td className={cn("px-3 py-2.5 text-center text-xs tabular-nums", r.daysToExpire <= 7 ? "text-red-700 font-bold" : "text-gray-700")}>{r.daysToExpire}日</td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      r.status === "売上確定待ち" && "bg-yellow-500/15 text-yellow-700",
                      r.status === "売上確定済" && "bg-emerald-500/15 text-emerald-700",
                      r.status === "オーソリ期限切れ" && "bg-red-500/15 text-red-700",
                      r.status === "失敗" && "bg-red-500/15 text-red-700"
                    )}
                  >
                    {r.status}
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
