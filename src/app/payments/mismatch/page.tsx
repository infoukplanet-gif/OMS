"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, AlertTriangle, RotateCcw, Mail, CheckCircle2 } from "lucide-react";
import { paymentStore, type PaymentRecord } from "@/lib/stores/payment";
import { orderStore } from "@/lib/stores/orders";
import { inventoryStore } from "@/lib/stores/inventory";
import { shipmentStore } from "@/lib/stores/shipment";
import { INITIAL_PAYMENTS, type SeededPayment } from "@/lib/seeds/payments";
import { INITIAL_ORDERS } from "@/lib/seeds/orders";
import { INITIAL_INVENTORY } from "@/lib/seeds/inventory";
import {
  extractMismatches,
  rebillJobFor,
  type MismatchPaymentInput,
  type MismatchRow,
} from "@/lib/calculations/extract-mismatches";
import { applyRecordPaymentCascade } from "@/lib/cascades/record-payment";
import { mailQueue } from "@/lib/mail/queue";
import { getAutoMailEnabled } from "@/lib/mail/auto-settings";

const fmt = (n: number) => `${n >= 0 ? "+" : ""}¥${Math.abs(n).toLocaleString()}`;

/** PaymentRecord の表示用 extras（unknown）を安全に MismatchPaymentInput へ写像する。 */
function toMismatchInput(p: PaymentRecord): MismatchPaymentInput {
  const extra = p as Partial<SeededPayment>;
  return {
    paymentId: p.id,
    orderId: p.orderId,
    customer: typeof extra.customer === "string" ? extra.customer : "—",
    orderTotal: p.orderTotal,
    paidAmount: p.paidAmount,
    daysOverdue: typeof extra.daysOverdue === "number" ? extra.daysOverdue : 0,
  };
}

type RowStatus = "未対応" | "再請求中";

export default function PaymentMismatchPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"すべて" | RowStatus>("すべて");
  const [diffFilter, setDiffFilter] = useState<"all" | "short" | "over">("all");
  // 再請求メールを送った行のマーカー（セッションローカル。解消されるまで「再請求中」表示）
  const [rebilledIds, setRebilledIds] = useState<ReadonlySet<string>>(new Set());
  // 差額調整は入金状態を書き換えるため確認ダイアログを挟む
  const [adjustTarget, setAdjustTarget] = useState<MismatchRow | null>(null);

  // 防御的シード。payments ドメインの正規オーナーは payments/page（usePersistentStore）。
  // 直接このページを開いた場合でも cascade 連鎖先が空にならないようにする。
  useEffect(() => {
    if (paymentStore.getState().length === 0) paymentStore.setItems(INITIAL_PAYMENTS);
    if (orderStore.getState().length === 0) orderStore.setItems(INITIAL_ORDERS);
    if (inventoryStore.getState().length === 0) inventoryStore.setItems(INITIAL_INVENTORY);
  }, []);

  const payments = useSyncExternalStore(
    (cb) => paymentStore.subscribe(cb),
    () => paymentStore.getState(),
    () => INITIAL_PAYMENTS,
  );

  const rows = useMemo(
    () => extractMismatches(payments.map(toMismatchInput)),
    [payments],
  );

  const statusOf = (r: MismatchRow): RowStatus =>
    rebilledIds.has(r.paymentId) ? "再請求中" : "未対応";

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.orderId.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k)) return false;
      if (statusFilter !== "すべて" && statusOf(r) !== statusFilter) return false;
      if (diffFilter === "short" && r.diff >= 0) return false;
      if (diffFilter === "over" && r.diff <= 0) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, keyword, statusFilter, diffFilter, rebilledIds]);

  const stats = useMemo(
    () => ({
      open: rows.length,
      shortTotal: rows.filter((r) => r.diff < 0).reduce((s, r) => s + Math.abs(r.diff), 0),
      overTotal: rows.filter((r) => r.diff > 0).reduce((s, r) => s + r.diff, 0),
      overdue: rows.filter((r) => r.daysOpen >= 7).length,
    }),
    [rows],
  );

  /** 不足 → 再請求メールを自動メールキューへ投入（受注×トリガーで重複抑止）。 */
  const handleRebill = (r: MismatchRow) => {
    const result = mailQueue.enqueueAll([rebillJobFor(r.orderId)], getAutoMailEnabled());
    if (result.enqueued > 0) {
      setRebilledIds((prev) => new Set([...prev, r.paymentId]));
      toast.show(`${r.orderId} の再請求メールを送信キューに追加しました（不足 ${fmt(r.diff)}）`, "success");
    } else if (result.duplicateSkipped > 0) {
      setRebilledIds((prev) => new Set([...prev, r.paymentId]));
      toast.show(`${r.orderId} は再請求済みです（重複送信を抑止）`);
    } else {
      toast.show("自動メール「再請求（差額不足）」が無効化されています。メール自動化設定を確認してください");
    }
  };

  /** 過剰 → 超過分を入金取消（返金）。paidAmount が受注額に戻り行が一覧から消える。 */
  const handleRefund = (r: MismatchRow) => {
    const result = paymentStore.applyCancel(r.paymentId, r.diff);
    if (result.applied) {
      toast.show(`${r.orderId} の過剰分 ¥${r.diff.toLocaleString()} を返金処理しました`, "success");
    } else {
      toast.show(`${r.orderId} の返金処理に失敗しました（入金状態を確認してください）`);
    }
  };

  /** 不足 → 差額調整（不足分を入金扱いで消し込み）。完済到達で受注確定 cascade が走る。 */
  const handleAdjust = (r: MismatchRow) => {
    const result = applyRecordPaymentCascade(r.paymentId, Math.abs(r.diff), {
      paymentStore,
      orderStore,
      shipmentStore,
      inventoryStore,
      mailQueue,
      autoMailEnabled: getAutoMailEnabled(),
    });
    setAdjustTarget(null);
    if (!result.applied) {
      toast.show(`${r.orderId} の差額調整に失敗しました（入金状態を確認してください）`);
      return;
    }
    const detail = [
      result.cascadeApplied > 0 && "受注確定",
      result.shipmentsCreated > 0 && `出荷指示 ${result.shipmentsCreated}件作成`,
      result.allocated > 0 && "在庫引当",
      result.shortageMarked > 0 && "在庫不足マーク",
    ]
      .filter(Boolean)
      .join("・");
    toast.show(
      `${r.orderId} の不足分 ¥${Math.abs(r.diff).toLocaleString()} を差額調整で消し込みました${detail ? `（${detail}）` : ""}`,
      "success",
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">金額不整合確認</h1>
            <HelpHint>
              入金額と受注額に差額が発生した受注を入金台帳からリアルタイム抽出します。{"\n"}
              不足は再請求、過剰は返金、わずかな端数は差額調整で対応します。{"\n"}
              対応が完了した行は自動的に一覧から消えます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            不整合: <span className="font-semibold text-amber-700">{stats.open}件</span> ／ 不足合計:{" "}
            <span className="font-semibold text-red-700">¥{stats.shortTotal.toLocaleString()}</span> ／ 過剰合計:{" "}
            <span className="font-semibold text-purple-700">¥{stats.overTotal.toLocaleString()}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">不整合件数</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.open}</p></GlassCard>
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
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {(["すべて", "未対応", "再請求中"] as const).map((o) => <option key={o}>{o}</option>)}
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
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">入金ID</th>
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
            {filtered.map((r) => {
              const status = statusOf(r);
              return (
                <tr key={r.paymentId} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{r.paymentId}</td>
                  <td className="px-3 py-2.5 font-medium text-blue-600">{r.orderId}</td>
                  <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">¥{r.orderAmt.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">¥{r.paidAmt.toLocaleString()}</td>
                  <td className={cn("px-3 py-2.5 text-right tabular-nums font-bold", r.diff < 0 ? "text-red-700" : "text-purple-700")}>{fmt(r.diff)}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-700">{r.reason}</td>
                  <td className={cn("px-3 py-2.5 text-center text-xs tabular-nums", r.daysOpen >= 7 && "text-red-700 font-semibold")}>{r.daysOpen}日</td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        status === "未対応" && "bg-red-500/15 text-red-700",
                        status === "再請求中" && "bg-amber-500/15 text-amber-700",
                      )}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex justify-center gap-1">
                      {r.kind === "不足" && (
                        <button onClick={() => handleRebill(r)} title="再請求メール" className="inline-flex p-1 rounded-lg hover:bg-white/60 text-blue-600">
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {r.kind === "過剰" && (
                        <button onClick={() => handleRefund(r)} title="過剰分を返金" className="inline-flex p-1 rounded-lg hover:bg-white/60 text-purple-600">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {r.kind === "不足" && (
                        <button onClick={() => setAdjustTarget(r)} title="差額調整（不足分消し込み）" className="inline-flex p-1 rounded-lg hover:bg-white/60 text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-10 text-center text-sm text-gray-400">
                  {rows.length === 0 ? "金額不整合はありません。すべての入金が受注額と一致しています" : "条件に一致する不整合はありません"}
                </td>
              </tr>
            )}
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
            <p className="text-xs">不足分の再請求メールを送信キューに投入。同一受注への重複送信は自動抑止。</p>
          </div>
          <div className="p-3 rounded-xl bg-white/50 border border-white/40">
            <p className="font-medium text-purple-700 mb-1">過剰: 返金処理</p>
            <p className="text-xs">過剰分を入金取消（返金）。入金台帳の入金額が受注額に戻り、不整合が解消されます。</p>
          </div>
          <div className="p-3 rounded-xl bg-white/50 border border-white/40">
            <p className="font-medium text-blue-700 mb-1">少額: 差額調整</p>
            <p className="text-xs">不足分を入金扱いで消し込み。完済到達で受注確定〜出荷指示〜在庫引当が自動連鎖します。</p>
          </div>
        </div>
      </GlassCard>

      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setAdjustTarget(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <GlassCard className="w-[420px] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-semibold text-gray-800">差額調整の確認</h3>
              </div>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-blue-600">{adjustTarget.orderId}</span>（{adjustTarget.customer}）の不足分{" "}
                <span className="font-bold text-red-700">¥{Math.abs(adjustTarget.diff).toLocaleString()}</span>{" "}
                を入金扱いで消し込みます。
              </p>
              <p className="text-xs text-gray-500">
                完済に到達するため、受注確定・出荷指示作成・在庫引当の連鎖が自動実行されます。この操作は入金台帳に反映されます。
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setAdjustTarget(null)}
                  className="h-9 px-4 rounded-xl text-sm text-gray-600 bg-white/50 border border-white/50 hover:bg-white/70"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleAdjust(adjustTarget)}
                  className="h-9 px-4 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  差額調整を実行
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
