"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import {
  SHIPMENT_STATUSES,
  shipmentStatusBadge,
  type ShipmentStatus,
} from "@/lib/state-machines/shipment";
import { mailQueue, type MailJob } from "@/lib/mail/queue";
import { getAutoMailEnabled } from "@/lib/mail/auto-settings";
import { orderStore } from "@/lib/stores/orders";
import { inventoryStore } from "@/lib/stores/inventory";
import { salesStore } from "@/lib/stores/sales";
import { shipmentStore, type ShipmentRecord } from "@/lib/stores/shipment";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import { applyConfirmShipmentCascade } from "@/lib/cascades/confirm-shipment";
import { INITIAL_INVENTORY } from "@/lib/seeds/inventory";
import { INITIAL_ORDERS } from "@/lib/seeds/orders";
import { INITIAL_SHIPMENTS } from "@/lib/seeds/shipments";
import type { AllocationLine } from "@/lib/state-machines/inventory";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileDown,
  FileText,
  CheckSquare,
} from "lucide-react";
import { ShipmentInstructionIssueModal } from "@/components/documents/shipment-instruction-issue-modal";
import { DeliveryNoteIssueModal } from "@/components/documents/delivery-note-issue-modal";
import type { ShipmentInstructionSource } from "@/lib/documents/shipment-instruction-document";
import type { DeliveryNoteSource } from "@/lib/documents/delivery-note-document";

type Shipment = ShipmentRecord & {
  customer: string;
  items: number;
  amount: number;
  carrier: string;
  shipDate: string;
  shop: string;
};

// 初期シードは src/lib/seeds/shipments.ts (INITIAL_SHIPMENTS) に集約。
// shipments/tracking ページからも同じシードを共有する。

const carrierIcon: Record<string, { color: string; label: string }> = {
  ヤマト運輸: { color: "bg-green-500", label: "ヤ" },
  佐川急便: { color: "bg-blue-600", label: "佐" },
  日本郵便: { color: "bg-red-500", label: "郵" },
  西濃運輸: { color: "bg-amber-500", label: "西" },
  福山通運: { color: "bg-indigo-500", label: "福" },
};

type TabValue = "all" | ShipmentStatus;

const carriers = ["ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運"];

export default function ShipmentsPage() {
  const toast = useToast();

  // 出荷ドメインの正規オーナーページ: 初回 restore → なければ seed、変更を debounce 永続化。
  // 確定/キャンセル/トラッキング編集は store 経由。
  usePersistentStore({
    store: shipmentStore,
    domain: "shipments",
    seed: INITIAL_SHIPMENTS,
  });
  // orders / inventory は各自のオーナーページが永続化する。ここでは shipments から
  // 先に入った場合に cascade が動かない問題を回避するための防御的シードのみ。
  useEffect(() => {
    if (orderStore.getState().length === 0) {
      orderStore.setItems(INITIAL_ORDERS);
    }
    if (inventoryStore.getState().length === 0) {
      inventoryStore.setItems(INITIAL_INVENTORY);
    }
  }, []);
  const storeItems = useSyncExternalStore(
    (cb) => shipmentStore.subscribe(cb),
    () => shipmentStore.getState(),
    () => INITIAL_SHIPMENTS,
  );
  const items = storeItems as ReadonlyArray<Shipment>;

  const [activeTab, setActiveTab] = useState<TabValue>("出荷待ち");
  const [selected, setSelected] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [shipDateFilter, setShipDateFilter] = useState("");
  const [instructionModalSource, setInstructionModalSource] = useState<ShipmentInstructionSource | null>(null);
  const [deliveryNoteModalSource, setDeliveryNoteModalSource] = useState<DeliveryNoteSource | null>(null);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((s) => {
      if (activeTab !== "all" && s.status !== activeTab) return false;
      if (k && !`${s.id} ${s.customer}`.toLowerCase().includes(k)) return false;
      if (carrierFilter !== "all" && s.carrier !== carrierFilter) return false;
      if (shipDateFilter && s.shipDate !== shipDateFilter) return false;
      return true;
    });
  }, [items, activeTab, keyword, carrierFilter, shipDateFilter]);

  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  // フィルター・タブ変更で結果セットが変わったら 1 ページ目に戻す。
  // effect ではなくレンダー中に直前のフィルターキーと比較して補正する
  // （React 推奨パターン: setState-in-effect の連鎖レンダーを避ける）。
  const filterKey = `${activeTab}|${keyword}|${carrierFilter}|${shipDateFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const countByStatus = useMemo(() => {
    const map = new Map<ShipmentStatus, number>();
    for (const status of SHIPMENT_STATUSES) map.set(status, 0);
    for (const s of items) map.set(s.status, (map.get(s.status) ?? 0) + 1);
    return map;
  }, [items]);

  const tabs: { label: string; value: TabValue; count: number }[] = [
    { label: "すべて", value: "all", count: items.length },
    ...SHIPMENT_STATUSES.map((s) => ({
      label: s,
      value: s as TabValue,
      count: countByStatus.get(s) ?? 0,
    })),
  ];

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected((prev) => (prev.length === filtered.length ? [] : filtered.map((s) => s.id)));

  const updateTracking = (id: string, trackingNumber: string) => {
    const next = shipmentStore
      .getState()
      .map((s) => (s.id === id ? { ...s, trackingNumber } : s));
    shipmentStore.setItems(next);
  };

  /**
   * 選択中の出荷を一括キャンセル。
   * - shipmentStore.applyTransition で SM 遷移 + handler effects を一気に取得
   * - effects.cascadeOrderAction (cancel) を shared orderStore に流す
   * - effects.releaseInventory が立った Shipment は、対応する Order の allocation を
   *   inventoryStore.applyRelease に流す。
   *   ⚠️ cascade で order.cancel が走ると order-handlers も releaseInventory を emit するが、
   *   それは無視する（shipment 側で既に release 済み・冪等性のため）。
   */
  const cancelShipping = () => {
    if (selected.length === 0) {
      toast.show("キャンセルする出荷を選択してください", "error");
      return;
    }
    let cancelled = 0;
    let cascadeApplied = 0;
    let cascadeSkipped = 0;
    let released = 0;

    for (const id of selected) {
      const sharedOrderId = shipmentStore.getState().find((s) => s.id === id)?.orderIds[0];
      const sharedOrder = sharedOrderId
        ? orderStore.getState().find((o) => o.id === sharedOrderId)
        : undefined;
      const result = shipmentStore.applyTransition(id, "cancel", {
        orderStatusAtCancel: sharedOrder?.status,
      });
      if (!result.applied) continue;

      // 在庫戻し: Shipment の cancel が常時 emit。対応する Order の allocation を解放。
      if (result.effects.releaseInventory && sharedOrder) {
        const allocation = sharedOrder.allocation as AllocationLine[] | undefined;
        if (allocation && allocation.length > 0) {
          const cascade = inventoryStore.applyRelease(allocation);
          released += cascade.appliedCount;
        }
      }

      // Order 側の cancel カスケード（return effects は無視 = release 二重実行回避）
      if (result.effects.cascadeOrderAction && sharedOrder) {
        const r = orderStore.applyTransition(
          result.effects.cascadeOrderAction.orderId,
          result.effects.cascadeOrderAction.action,
        );
        if (r.applied) cascadeApplied += 1;
        else cascadeSkipped += 1;
      }

      cancelled += 1;
    }

    if (cancelled === 0) {
      toast.show("選択した出荷は出荷済み/キャンセル済みのためキャンセルできません", "error");
      setSelected([]);
      return;
    }

    const detail = [
      cascadeApplied > 0 ? `受注キャンセル連鎖 ${cascadeApplied}件` : "",
      cascadeSkipped > 0 ? `カスケード ${cascadeSkipped}件スキップ` : "",
      released > 0 ? `在庫戻し ${released}SKU` : "",
    ]
      .filter(Boolean)
      .join("・");
    const tail = detail ? ` / ${detail}` : "";

    toast.show(`${cancelled} 件の出荷をキャンセルしました${tail}`, "success");
    setSelected([]);
  };

  const confirmShipping = () => {
    if (selected.length === 0) {
      toast.show("出荷確定する受注を選択してください", "error");
      return;
    }
    let succeeded = 0;
    let cascadeApplied = 0;
    let cascadeSkipped = 0;
    let consumed = 0;
    let consumeFailed = 0;
    let enqueued = 0;
    let duplicateSkipped = 0;
    let disabledSkipped = 0;
    let revenueRecognized = 0;

    for (const id of selected) {
      const result = applyConfirmShipmentCascade(id, {
        shipmentStore,
        orderStore,
        inventoryStore,
        salesStore,
        mailQueue,
        autoMailEnabled: getAutoMailEnabled(),
      });
      if (!result.applied) continue;
      cascadeApplied += result.cascadeApplied;
      cascadeSkipped += result.cascadeSkipped;
      consumed += result.consumed;
      consumeFailed += result.consumeFailed;
      enqueued += result.enqueued;
      duplicateSkipped += result.duplicateSkipped;
      disabledSkipped += result.disabledSkipped;
      revenueRecognized += result.revenueRecognized;
      succeeded += 1;
    }

    if (succeeded === 0) {
      toast.show("選択した出荷は出荷待ち状態ではないため確定できません", "error");
      setSelected([]);
      return;
    }

    const mailDetail = [
      enqueued > 0 ? `enqueue ${enqueued}件` : "",
      duplicateSkipped > 0 ? `重複 ${duplicateSkipped}件` : "",
      disabledSkipped > 0 ? `無効化 ${disabledSkipped}件` : "",
    ]
      .filter(Boolean)
      .join("・");
    const mailLine = mailDetail ? ` / 出荷通知メール ${mailDetail}` : "";

    const cascadeLine =
      cascadeApplied + cascadeSkipped > 0
        ? ` / 受注連鎖 ${cascadeApplied}件適用${cascadeSkipped > 0 ? `・${cascadeSkipped}件スキップ` : ""}`
        : "";

    const invDetail = [
      consumed > 0 ? `在庫消費 ${consumed}SKU` : "",
      consumeFailed > 0 ? `消費失敗 ${consumeFailed}件` : "",
    ]
      .filter(Boolean)
      .join("・");
    const invLine = invDetail ? ` / ${invDetail}` : "";

    const revenueLine =
      revenueRecognized > 0 ? ` / 売上計上 ¥${revenueRecognized.toLocaleString()}` : "";

    toast.show(
      `${succeeded} 件を出荷確定しました${cascadeLine}${invLine}${revenueLine}${mailLine}`,
      consumeFailed > 0 ? "info" : "success",
    );
    setSelected([]);
  };

  /**
   * 出荷済み→配送中（markInTransit）/ 配送中→配達完了（markDelivered）への一括遷移。
   * 配達完了で handler が follow-up メールを emit → mailQueue へ enqueue する。
   * SM ガードに従い、対象外ステータスはスキップする（冪等）。
   */
  const progressShipment = (action: "markInTransit" | "markDelivered", label: string) => {
    if (selected.length === 0) {
      toast.show(`${label}する出荷を選択してください`, "error");
      return;
    }
    let succeeded = 0;
    const mailJobs: MailJob[] = [];
    for (const id of selected) {
      const result = shipmentStore.applyTransition(id, action);
      if (!result.applied) continue;
      if (result.effects.sendMail) mailJobs.push(result.effects.sendMail);
      succeeded += 1;
    }
    if (succeeded === 0) {
      toast.show(`${label}できる出荷がありません（ステータス不一致）`, "error");
      setSelected([]);
      return;
    }
    const mailResult = mailQueue.enqueueAll(mailJobs, getAutoMailEnabled());
    const mailLine =
      mailResult.enqueued > 0 ? ` / フォローメール ${mailResult.enqueued}件enqueue` : "";
    toast.show(`${succeeded} 件を${label}にしました${mailLine}`, "success");
    setSelected([]);
  };

  /** 選択中 or 一覧全件から出荷指示書発行用ソースを生成する。
   * 複数選択の場合は最初の1件をモーダルに渡す（一括発行は1件ずつ順次UIで対応可能）。 */
  function openInstructionModal() {
    const targetId = selected.length > 0 ? selected[0] : null;
    const record = targetId ? items.find((s) => s.id === targetId) : filtered[0];
    if (!record) {
      toast.show("対象の出荷レコードがありません", "error");
      return;
    }
    const source: ShipmentInstructionSource = {
      id: record.id,
      customer: record.customer,
      shipDate: record.shipDate,
      carrier: record.carrier,
      shop: record.shop,
      items: record.items,
      amount: record.amount,
      trackingNumber: record.trackingNumber ?? undefined,
    };
    setInstructionModalSource(source);
  }

  function openDeliveryNoteModal() {
    const targetId = selected.length > 0 ? selected[0] : null;
    const record = targetId ? items.find((s) => s.id === targetId) : filtered[0];
    if (!record) {
      toast.show("対象の出荷レコードがありません", "error");
      return;
    }
    const source: DeliveryNoteSource = {
      id: record.id,
      customer: record.customer,
      shipDate: record.shipDate,
      carrier: record.carrier,
      shop: record.shop,
      amount: record.amount,
    };
    setDeliveryNoteModalSource(source);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800">出荷管理</h1>
          <HelpHint>受注ステータスごとに出荷待ち→出荷済み→配送中→配達完了を管理。検索・配送業者・出荷予定日で絞込み、選択した受注を一括で出荷確定できます。</HelpHint>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openInstructionModal} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80 transition-all")}>
            <FileText className="h-4 w-4" />
            出荷指示書
          </button>
          <button onClick={openDeliveryNoteModal} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80 transition-all")}>
            <FileDown className="h-4 w-4" />
            納品書
          </button>
          <button onClick={confirmShipping} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90 transition-all")}>
            <CheckSquare className="h-4 w-4" />
            一括出荷確定
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setSelected([]); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200",
              activeTab === tab.value
                ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
            )}
          >
            {tab.label}
            <span className={cn(
              "px-1.5 py-0.5 rounded-md text-xs",
              activeTab === tab.value ? "bg-blue-500/15 text-blue-700 font-medium" : "bg-gray-500/10 text-gray-500"
            )}>
              {tab.count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            type="text"
            placeholder="受注番号・顧客名で検索..."
            className={cn(
              "w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
              "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          />
        </div>
        <select
          value={carrierFilter}
          onChange={(e) => setCarrierFilter(e.target.value)}
          className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">配送方法: すべて</option>
          {carriers.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <DatePicker
          compact
          placeholder="出荷予定日"
          onChange={(d) => {
            if (!d) { setShipDateFilter(""); return; }
            setShipDateFilter(`${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`);
          }}
        />
        {(keyword || carrierFilter !== "all" || shipDateFilter) && (
          <button
            onClick={() => { setKeyword(""); setCarrierFilter("all"); setShipDateFilter(""); }}
            className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 text-gray-600 hover:bg-white/70"
          >
            クリア
          </button>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注番号</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客名</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">店舗</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">商品数</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計金額</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">配送方法</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">追跡番号</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">出荷予定日</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {paged.map((s) => {
                const c = carrierIcon[s.carrier];
                return (
                  <tr
                    key={s.id}
                    className={cn(
                      "border-t border-white/30 transition-colors",
                      selected.includes(s.id) ? "bg-blue-500/5" : "hover:bg-white/40"
                    )}
                  >
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Link href={`/orders/${s.id}/edit`} className="font-medium text-blue-600 hover:underline">{s.id}</Link>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{s.customer}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{s.shop}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{s.items}</td>
                    <td className="px-3 py-3 text-right font-medium text-gray-800">¥{s.amount.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {c && (
                          <span className={cn("h-5 w-5 rounded text-[10px] font-bold text-white flex items-center justify-center", c.color)}>
                            {c.label}
                          </span>
                        )}
                        <span className="text-gray-600 text-xs">{s.carrier}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {s.trackingNumber ? (
                        <span className="font-mono text-xs text-gray-600">{s.trackingNumber}</span>
                      ) : (
                        <input
                          value={s.trackingNumber ?? ""}
                          onChange={(e) => updateTracking(s.id, e.target.value)}
                          type="text"
                          placeholder="番号を入力..."
                          className={cn(
                            "w-full h-7 px-2 rounded-lg text-xs bg-white/50 border border-white/50",
                            "placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                          )}
                        />
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{s.shipDate}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", shipmentStatusBadge[s.status])}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/orders/${s.id}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="詳細">
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-12 text-center text-sm text-gray-400">該当する受注がありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-white/40 bg-white/30">
          <div>
            {selected.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">{selected.length} 件選択中</span>
                <button onClick={confirmShipping} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors">
                  出荷確定
                </button>
                <button onClick={() => progressShipment("markInTransit", "配送中")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/15 text-cyan-700 hover:bg-cyan-500/25 transition-colors">
                  配送中にする
                </button>
                <button onClick={() => progressShipment("markDelivered", "配達完了")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/15 text-teal-700 hover:bg-teal-500/25 transition-colors">
                  配達完了にする
                </button>
                <button onClick={openInstructionModal} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 transition-colors">
                  出荷指示書
                </button>
                <button
                  onClick={cancelShipping}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 transition-colors"
                  title="shipment SM の cancel ガードに従って一括キャンセル"
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{filtered.length} 件 / 全 {items.length} 件</span>
            <span className="text-sm text-gray-500">{safePage} / {totalPages} ページ</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className={cn(
                  "p-1.5 rounded-lg bg-white/50 border border-white/40 transition-colors",
                  safePage <= 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-white/70",
                )}
                title="前のページ"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className={cn(
                  "p-1.5 rounded-lg bg-white/50 border border-white/40 transition-colors",
                  safePage >= totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-white/70",
                )}
                title="次のページ"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      <ShipmentInstructionIssueModal
        open={instructionModalSource !== null}
        onClose={() => setInstructionModalSource(null)}
        source={instructionModalSource}
      />
      <DeliveryNoteIssueModal
        open={deliveryNoteModalSource !== null}
        onClose={() => setDeliveryNoteModalSource(null)}
        source={deliveryNoteModalSource}
      />
    </div>
  );
}
