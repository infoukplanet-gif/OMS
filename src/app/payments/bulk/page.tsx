"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  type PaymentState,
  paymentStatusBadge,
} from "@/lib/state-machines/payment";
import {
  matchPayments,
  type ReceiptEntry,
  type PaymentMatch,
  type UnmatchedReceipt,
} from "@/lib/calculations/payment-matching";
import { applyRecordPaymentCascade } from "@/lib/cascades/record-payment";
import { paymentStore, type PaymentRecord } from "@/lib/stores/payment";
import { orderStore } from "@/lib/stores/orders";
import { inventoryStore } from "@/lib/stores/inventory";
import { shipmentStore } from "@/lib/stores/shipment";
import { mailQueue } from "@/lib/mail/queue";
import { getAutoMailEnabled } from "@/lib/mail/auto-settings";
import { INITIAL_PAYMENTS } from "@/lib/seeds/payments";
import { INITIAL_ORDERS } from "@/lib/seeds/orders";
import { INITIAL_INVENTORY } from "@/lib/seeds/inventory";
import {
  Upload,
  Play,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  TrendingUp,
  XCircle,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// フォーマット
// ---------------------------------------------------------------------------
const fmt = (n: number) => `¥${n.toLocaleString()}`;

function reasonLabel(r: UnmatchedReceipt["reason"]): string {
  if (r === "order-not-found") return "受注番号不一致";
  if (r === "non-positive-amount") return "金額不正";
  return r;
}

const toState = (p: PaymentRecord): PaymentState => ({
  status: p.status,
  orderTotal: p.orderTotal,
  paidAmount: p.paidAmount,
  overpaid: p.overpaid,
});

// ---------------------------------------------------------------------------
// 初期サンプル受領明細（共有 INITIAL_PAYMENTS の未入金/一部入金 orderId に対応）
// ---------------------------------------------------------------------------
const CLEAN_INITIAL: ReceiptEntry[] = [
  { orderId: "ORD-2026-08843", amount:  67500, receivedAt: "2026-05-13", source: "三井住友銀行" }, // P001 完済
  { orderId: "ORD-2026-08849", amount: 154000, receivedAt: "2026-05-13", source: "三井住友銀行" }, // P002 完済
  { orderId: "ORD-2026-08841", amount:  26800, receivedAt: "2026-05-14", source: "みずほ銀行" },   // P003 一部→完済
  { orderId: "ORD-2026-08851", amount:  32400, receivedAt: "2026-05-14", source: "みずほ銀行" },   // P004 完済
  { orderId: "ORD-INVALID-999", amount: 12000, receivedAt: "2026-05-14", source: "三菱UFJ" },      // 受注番号不一致
  { orderId: "ORD-2026-08843", amount:   -500, receivedAt: "2026-05-14", source: "三菱UFJ" },      // 金額不正
];

// ---------------------------------------------------------------------------
// コンポーネント
// ---------------------------------------------------------------------------
export default function PaymentBulkPage() {
  const toast = useToast();

  // 共有ストアを seed（消込確定で受注確定→出荷生成→在庫引当まで連鎖させるため
  // payment / order / inventory を揃える）。shipment は cascade 内で生成される。
  useEffect(() => {
    if (paymentStore.getState().length === 0) paymentStore.setItems(INITIAL_PAYMENTS);
    if (orderStore.getState().length === 0) orderStore.setItems(INITIAL_ORDERS);
    if (inventoryStore.getState().length === 0) inventoryStore.setItems(INITIAL_INVENTORY);
  }, []);

  const payments = useSyncExternalStore(
    (cb) => paymentStore.subscribe(cb),
    () => paymentStore.getState(),
    () => INITIAL_PAYMENTS,
  ) as ReadonlyArray<PaymentRecord & { customer?: string; method?: string }>;

  // 受領明細リスト（手動追加可能）
  const [receipts, setReceipts] = useState<ReceiptEntry[]>(CLEAN_INITIAL);

  // マッチング結果
  const [result, setResult] = useState<{
    matches: PaymentMatch[];
    unmatched: UnmatchedReceipt[];
  } | null>(null);

  // フィルタ
  const [matchKeyword, setMatchKeyword] = useState("");
  const [unmatchKeyword, setUnmatchKeyword] = useState("");

  // 手動行追加フォーム
  const [newOrderId, setNewOrderId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newSource, setNewSource] = useState("手動入力");

  // 照合元 Map（共有 paymentStore から導出）と消込対象（未完済）一覧
  const paymentMap = useMemo(
    () => new Map(payments.map((p) => [p.orderId, toState(p)])),
    [payments],
  );
  const targetOrders = useMemo(
    () => payments.filter((p) => p.status !== "入金済み"),
    [payments],
  );
  const paymentIdByOrder = useMemo(
    () => new Map(payments.map((p) => [p.orderId, p.id])),
    [payments],
  );

  // ---- KPI（受領明細ベース）------------------------------------------------
  const receiptStats = useMemo(() => {
    const total = receipts.reduce((s, r) => s + Math.max(r.amount, 0), 0);
    return { count: receipts.length, total };
  }, [receipts]);

  // ---- マッチング実行 -------------------------------------------------------
  function handleMatch() {
    const r = matchPayments(receipts, paymentMap);
    setResult(r);
    toast.show(
      `マッチング完了: ${r.matches.length}件マッチ / ${r.unmatched.length}件未マッチ`,
      "success",
    );
  }

  // ---- 全件確定（共有ストアへ実反映 + 受注確定〜在庫引当の連鎖） --------------
  /**
   * マッチした各受領明細を applyRecordPaymentCascade で paymentStore に記録。
   * 完済に到達した受注は confirmPayment → 出荷指示作成 → 在庫引当まで自動連鎖する。
   * 受領明細は orderId 単位で複数あり得るので、明細ごとに金額を積む（store が累積）。
   */
  function handleConfirmAll() {
    if (!result) return;
    let recorded = 0;
    let confirmed = 0;
    let shipmentsCreated = 0;
    let allocated = 0;
    let shortageMarked = 0;
    let enqueued = 0;

    for (const m of result.matches) {
      const paymentId = paymentIdByOrder.get(m.orderId);
      if (paymentId === undefined) continue;
      const res = applyRecordPaymentCascade(paymentId, m.amount, {
        paymentStore,
        orderStore,
        shipmentStore,
        inventoryStore,
        mailQueue,
        autoMailEnabled: getAutoMailEnabled(),
      });
      if (res.applied) recorded += 1;
      confirmed += res.cascadeApplied;
      shipmentsCreated += res.shipmentsCreated;
      allocated += res.allocated;
      shortageMarked += res.shortageMarked;
      enqueued += res.enqueued;
    }

    setResult(null);
    setReceipts([]);

    const detail = [
      `入金 ${recorded}件記録`,
      confirmed > 0 ? `受注確定 ${confirmed}件` : "",
      shipmentsCreated > 0 ? `出荷指示 ${shipmentsCreated}件作成` : "",
      allocated > 0 ? `引当 ${allocated}SKU` : "",
      shortageMarked > 0 ? `在庫不足 ${shortageMarked}件` : "",
      enqueued > 0 ? `メール ${enqueued}件` : "",
    ]
      .filter(Boolean)
      .join("・");
    toast.show(detail, shortageMarked > 0 ? "info" : "success");
  }

  // ---- 明細行の削除 ---------------------------------------------------------
  function handleDeleteReceipt(index: number) {
    setReceipts((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  }

  // ---- 手動行追加 -----------------------------------------------------------
  function handleAddRow() {
    const amount = Number(newAmount);
    if (!newOrderId.trim()) {
      toast.show("受注番号を入力してください", "error" as never);
      return;
    }
    if (Number.isNaN(amount)) {
      toast.show("金額は数値で入力してください", "error" as never);
      return;
    }
    setReceipts((prev) => [
      ...prev,
      { orderId: newOrderId.trim(), amount, receivedAt: new Date().toISOString().slice(0, 10), source: newSource },
    ]);
    setNewOrderId("");
    setNewAmount("");
    setResult(null);
    toast.show("明細行を追加しました", "success");
  }

  // ---- フィルタ済みマッチ結果 -----------------------------------------------
  const filteredMatches = useMemo(() => {
    if (!result) return [];
    const k = matchKeyword.toLowerCase();
    if (!k) return result.matches;
    return result.matches.filter((m) => m.orderId.toLowerCase().includes(k));
  }, [result, matchKeyword]);

  const filteredUnmatched = useMemo(() => {
    if (!result) return [];
    const k = unmatchKeyword.toLowerCase();
    if (!k) return result.unmatched;
    return result.unmatched.filter((u) => u.orderId.toLowerCase().includes(k));
  }, [result, unmatchKeyword]);

  // ---- 確定後KPI ------------------------------------------------------------
  const resultStats = useMemo(() => {
    if (!result) return null;
    const totalAmount = result.matches.reduce((s, m) => s + m.amount, 0);
    const settled = result.matches.filter((m) => m.after.status === "入金済み").length;
    return {
      matchCount: result.matches.length,
      unmatchCount: result.unmatched.length,
      totalAmount,
      settled,
    };
  }, [result]);

  // ---------------------------------------------------------------------------
  // レンダリング
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-5">
      {/* ---- ヘッダー -------------------------------------------------------- */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">一括入金消込</h1>
            <HelpHint>
              銀行CSV等の受領明細を取り込み、受注番号をキーに自動マッチングします。{"\n"}
              マッチ結果を確認後「全件確定」で入金状態を一括更新します。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            受領明細: <span className="font-semibold">{receiptStats.count}件</span> ／
            合計入金額: <span className="font-semibold">{fmt(receiptStats.total)}</span>
          </p>
        </div>
        <button
          onClick={handleMatch}
          disabled={receipts.length === 0}
          className={cn(
            "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all",
            receipts.length > 0
              ? "bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90"
              : "bg-white/50 border border-white/50 text-gray-400 cursor-not-allowed",
          )}
        >
          <Play className="h-4 w-4" />マッチング実行
        </button>
      </div>

      {/* ---- KPIカード（マッチング後） --------------------------------------- */}
      {resultStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />マッチ件数
            </div>
            <p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">
              {resultStats.matchCount}
            </p>
            <p className="mt-1 text-xs text-gray-400">件</p>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertTriangle className="h-4 w-4 text-amber-500" />未マッチ件数
            </div>
            <p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">
              {resultStats.unmatchCount}
            </p>
            <p className="mt-1 text-xs text-gray-400">件</p>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Banknote className="h-4 w-4 text-blue-500" />合計入金額
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-700 tabular-nums">
              {fmt(resultStats.totalAmount)}
            </p>
            <p className="mt-1 text-xs text-gray-400">マッチ分のみ</p>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4 text-emerald-500" />完済件数
            </div>
            <p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">
              {resultStats.settled}
            </p>
            <p className="mt-1 text-xs text-gray-400">入金済みに移行</p>
          </GlassCard>
        </div>
      )}

      {/* ---- 対象受注一覧（サイドパネル相当） --------------------------------- */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-800">対象受注（消込対象 Map）</h2>
            <HelpHint>
              マッチングの照合元となる受注一覧です。{"\n"}
              未入金・一部入金が消込対象です。
            </HelpHint>
          </div>
          <span className="text-xs text-gray-400">{targetOrders.length}件</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注番号</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">受注額</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">入金済</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">残額</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
              </tr>
            </thead>
            <tbody>
              {targetOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-400">
                    消込対象の受注はありません（すべて入金済み）
                  </td>
                </tr>
              ) : (
                targetOrders.map((p) => {
                  const balance = p.orderTotal - p.paidAmount;
                  return (
                    <tr key={p.orderId} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                      <td className="px-3 py-2 font-mono text-xs text-blue-600">{p.orderId}</td>
                      <td className="px-3 py-2 text-gray-800 text-xs">{(p.customer as string) ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs text-gray-700">{fmt(p.orderTotal)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs text-emerald-700">{fmt(p.paidAmount)}</td>
                      <td className={cn(
                        "px-3 py-2 text-right tabular-nums text-xs",
                        balance > 0 ? "text-red-700 font-semibold" : p.overpaid ? "text-purple-700 font-semibold" : "text-gray-400",
                      )}>
                        {balance !== 0 ? fmt(Math.abs(balance)) : "—"}
                        {p.overpaid && <span className="ml-0.5">(超過)</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          p.overpaid ? "bg-purple-500/15 text-purple-700" : paymentStatusBadge[p.status],
                        )}>
                          {p.overpaid ? "過剰入金" : p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ---- 受領明細の取込 -------------------------------------------------- */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-800">受領明細（ReceiptEntry 一覧）</h2>
            <HelpHint>
              銀行CSV等から取り込んだ入金明細です。{"\n"}
              受注番号と金額をキーに自動マッチングします。
            </HelpHint>
          </div>
          <span className="text-xs text-gray-400">{receipts.length}件</span>
        </div>

        {/* CSVアップロードエリア */}
        <div className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-blue-300/60 bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer mb-4">
          <Upload className="h-7 w-7 text-blue-400" />
          <p className="text-sm font-medium text-gray-600">CSVファイルをドラッグ＆ドロップ</p>
          <p className="text-xs text-gray-400">または以下から手動で明細を追加</p>
        </div>

        {/* 手動行追加フォーム */}
        <div className="flex flex-wrap items-end gap-2 mb-4 p-3 rounded-xl bg-white/40 border border-white/50">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-gray-500">受注番号</label>
            <input
              value={newOrderId}
              onChange={(e) => setNewOrderId(e.target.value)}
              placeholder="ORD-2026-XXXXX"
              className="mt-1 w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="w-36">
            <label className="text-xs text-gray-500">入金額（円）</label>
            <input
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="例: 15000"
              type="number"
              min={0}
              className="mt-1 w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="w-36">
            <label className="text-xs text-gray-500">取込元</label>
            <select
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              className="mt-1 w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["手動入力", "三井住友銀行", "みずほ銀行", "三菱UFJ", "Stripe", "ヤマト代引"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80"
          >
            <Plus className="h-4 w-4" />行追加
          </button>
        </div>

        {/* 明細テーブル */}
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注番号</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">入金額</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">入金日</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">取込元</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-400">
                    受領明細がありません。CSVをアップロードするか手動で追加してください。
                  </td>
                </tr>
              ) : (
                receipts.map((r, i) => (
                  <tr key={i} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                    <td className="px-3 py-2 font-mono text-xs text-blue-600">{r.orderId}</td>
                    <td className={cn(
                      "px-3 py-2 text-right tabular-nums text-xs font-medium",
                      r.amount <= 0 ? "text-red-600" : "text-gray-800",
                    )}>
                      {fmt(r.amount)}
                      {r.amount <= 0 && <span className="ml-1 text-red-500">(不正)</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 tabular-nums">{r.receivedAt ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{r.source ?? "—"}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleDeleteReceipt(i)}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ---- マッチ結果テーブル ---------------------------------------------- */}
      {result && (
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <h2 className="text-base font-semibold text-gray-800">マッチ結果</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">
                {result.matches.length}件
              </span>
            </div>
            <div className="relative">
              <input
                value={matchKeyword}
                onChange={(e) => setMatchKeyword(e.target.value)}
                placeholder="受注番号で絞り込み"
                className="h-8 pl-3 pr-4 rounded-xl text-xs bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-52"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50 border-b border-white/40">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注番号</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">入金額</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">変更前ステータス</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <ChevronRight className="inline h-3 w-3" />
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">変更後ステータス</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">入金済累計 前→後</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">過剰</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-5 text-center text-sm text-gray-400">
                      該当するマッチ結果がありません
                    </td>
                  </tr>
                ) : (
                  filteredMatches.map((m, i) => (
                    <tr key={i} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                      <td className="px-3 py-2 font-mono text-xs text-blue-600">{m.orderId}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs font-semibold text-emerald-700">
                        {fmt(m.amount)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          m.before.overpaid ? "bg-purple-500/15 text-purple-700" : paymentStatusBadge[m.before.status],
                        )}>
                          {m.before.overpaid ? "過剰入金" : m.before.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-300 text-xs">→</td>
                      <td className="px-3 py-2 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          m.after.overpaid ? "bg-purple-500/15 text-purple-700" : paymentStatusBadge[m.after.status],
                        )}>
                          {m.after.overpaid ? "過剰入金" : m.after.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs text-gray-600">
                        <span className="text-gray-400">{fmt(m.before.paidAmount)}</span>
                        <span className="mx-1 text-gray-300">→</span>
                        <span className="font-semibold text-gray-800">{fmt(m.after.paidAmount)}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {m.after.overpaid ? (
                          <AlertTriangle className="inline h-4 w-4 text-purple-600" />
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* ---- 未マッチテーブル ------------------------------------------------- */}
      {result && result.unmatched.length > 0 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-semibold text-gray-800">未マッチ明細</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700">
                {result.unmatched.length}件
              </span>
            </div>
            <div className="relative">
              <input
                value={unmatchKeyword}
                onChange={(e) => setUnmatchKeyword(e.target.value)}
                placeholder="受注番号で絞り込み"
                className="h-8 pl-3 pr-4 rounded-xl text-xs bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-52"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50 border-b border-white/40">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注番号</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">入金額</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">未マッチ理由</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnmatched.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-5 text-center text-sm text-gray-400">
                      該当する未マッチ明細がありません
                    </td>
                  </tr>
                ) : (
                  filteredUnmatched.map((u, i) => (
                    <tr key={i} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                      <td className="px-3 py-2 font-mono text-xs text-red-600">{u.orderId}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs text-gray-700">{fmt(u.amount)}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-700">
                          {reasonLabel(u.reason)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* ---- フッターアクション ---------------------------------------------- */}
      {result && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setResult(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80"
          >
            結果をクリア
          </button>
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-400">
              マッチ {result.matches.length}件 / 未マッチ {result.unmatched.length}件
            </p>
            <button
              onClick={handleConfirmAll}
              disabled={result.matches.length === 0}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all",
                result.matches.length > 0
                  ? "bg-emerald-500/80 backdrop-blur-xl border border-emerald-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-emerald-500/90"
                  : "bg-white/50 border border-white/50 text-gray-400 cursor-not-allowed",
              )}
            >
              <CheckCircle2 className="h-4 w-4" />全件確定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
