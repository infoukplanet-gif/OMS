"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, RefreshCw, CheckCircle2, Settings2, AlertTriangle, Send } from "lucide-react";
import { npPaymentStore } from "@/lib/stores/payment-np";
import { INITIAL_NP_ROWS } from "@/lib/seeds/payment-np";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  transitionDeferredPayment,
  type DeferredPaymentStatus,
  type DeferredPaymentRecord,
} from "@/lib/state-machines/deferred-payment";

type Row = DeferredPaymentRecord;

const STATUS_BADGE: Record<DeferredPaymentStatus, string> = {
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

export default function NpPaymentPage() {
  const toast = useToast();

  // domain "payment-np-rows" の正規オーナー。ここで snapshot/restore を1回だけ駆動。
  usePersistentStore({
    store: npPaymentStore,
    domain: "payment-np-rows",
    seed: INITIAL_NP_ROWS,
  });

  const rows = useSyncExternalStore(
    (cb) => npPaymentStore.subscribe(cb),
    () => npPaymentStore.getState(),
    () => INITIAL_NP_ROWS,
  );

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("対応必要のみ");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k)) return false;
      if (statusFilter === "対応必要のみ" && (r.status === "支払済" || r.status === "与信OK" || r.status === "切替済")) return false;
      if (statusFilter !== "対応必要のみ" && statusFilter !== "すべて" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, keyword, statusFilter]);

  const stats = {
    pending: rows.filter((r) => r.status === "与信中").length,
    ng: rows.filter((r) => r.status === "与信NG").length,
    invoicing: rows.filter((r) => r.status === "請求中").length,
    paid: rows.filter((r) => r.status === "支払済").length,
  };

  /** NP API 同期（モック）: 与信中の取引を与信OKへ確定させる（state-machine 経由） */
  const syncWithNp = () => {
    const targets = npPaymentStore.getState().filter((r) => r.status === "与信中");
    if (targets.length === 0) {
      toast.show("NPと同期しました（更新対象なし・最新の状態です）", "info");
      return;
    }
    for (const r of targets) {
      npPaymentStore.upsert(transitionDeferredPayment(r, "approve"));
    }
    toast.show(`NPと同期し、与信中 ${targets.length}件 が与信OKになりました`, "success");
  };

  /** 与信NG取引を切替済にする（受注側の支払方法変更が別途必要・state-machine 経由） */
  const switchPayment = (row: Row) => {
    const next = transitionDeferredPayment(row, "switchPayment");
    if (next === row) {
      toast.show("この操作はできません", "error");
      return;
    }
    npPaymentStore.upsert(next);
    toast.show(`${row.order} をNP後払いから切替済にしました。受注編集で支払方法を変更してください`, "success");
  };

  /** 請求中の取引に再請求の催促を送信する（送信済みは冪等にスキップ・reminded フラグ更新） */
  const remind = (row: Row) => {
    if (row.reminded) {
      toast.show(`${row.order} は催促送信済みです`, "info");
      return;
    }
    npPaymentStore.upsert({ ...row, reminded: true });
    toast.show(`${row.order} に再請求の催促メールを送信しました`, "success");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">NP後払いサポート</h1>
            <HelpHint>
              NP後払いの与信状況・請求状況・支払状況を確認します。{"\n"}
              与信NGの場合は別の支払方法への切替か、キャンセル処理が必要です。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            与信中: <span className="font-semibold text-blue-700">{stats.pending}件</span> ／ 与信NG:{" "}
            <span className="font-semibold text-red-700">{stats.ng}件</span>
          </p>
        </div>
        <Link href="/payments/np/connect" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
          <Settings2 className="h-4 w-4" />NPコネクト設定
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">与信中</p><p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{stats.pending}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">与信NG</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.ng}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">請求中</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.invoicing}</p></GlassCard>
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
              {["対応必要のみ", "すべて", "与信OK", "与信NG", "与信中", "請求中", "支払済", "切替済"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <button onClick={syncWithNp} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
            <RefreshCw className="h-4 w-4" />NP同期
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
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">NPステータス</th>
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
              <tr key={r.id} className={cn("border-t border-white/30 hover:bg-white/40", r.status === "与信NG" && "bg-red-500/5")}>
                <td className="px-3 py-2.5 font-medium text-blue-600">{r.order}</td>
                <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(r.amount)}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", STATUS_BADGE[r.status])}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600">{r.registeredAt}</td>
                <td className="px-3 py-2.5 text-center text-xs tabular-nums">{r.daysAged}日</td>
                <td className="px-3 py-2.5 text-center">
                  {r.status === "与信NG" ? (
                    <button onClick={() => switchPayment(r)} className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25 inline-flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />切替
                    </button>
                  ) : r.status === "請求中" ? (
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
                  ) : r.status === "切替済" ? (
                    <span className="text-xs text-gray-400">切替対応済</span>
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
