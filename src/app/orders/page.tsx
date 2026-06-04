"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import {
  type OrderStatus,
  type OrderAction,
  ORDER_STATUSES,
  orderStatusBadge,
  isCancellable,
} from "@/lib/state-machines/order";
import { mailQueue, type MailJob } from "@/lib/mail/queue";
import { getAutoMailEnabled } from "@/lib/mail/auto-settings";
import { orderStore } from "@/lib/stores/orders";
import { inventoryStore } from "@/lib/stores/inventory";
import { planOrderAllocation } from "@/lib/allocation/plan";
import { getAllocationRules } from "@/lib/allocation/rules";
import { shipmentStore } from "@/lib/stores/shipment";
import { paymentStore } from "@/lib/stores/payment";
import { INITIAL_INVENTORY } from "@/lib/seeds/inventory";
import { INITIAL_ORDERS, type OrderSeed } from "@/lib/seeds/orders";
import { INITIAL_PAYMENTS } from "@/lib/seeds/payments";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  Search,
  Plus,
  Upload,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

type Order = OrderSeed;

const statusBadge = orderStatusBadge;

const paymentBadge: Record<string, string> = {
  クレジットカード: "bg-purple-500/15 text-purple-700",
  銀行振込: "bg-blue-500/15 text-blue-700",
  代金引換: "bg-orange-500/15 text-orange-700",
  請求書払い: "bg-teal-500/15 text-teal-700",
};

const shopColors: Record<string, string> = {
  楽天市場: "bg-red-500",
  Amazon: "bg-orange-400",
  Shopify: "bg-green-500",
  "Yahoo!": "bg-purple-500",
};

const initial: Order[] = INITIAL_ORDERS;

const tabs: { label: string; value: "all" | OrderStatus }[] = [
  { label: "すべて", value: "all" },
  ...ORDER_STATUSES.map((s) => ({ label: s, value: s as OrderStatus })),
];

const shops = ["楽天市場", "Amazon", "Shopify", "Yahoo!"];
const payments = ["クレジットカード", "銀行振込", "代金引換", "請求書払い"];

const fmtDate = (d: Date | undefined) =>
  d ? `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}` : "";

export default function OrdersPage() {
  // 受注ドメインの正規オーナーページ: 初回 restore → なければ seed、変更を debounce 永続化。
  // DATABASE_URL 未設定時は restore=null / snapshot=no-db でフォールバックし、
  // in-memory のみで動く（dev / e2e 継続性を維持）。
  usePersistentStore({
    store: orderStore,
    domain: "orders",
    seed: initial,
  });
  // inventory / payment は各自のオーナーページが永続化する。ここでは受注画面から
  // 先に入った場合に引当・返金 cascade が着地するための防御的シードのみ。
  useEffect(() => {
    if (inventoryStore.getState().length === 0) {
      inventoryStore.setItems(INITIAL_INVENTORY);
    }
    if (paymentStore.getState().length === 0) {
      paymentStore.setItems(INITIAL_PAYMENTS);
    }
  }, []);
  const storeItems = useSyncExternalStore(
    (cb) => orderStore.subscribe(cb),
    () => orderStore.getState(),
    () => initial,
  );
  // 表示用の Order 型にキャスト（store には付加プロパティが any として乗っている）
  const items = storeItems as ReadonlyArray<Order>;

  const [activeTab, setActiveTab] = useState<"all" | OrderStatus>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [shopFilter, setShopFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);

  /**
   * 選択中の受注のキャンセル概要を算出する（確認ダイアログ表示用）。
   * キャンセル可能な受注数と、入金済み/一部入金分の返金見込み（件数・合計額）を返す。
   */
  const cancelSummary = () => {
    const orders = orderStore.getState() as ReadonlyArray<Order>;
    const pays = paymentStore.getState();
    const cancellable = selected
      .map((id) => orders.find((o) => o.id === id))
      .filter((o): o is Order => !!o && isCancellable(o.status));
    let refundCount = 0;
    let refundAmount = 0;
    for (const o of cancellable) {
      const p = pays.find((x) => x.orderId === o.id);
      if (p && p.paidAmount > 0) {
        refundCount++;
        refundAmount += p.paidAmount;
      }
    }
    return { cancellable: cancellable.length, refundCount, refundAmount };
  };

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((o) => {
      if (activeTab !== "all" && o.status !== activeTab) return false;
      if (k && !`${o.id} ${o.customer}`.toLowerCase().includes(k)) return false;
      if (shopFilter !== "all" && o.shop !== shopFilter) return false;
      if (paymentFilter !== "all" && o.payment !== paymentFilter) return false;
      const orderDate = o.date.slice(0, 10);
      if (dateFrom && orderDate < dateFrom) return false;
      if (dateTo && orderDate > dateTo) return false;
      return true;
    });
  }, [items, activeTab, keyword, shopFilter, paymentFilter, dateFrom, dateTo]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const o of items) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [items]);

  const toggleSelect = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleAll = () =>
    setSelected((p) => (p.length === filtered.length ? [] : filtered.map((o) => o.id)));

  const hasFilter = keyword || shopFilter !== "all" || paymentFilter !== "all" || dateFrom || dateTo;
  const toast = useToast();

  /**
   * 選択中の受注に対して一括で SM 遷移を試み、handler effects を mailQueue と
   * inventoryStore に流す。
   * - ガード違反（遷移できない受注）はスキップしカウント
   * - effects.sendMail → mailQueue.enqueueAll
   * - effects.allocateInventory → 当該受注の allocation を inventoryStore.applyAllocate
   *   引当失敗（appliedCount===0 && failed>0）なら markInventoryShortage を自動連鎖
   *   → inventoryShortage バッジが立ち、行ごとの「引当再試行」ボタンが現れる。
   * - effects.releaseInventory → 当該受注の allocation を inventoryStore.applyRelease
   */
  const applyBulkAction = (action: OrderAction, label: string) => {
    if (selected.length === 0) return;

    let applied = 0;
    let skipped = 0;
    let allocated = 0;
    let released = 0;
    let shortageMarked = 0;
    let shipmentsCreated = 0;
    let refunded = 0;
    let refundedAmount = 0;
    const mailJobs: MailJob[] = [];

    for (const id of selected) {
      const before = orderStore.getState().find((o) => o.id === id) as Order | undefined;
      const result = orderStore.applyTransition(id, action);
      if (!result.applied) {
        skipped++;
        continue;
      }
      if (result.effects.sendMail) mailJobs.push(result.effects.sendMail);

      // 出荷指示の自動作成 cascade
      if (result.effects.createShipment && before) {
        const created = shipmentStore.createForOrder(result.effects.createShipment.orderId, {
          customer: before.customer,
          shop: before.shop,
          items: before.items,
          amount: before.amount,
        });
        if (created.created) shipmentsCreated++;
      }

      // 在庫 cascade: 当該 Order の需要をルール適用で倉庫別に引当て、inventoryStore に流す
      if (result.effects.allocateInventory && before?.allocation) {
        const plan = planOrderAllocation(id, before.allocation, inventoryStore.getState(), getAllocationRules());
        if (plan.ok) {
          const cascade = inventoryStore.applyAllocate(plan.allocation.lines);
          allocated += cascade.appliedCount;
          // 確定した倉庫別ラインを order に書き戻す（出荷確定の消費・取消の解放で同一ラインを使う）
          orderStore.patch(id, { allocation: plan.allocation.lines });
        } else {
          // 在庫不足 → markInventoryShortage で在庫不足バッジを立てる
          const shortageRes = orderStore.applyTransition(id, "markInventoryShortage");
          if (shortageRes.applied) shortageMarked++;
        }
      }
      if (result.effects.releaseInventory && before?.allocation) {
        const cascade = inventoryStore.applyRelease(before.allocation);
        released += cascade.appliedCount;
      }

      // 返金 cascade: キャンセル到達かつ入金あり（paidAmount > 0）なら全額返金。
      // payment の effects は消費しない（受注は別途キャンセル遷移済みのため revert 不要）。
      if (result.effects.refundPayment) {
        const pay = paymentStore.getState().find((p) => p.orderId === id);
        if (pay && pay.paidAmount > 0) {
          const refundRes = paymentStore.applyCancel(pay.id, pay.paidAmount, {
            orderStatus: "キャンセル",
          });
          if (refundRes.applied) {
            refunded++;
            refundedAmount += pay.paidAmount;
          }
        }
      }

      applied++;
    }

    setSelected([]);

    const mailResult = mailQueue.enqueueAll(mailJobs, getAutoMailEnabled());
    const mailDetail = [
      mailResult.enqueued > 0 ? `enqueue ${mailResult.enqueued}件` : "",
      mailResult.duplicateSkipped > 0 ? `重複 ${mailResult.duplicateSkipped}件` : "",
      mailResult.disabledSkipped > 0 ? `無効化 ${mailResult.disabledSkipped}件` : "",
    ]
      .filter(Boolean)
      .join("・");
    const mailLine = mailDetail ? ` / メール ${mailDetail}` : "";

    const invDetail = [
      allocated > 0 ? `引当 ${allocated}件` : "",
      released > 0 ? `引当戻し ${released}件` : "",
      shortageMarked > 0 ? `在庫不足マーク ${shortageMarked}件` : "",
    ]
      .filter(Boolean)
      .join("・");
    const invLine = invDetail ? ` / 在庫 ${invDetail}` : "";

    const shipLine = shipmentsCreated > 0 ? ` / 出荷指示 ${shipmentsCreated}件作成` : "";
    const refundLine = refunded > 0 ? ` / 返金 ${refunded}件（¥${refundedAmount.toLocaleString()}）` : "";

    if (applied === 0) {
      toast.show(`${label} を実行できる受注がありません（${skipped} 件スキップ）`, "info");
    } else {
      toast.show(
        `${label}: ${applied} 件適用${skipped > 0 ? `・${skipped}件スキップ` : ""}${invLine}${refundLine}${shipLine}${mailLine}`,
        shortageMarked > 0 ? "info" : "success",
      );
    }
  };

  /**
   * 在庫不足マーク中の受注を行ごとに引当再試行する。
   * - inventoryStore.applyAllocate → 成功時は SM allocateInventory を打って印刷待ちへ
   * - 失敗時は引き続き在庫不足バッジを維持
   */
  const retryAllocate = (order: Order) => {
    const plan = planOrderAllocation(order.id, order.allocation, inventoryStore.getState(), getAllocationRules());
    if (!plan.ok) {
      toast.show(`${order.id}: 在庫が依然として不足しています`, "info");
      return;
    }
    const cascade = inventoryStore.applyAllocate(plan.allocation.lines);
    if (cascade.appliedCount === 0) {
      toast.show(`${order.id}: 在庫が依然として不足しています`, "info");
      return;
    }
    orderStore.patch(order.id, { allocation: plan.allocation.lines });
    const smResult = orderStore.applyTransition(order.id, "allocateInventory");
    if (!smResult.applied) {
      // 万一の不整合（引当待ち以外で再試行された等）。inventory は加算済なので戻す。
      inventoryStore.applyRelease(plan.allocation.lines);
      toast.show(`${order.id}: 引当再試行に失敗しました`, "error");
      return;
    }
    toast.show(`${order.id} を印刷待ちに進めました（在庫引当成功）`, "success");
  };

  const summary = cancelConfirm ? cancelSummary() : null;

  return (
    <div className="space-y-5">
      {/* キャンセル確認ダイアログ（返金が絡むため必ず確認を挟む） */}
      {cancelConfirm && summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h2 className="text-base font-semibold text-gray-800">受注をキャンセルしますか？</h2>
                {summary.cancellable === 0 ? (
                  <p className="text-sm text-gray-600 mt-2">
                    選択中の {selected.length} 件にキャンセル可能な受注はありません（出荷済みは返品フロー）。
                  </p>
                ) : (
                  <div className="text-sm text-gray-700 mt-2 space-y-2">
                    <p>
                      キャンセル可能 <span className="font-semibold text-gray-900">{summary.cancellable}</span> 件を処理します。引当済みの在庫は解放されます。
                    </p>
                    {summary.refundCount > 0 ? (
                      <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-3">
                        <p className="text-rose-700 font-medium">
                          返金 {summary.refundCount} 件・合計 ¥{summary.refundAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          入金済み・一部入金の受注は、入金額を全額返金として記録します（入金ステータスは未入金に戻ります）。
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">入金のある受注がないため、返金は発生しません。</p>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-4 justify-end">
                  <button
                    onClick={() => setCancelConfirm(false)}
                    className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
                  >
                    閉じる
                  </button>
                  {summary.cancellable > 0 && (
                    <button
                      onClick={() => {
                        applyBulkAction("cancel", "キャンセル");
                        setCancelConfirm(false);
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500/80 border border-rose-400/50 text-white hover:bg-rose-500/90"
                    >
                      キャンセルを実行
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">受注一覧</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/orders/import"
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80 transition-all")}
          >
            <Upload className="h-4 w-4" />
            CSVインポート
          </Link>
          <Link
            href="/orders/new"
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90 transition-all")}
          >
            <Plus className="h-4 w-4" />
            受注登録
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-max sm:w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setSelected([]); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 whitespace-nowrap",
                activeTab === tab.value
                  ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
              )}
            >
              {tab.label}
              <span className={cn("px-1.5 py-0.5 rounded-md text-xs", activeTab === tab.value ? "bg-blue-500/15 text-blue-700 font-medium" : "bg-gray-500/10 text-gray-500")}>
                {(tab.value === "all" ? counts.all : counts[tab.value] || 0).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_repeat(2,minmax(140px,180px))_minmax(280px,auto)_auto] gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            type="text"
            placeholder="受注番号・顧客名で検索"
            className={cn("w-full h-9 pl-10 pr-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20")}
          />
        </div>
        <select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)} className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="all">店舗: すべて</option>
          {shops.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="all">支払方法: すべて</option>
          {payments.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="flex items-center gap-1.5 min-w-0">
          <DatePicker compact placeholder="開始日" onChange={(d) => setDateFrom(fmtDate(d))} />
          <span className="text-xs text-gray-400 shrink-0">〜</span>
          <DatePicker compact placeholder="終了日" onChange={(d) => setDateTo(fmtDate(d))} />
        </div>
        {hasFilter && (
          <button
            onClick={() => { setKeyword(""); setShopFilter("all"); setPaymentFilter("all"); setDateFrom(""); setDateTo(""); }}
            className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 text-gray-600 hover:bg-white/70 whitespace-nowrap"
          >
            クリア
          </button>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注番号</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">店舗</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客名</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">点数</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">支払方法</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注日時</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className={cn("border-t border-white/30 transition-colors", selected.includes(order.id) ? "bg-blue-500/5" : "hover:bg-white/40")}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selected.includes(order.id)} onChange={() => toggleSelect(order.id)} className="rounded border-gray-300" />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Link href={`/orders/${order.id}/edit`} className="font-medium text-blue-600 hover:underline">{order.id}</Link>
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", shopColors[order.shop])} />
                      {order.shop}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-700">{order.customer}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{order.items}</td>
                  <td className="px-3 py-3 text-right font-medium text-gray-800 tabular-nums">¥{order.amount.toLocaleString()}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", paymentBadge[order.payment])}>{order.payment}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", statusBadge[order.status])}>{order.status}</span>
                      {order.inventoryShortage && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-700 whitespace-nowrap">
                          <AlertTriangle className="h-3 w-3" />在庫不足
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{order.date}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {order.inventoryShortage && (
                        <button
                          onClick={() => retryAllocate(order)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 transition-colors"
                          title="在庫引当を再試行"
                        >
                          <RefreshCw className="h-3 w-3" />引当再試行
                        </button>
                      )}
                      <Link href={`/orders/${order.id}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="編集">
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-sm text-gray-400">該当する受注がありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-white/40 bg-white/30">
          <div className="min-h-[28px]">
            {selected.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 font-medium">{selected.length} 件選択中</span>
                <button
                  onClick={() => applyBulkAction("requestPayment", "入金待ちへ進める")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors"
                  title="確認待ち → 入金待ち（サンクスメール送信）"
                >
                  入金待ちへ
                </button>
                <button
                  onClick={() => applyBulkAction("confirmPayment", "入金確認")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 transition-colors"
                  title="入金待ち → 引当待ち（在庫引当を自動連鎖、失敗時は在庫不足バッジ）"
                >
                  入金確認
                </button>
                <button
                  onClick={() => applyBulkAction("markPrinted", "印刷済みにする")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/15 text-indigo-700 hover:bg-indigo-500/25 transition-colors"
                >
                  印刷済みにする
                </button>
                <button
                  onClick={() => applyBulkAction("registerShipment", "出荷登録")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 transition-colors"
                >
                  出荷登録
                </button>
                <button
                  onClick={() => setCancelConfirm(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 transition-colors"
                >
                  キャンセル
                </button>
                <button onClick={() => toast.show(`${selected.length} 件をエクスポートしました`, "success")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-500/15 text-gray-600 hover:bg-gray-500/25 transition-colors">エクスポート</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">{filtered.length} 件 / 全 {items.length} 件</span>
            <div className="flex gap-1">
              <button
                onClick={() => toast.show("ページネーションは v2 で実装予定", "info")}
                aria-label="前のページ"
                className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-400 hover:bg-white/70 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => toast.show("ページネーションは v2 で実装予定", "info")}
                aria-label="次のページ"
                className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-600 hover:bg-white/70 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
