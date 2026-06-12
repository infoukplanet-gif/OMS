"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, RefreshCw, Send, AlertTriangle, CheckCircle2 } from "lucide-react";

type AtoneStatus = "与信OK" | "与信NG" | "与信中" | "請求中" | "支払済" | "回収不能" | "切替済" | "貸倒処理済";

type Row = {
  id: string;
  order: string;
  customer: string;
  amount: number;
  atoneStatus: AtoneStatus;
  registeredAt: string;
  daysAged: number;
  /** 請求中の取引に再請求の催促を送信済みか */
  reminded?: boolean;
};

// atone（外部決済プロバイダ）側の取引データ。API接続前提のためモック。
const INITIAL_ROWS: Row[] = [
  { id: "AT-001", order: "ORD-2026-00840", customer: "高橋健", amount: 22800, atoneStatus: "与信中", registeredAt: "2026-04-24", daysAged: 1 },
  { id: "AT-002", order: "ORD-2026-00832", customer: "井上智", amount: 28500, atoneStatus: "請求中", registeredAt: "2026-04-22", daysAged: 3 },
  { id: "AT-003", order: "ORD-2026-00821", customer: "佐藤花子", amount: 38400, atoneStatus: "支払済", registeredAt: "2026-04-18", daysAged: 0 },
  { id: "AT-004", order: "ORD-2026-00812", customer: "中村あかり", amount: 12800, atoneStatus: "与信NG", registeredAt: "2026-04-20", daysAged: 5 },
  { id: "AT-005", order: "ORD-2026-00802", customer: "渡辺京子", amount: 67800, atoneStatus: "回収不能", registeredAt: "2026-03-15", daysAged: 41 },
];

const STATUS_BADGE: Record<AtoneStatus, string> = {
  "与信OK": "bg-emerald-500/15 text-emerald-700",
  "与信NG": "bg-red-500/15 text-red-700",
  "与信中": "bg-blue-500/15 text-blue-700",
  "請求中": "bg-amber-500/15 text-amber-700",
  "支払済": "bg-emerald-500/15 text-emerald-700",
  "回収不能": "bg-red-500/15 text-red-700",
  "切替済": "bg-gray-500/15 text-gray-600",
  "貸倒処理済": "bg-gray-500/15 text-gray-600",
};

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function AtonePage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(INITIAL_ROWS);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("対応必要のみ");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k)) return false;
      if (statusFilter === "対応必要のみ" && (r.atoneStatus === "支払済" || r.atoneStatus === "与信OK" || r.atoneStatus === "切替済" || r.atoneStatus === "貸倒処理済")) return false;
      if (statusFilter !== "対応必要のみ" && statusFilter !== "すべて" && r.atoneStatus !== statusFilter) return false;
      return true;
    });
  }, [rows, keyword, statusFilter]);

  const stats = {
    invoicing: rows.filter((r) => r.atoneStatus === "請求中").length,
    ng: rows.filter((r) => r.atoneStatus === "与信NG").length,
    bad: rows.filter((r) => r.atoneStatus === "回収不能").length,
    paid: rows.filter((r) => r.atoneStatus === "支払済").length,
  };

  /** atone API 同期（モック）: 与信中の取引を与信OKへ確定させる */
  const syncWithAtone = () => {
    const targets = rows.filter((r) => r.atoneStatus === "与信中");
    if (targets.length === 0) {
      toast.show("atoneと同期しました（更新対象なし・最新の状態です）", "info");
      return;
    }
    setRows((prev) => prev.map((r) => (r.atoneStatus === "与信中" ? { ...r, atoneStatus: "与信OK" } : r)));
    toast.show(`atoneと同期し、与信中 ${targets.length}件 が与信OKになりました`, "success");
  };

  /** 与信NG取引を切替済にする（受注側の支払方法変更が別途必要） */
  const switchPayment = (row: Row) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, atoneStatus: "切替済" } : r)));
    toast.show(`${row.order} をatoneから切替済にしました。受注編集で支払方法を変更してください`, "success");
  };

  /** 請求中の取引に再請求の催促を送信する（送信済みは冪等にスキップ） */
  const remind = (row: Row) => {
    if (row.reminded) {
      toast.show(`${row.order} は催促送信済みです`, "info");
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, reminded: true } : r)));
    toast.show(`${row.order} に再請求の催促メールを送信しました`, "success");
  };

  /** 回収不能の取引を貸倒処理する（atone保証適用・社内損益に反映） */
  const writeOff = (row: Row) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, atoneStatus: "貸倒処理済" } : r)));
    toast.show(`${row.order}（${fmt(row.amount)}）を貸倒処理しました。atone保証の適用対象です`, "success");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">後払い.com（atone）サポート</h1>
            <HelpHint>
              atone（旧後払い.com）の与信・請求・支払状況を管理します。{"\n"}
              回収不能となった受注はatone保証が適用されますが、社内の損益管理にも反映されます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            請求中: <span className="font-semibold text-amber-700">{stats.invoicing}件</span> ／ 回収不能:{" "}
            <span className="font-semibold text-red-700">{stats.bad}件</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">請求中</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.invoicing}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">与信NG</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.ng}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">回収不能</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.bad}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">支払完了</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.paid}</p></GlassCard>
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
              {["対応必要のみ", "すべて", "与信OK", "与信NG", "与信中", "請求中", "支払済", "回収不能", "切替済", "貸倒処理済"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <button onClick={syncWithAtone} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
            <RefreshCw className="h-4 w-4" />atone同期
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">金額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">atone状態</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">登録日</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">経過日</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                  条件に一致する取引はありません
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className={cn("border-t border-white/30 hover:bg-white/40", (r.atoneStatus === "与信NG" || r.atoneStatus === "回収不能") && "bg-red-500/5")}>
                <td className="px-3 py-2.5 font-medium text-blue-600">{r.order}</td>
                <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(r.amount)}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", STATUS_BADGE[r.atoneStatus])}>
                    {r.atoneStatus}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600">{r.registeredAt}</td>
                <td className={cn("px-3 py-2.5 text-center text-xs tabular-nums", r.daysAged >= 30 && "text-red-700 font-bold")}>{r.daysAged}日</td>
                <td className="px-3 py-2.5 text-center">
                  {r.atoneStatus === "与信NG" ? (
                    <button onClick={() => switchPayment(r)} className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25 inline-flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />切替
                    </button>
                  ) : r.atoneStatus === "請求中" ? (
                    <button
                      onClick={() => remind(r)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1",
                        r.reminded
                          ? "bg-gray-500/10 text-gray-400 cursor-default"
                          : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25",
                      )}
                    >
                      <Send className="h-3 w-3" />{r.reminded ? "催促済" : "催促"}
                    </button>
                  ) : r.atoneStatus === "回収不能" ? (
                    <button onClick={() => writeOff(r)} className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25">
                      貸倒
                    </button>
                  ) : r.atoneStatus === "切替済" ? (
                    <span className="text-xs text-gray-400">切替対応済</span>
                  ) : r.atoneStatus === "貸倒処理済" ? (
                    <span className="text-xs text-gray-400">処理済</span>
                  ) : (
                    <CheckCircle2 className="inline-block h-4 w-4 text-emerald-500" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

