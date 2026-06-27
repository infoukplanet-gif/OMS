"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Search, Truck, ListChecks, RotateCcw, X } from "lucide-react";
import { mailQueue } from "@/lib/mail/queue";
import { getAutoMailEnabled } from "@/lib/mail/auto-settings";
import { shipmentStore } from "@/lib/stores/shipment";
import { orderStore } from "@/lib/stores/orders";
import { inventoryStore } from "@/lib/stores/inventory";
import { salesStore } from "@/lib/stores/sales";
import { mallShipmentNotificationStore } from "@/lib/stores/mall-shipment-notifications";
import { warehouseFtpDeliveryStore } from "@/lib/stores/warehouse-ftp-deliveries";
import { shipmentConfirmAuditLogStore } from "@/lib/stores/shipment-confirm-audit-log";
import { applyConfirmShipmentCascade } from "@/lib/cascades/confirm-shipment";
import { INITIAL_SHIPMENTS, type SeededShipment } from "@/lib/seeds/shipments";
import { INITIAL_ORDERS } from "@/lib/seeds/orders";
import { INITIAL_INVENTORY } from "@/lib/seeds/inventory";
import type { AllocationLine, InventoryRecord } from "@/lib/state-machines/inventory";
import type { OrderRecord } from "@/lib/stores/orders";

/** 確定対象一覧の 1 行（共有 store から実データ派生）。 */
type Row = {
  id: string;
  order: string;
  customer: string;
  carrier: string;
  warehouse: string;
  amount: number;
  pieces: number;
  ready: boolean;
  block: string | null;
};

const fmt = (n: number) => `¥${n.toLocaleString()}`;

const invKey = (sku: string, warehouse: string): string => `${sku}__${warehouse}`;

/**
 * 対応 Order の allocation を実在庫（inventoryStore）と突き合わせ、
 * 出荷確定をブロックする最初の要因を返す。確定可能なら null。
 * - consume ガードに合わせ「引当済 >= 数量」かつ「実在庫 >= 数量」を要求する
 * - 対応 order/allocation が無い場合はブロックしない（出荷単独で確定可能）
 */
function deriveBlock(
  order: OrderRecord | undefined,
  invByKey: Map<string, InventoryRecord>,
): string | null {
  const allocation = order?.allocation as AllocationLine[] | undefined;
  if (!allocation || allocation.length === 0) return null;
  for (const line of allocation) {
    const rec = invByKey.get(invKey(line.sku, line.warehouse));
    if (!rec) return `在庫マスタ未登録（${line.sku}）`;
    if (rec.allocated < line.qty) return `引当不足（${line.sku} ${rec.allocated}/${line.qty}）`;
    if (rec.onHand < line.qty) return `在庫不足（${line.sku} 残${rec.onHand}/${line.qty}）`;
  }
  return null;
}

export default function ShipmentsConfirmPage() {
  const toast = useToast();

  // /shipments/confirm は出荷ドメインの「読み取り専用購読者」。
  // オーナー（永続化）は /shipments のみ。ここでは usePersistentStore を使わず、
  // 直接 store にランディングした場合に空一覧にならないよう防御的シードのみ行う。
  useEffect(() => {
    if (shipmentStore.getState().length === 0) shipmentStore.setItems(INITIAL_SHIPMENTS);
    if (orderStore.getState().length === 0) orderStore.setItems(INITIAL_ORDERS);
    if (inventoryStore.getState().length === 0) inventoryStore.setItems(INITIAL_INVENTORY);
  }, []);

  const shipmentItems = useSyncExternalStore(
    (cb) => shipmentStore.subscribe(cb),
    () => shipmentStore.getState(),
    () => INITIAL_SHIPMENTS,
  );
  const orderItems = useSyncExternalStore(
    (cb) => orderStore.subscribe(cb),
    () => orderStore.getState(),
    () => INITIAL_ORDERS,
  );
  const inventoryItems = useSyncExternalStore(
    (cb) => inventoryStore.subscribe(cb),
    () => inventoryStore.getState(),
    () => INITIAL_INVENTORY,
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [readyOnly, setReadyOnly] = useState(true);
  const [warehouse, setWarehouse] = useState("すべて");
  const [carrier, setCarrier] = useState("すべて");

  // 出荷待ちの出荷伝票を、対応受注の allocation + 実在庫から確定可否付きで派生。
  const rows = useMemo<Row[]>(() => {
    const orderById = new Map<string, OrderRecord>(orderItems.map((o) => [o.id, o]));
    const invByKey = new Map<string, InventoryRecord>(
      inventoryItems.map((r) => [invKey(r.sku, r.warehouse), r]),
    );
    return shipmentItems
      .filter((s) => s.status === "出荷待ち")
      .map((s) => {
        const ship = s as SeededShipment;
        const order = orderById.get(ship.orderIds[0]);
        const allocation = order?.allocation as AllocationLine[] | undefined;
        const block = deriveBlock(order, invByKey);
        return {
          id: ship.id,
          order: ship.id,
          customer: ship.customer ?? String(order?.customer ?? ""),
          carrier: ship.carrier ?? "",
          warehouse: allocation?.[0]?.warehouse ?? "—",
          amount: ship.amount ?? Number(order?.amount ?? 0),
          pieces: ship.items ?? Number(order?.items ?? 0),
          ready: block === null,
          block,
        };
      });
  }, [shipmentItems, orderItems, inventoryItems]);

  const warehouseOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.warehouse && r.warehouse !== "—") set.add(r.warehouse);
    return ["すべて", ...Array.from(set).sort()];
  }, [rows]);

  const carrierOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.carrier) set.add(r.carrier);
    return ["すべて", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k)) return false;
      if (readyOnly && !r.ready) return false;
      if (warehouse !== "すべて" && r.warehouse !== warehouse) return false;
      if (carrier !== "すべて" && r.carrier !== carrier) return false;
      return true;
    });
  }, [rows, keyword, readyOnly, warehouse, carrier]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedRows = rows.filter((r) => selectedSet.has(r.id) && r.ready);
  const selectedCount = selectedRows.length;
  const totalReady = rows.filter((r) => r.ready).length;
  const totalBlocked = rows.filter((r) => !r.ready).length;
  const selectedAmount = selectedRows.reduce((s, r) => s + r.amount, 0);

  const toggleAll = (checked: boolean) => {
    const ids = filtered.filter((r) => r.ready).map((r) => r.id);
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)),
    );
  };
  const toggleOne = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  /**
   * 選択中の出荷を 1 件ずつ独立して確定（部分失敗許容）。
   * applyConfirmShipmentCascade で 受注出荷登録 / 在庫消費 / 売上計上 /
   * 出荷通知メール / モール通知データ / 倉庫委託先FTP / 監査ログ を一気通貫で適用し、
   * 結果をサマリ表示する。失敗・対象外は skip 計上して継続。
   */
  const confirm = () => {
    const targets = selectedRows.map((r) => r.id);
    if (targets.length === 0) {
      toast.show("出荷確定する受注を選択してください", "error");
      return;
    }

    const now = new Date();
    const confirmedAt = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;

    let succeeded = 0;
    let skipped = 0;
    let cascadeApplied = 0;
    let cascadeSkipped = 0;
    let consumed = 0;
    let consumeFailed = 0;
    let enqueued = 0;
    let revenueRecognized = 0;
    let mallNotified = 0;
    let ftpQueued = 0;
    let auditLogged = 0;

    for (const id of targets) {
      const result = applyConfirmShipmentCascade(id, {
        shipmentStore,
        orderStore,
        inventoryStore,
        salesStore,
        mailQueue,
        autoMailEnabled: getAutoMailEnabled(),
        mallNotificationStore: mallShipmentNotificationStore,
        warehouseFtpDeliveryStore,
        auditLogStore: shipmentConfirmAuditLogStore,
        confirmedAt,
        actor: "システム",
      });
      if (!result.applied) {
        skipped += 1;
        continue;
      }
      succeeded += 1;
      cascadeApplied += result.cascadeApplied;
      cascadeSkipped += result.cascadeSkipped;
      consumed += result.consumed;
      consumeFailed += result.consumeFailed;
      enqueued += result.enqueued;
      revenueRecognized += result.revenueRecognized;
      mallNotified += result.mallNotified;
      ftpQueued += result.ftpQueued;
      auditLogged += result.auditLogged;
    }

    setSelectedIds([]);

    if (succeeded === 0) {
      toast.show("選択した出荷は出荷待ち状態ではないため確定できませんでした", "error");
      return;
    }

    const parts = [
      cascadeApplied > 0 ? `受注出荷登録 ${cascadeApplied}件` : "",
      cascadeSkipped > 0 ? `受注連鎖 ${cascadeSkipped}件スキップ` : "",
      consumed > 0 ? `在庫消費 ${consumed}SKU` : "",
      consumeFailed > 0 ? `消費失敗 ${consumeFailed}件` : "",
      revenueRecognized > 0 ? `売上計上 ¥${revenueRecognized.toLocaleString()}` : "",
      mallNotified > 0 ? `モール通知 ${mallNotified}件` : "",
      enqueued > 0 ? `発送メール ${enqueued}件enqueue` : "",
      ftpQueued > 0 ? `FTP配信 ${ftpQueued}件` : "",
      auditLogged > 0 ? `監査ログ ${auditLogged}件` : "",
      skipped > 0 ? `対象外 ${skipped}件スキップ` : "",
    ].filter(Boolean);
    const tail = parts.length > 0 ? ` / ${parts.join("・")}` : "";

    toast.show(
      `${succeeded} 件を出荷確定しました${tail}`,
      consumeFailed > 0 || skipped > 0 ? "info" : "success",
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">出荷確定処理</h1>
            <HelpHint>
              出荷待ちの受注をまとめて確定し、受注の出荷登録・在庫消費・売上計上・モール通知・発送メール・倉庫委託先FTP配信・監査ログまでを一括で連鎖実行します。{"\n"}
              在庫不足や引当不足など、確定をブロックする要因がある受注は対象外です。各出荷は独立して確定し、失敗分はスキップします。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            出荷可能な受注: <span className="font-semibold text-emerald-700">{totalReady}件</span> ／ ブロック中:{" "}
            <span className="font-semibold text-amber-700">{totalBlocked}件</span>
          </p>
        </div>
        <PrimaryButton onClick={confirm} disabled={selectedCount === 0}>
          <CheckCircle2 className="h-4 w-4" />
          {selectedCount > 0 ? `${selectedCount}件を出荷確定` : "出荷確定する"}
        </PrimaryButton>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><ListChecks className="h-4 w-4" />選択件数</div>
          <p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{selectedCount}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><CheckCircle2 className="h-4 w-4" />選択合計金額</div>
          <p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{fmt(selectedAmount)}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Truck className="h-4 w-4" />出荷可能</div>
          <p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{totalReady}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><AlertTriangle className="h-4 w-4" />ブロック中</div>
          <p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{totalBlocked}</p>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="受注番号・顧客名で検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">倉庫</label>
            <select
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {warehouseOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">配送業者</label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {carrierOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={readyOnly}
              onChange={(e) => setReadyOnly(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            出荷可能のみ表示
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={filtered.filter((r) => r.ready).length > 0 && filtered.filter((r) => r.ready).every((r) => selectedSet.has(r.id))}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="accent-blue-500 w-4 h-4"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">配送業者</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">倉庫</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">金額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">個口</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">確定可否</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ブロック理由</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-gray-400">
                  条件に該当する受注がありません。
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className={cn(
                    "border-t border-white/30 hover:bg-white/40",
                    selectedSet.has(r.id) && r.ready && "bg-blue-500/8",
                    !r.ready && "opacity-70"
                  )}
                >
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(r.id) && r.ready}
                      disabled={!r.ready}
                      onChange={() => toggleOne(r.id)}
                      className="accent-blue-500 w-4 h-4 disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="px-3 py-2.5 font-medium text-blue-600">{r.order}</td>
                  <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{r.carrier}</td>
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{r.warehouse}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(r.amount)}</td>
                  <td className="px-3 py-2.5 text-center text-gray-700 tabular-nums">{r.pieces}</td>
                  <td className="px-3 py-2.5 text-center">
                    {r.ready ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />可
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700">
                        <X className="h-3 w-3" />ブロック
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-amber-700">{r.block ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">出荷確定で実行される処理</h2>
          <HelpHint>確定ボタン押下時に各出荷へ自動連鎖する処理の一覧。</HelpHint>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          {[
            "受注ステータスを「出荷済み」に更新",
            "売上計上日を本日付で確定",
            "在庫を引当済 → 出庫済へ更新",
            "モールへの出荷通知データを生成（楽天/Yahoo!/Amazon）",
            "顧客への発送完了メールをキューに投入",
            "倉庫委託先への確定報告をFTP配信",
            "出荷確定ログ（監査用）を記録",
          ].map((s) => (
            <li key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
