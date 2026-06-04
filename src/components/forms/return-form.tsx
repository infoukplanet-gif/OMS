"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Undo2, FileText } from "lucide-react";
import { returnStore, type ReturnRecord } from "@/lib/stores/return";
import type { ReturnLine } from "@/lib/state-machines/return";

const RETURN_REASONS = ["初期不良", "誤配送", "顧客都合", "破損", "サイズ違い", "イメージ違い", "その他"] as const;
type ReturnReason = (typeof RETURN_REASONS)[number];

const PROCESS_TYPES = ["返金", "交換", "代替品送付", "保留"] as const;
type ProcessType = (typeof PROCESS_TYPES)[number];

const WAREHOUSES = ["東京本社倉庫", "大阪倉庫", "福岡倉庫", "九州物流センター"] as const;

export function ReturnForm({ mode, recordId }: { mode: "create" | "edit"; recordId?: string }) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const toast = useToast();

  const existing = isEdit && recordId
    ? returnStore.getState().find((r) => r.id === recordId)
    : undefined;

  const [orderId, setOrderId] = useState(
    () => (existing ? existing.orderId : ""),
  );
  const [customer, setCustomer] = useState(
    () => (existing ? String(existing.customer ?? "") : ""),
  );
  const [productName, setProductName] = useState(
    () => (existing ? String(existing.productName ?? "") : ""),
  );
  const [sku, setSku] = useState(
    () => (existing && existing.lines[0] ? existing.lines[0].sku : ""),
  );
  const [warehouse, setWarehouse] = useState<string>(
    () => (existing && existing.lines[0] ? existing.lines[0].warehouse : "東京本社倉庫"),
  );
  const [qty, setQty] = useState(
    () => (existing && existing.lines[0] ? String(existing.lines[0].qty) : ""),
  );
  const [reason, setReason] = useState<ReturnReason>(
    () => (existing ? (String(existing.reason ?? "初期不良") as ReturnReason) : "初期不良"),
  );
  const [processType, setProcessType] = useState<ProcessType>(
    () => (existing ? (String(existing.processType ?? "返金") as ProcessType) : "返金"),
  );
  const [refundAmount, setRefundAmount] = useState(
    () => (existing ? String(existing.refundAmount) : ""),
  );
  const [shippingBear, setShippingBear] = useState(
    () => (existing ? String(existing.shippingBear ?? "") : ""),
  );
  const [requestedAt, setRequestedAt] = useState<Date | null>(new Date());
  const [refundAt, setRefundAt] = useState<Date | null>(null);
  const [reasonDetail, setReasonDetail] = useState(
    () => (existing ? String(existing.reasonDetail ?? "") : ""),
  );
  const [actionMemo, setActionMemo] = useState(
    () => (existing ? String(existing.actionMemo ?? "") : ""),
  );

  const listPath = "/purchasing/returns";

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const fmtDate = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const handleSave = () => {
    const trimmedOrder = orderId.trim();
    const parsedQty = Math.round(Number(qty));
    const parsedRefund = Number(refundAmount);

    if (!trimmedOrder) {
      toast.show("元受注番号を入力してください", "error");
      return;
    }
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      toast.show("返品数量は1以上の整数を入力してください", "error");
      return;
    }

    const line: ReturnLine = {
      sku: sku.trim() || "—",
      warehouse,
      qty: parsedQty,
      restockQty: 0,
    };

    const now = requestedAt ?? new Date();
    const reqDate = fmtDate(now);
    const refundDate = refundAt ? fmtDate(refundAt) : "";

    if (isEdit && recordId) {
      const current = returnStore.getState();
      const idx = current.findIndex((r) => r.id === recordId);
      if (idx === -1) {
        toast.show("返品レコードが見つかりません", "error");
        return;
      }
      const before = current[idx];
      const updated: ReturnRecord = {
        ...before,
        orderId: trimmedOrder,
        lines: [line],
        refundAmount: Number.isFinite(parsedRefund) && parsedRefund >= 0 ? parsedRefund : before.refundAmount,
        customer,
        productName,
        reason,
        processType,
        shippingBear,
        requestedAt: reqDate,
        refundAt: refundDate,
        reasonDetail,
        actionMemo,
      };
      returnStore.setItems([
        ...current.slice(0, idx),
        updated,
        ...current.slice(idx + 1),
      ]);
      toast.show(`${recordId} の返品情報を更新しました`, "success");
    } else {
      // 新規: returnStore.createForOrder で返品依頼状態で作成（cascade 非発火）
      const result = returnStore.createForOrder(trimmedOrder, {
        lines: [line],
        refundAmount: Number.isFinite(parsedRefund) && parsedRefund >= 0 ? parsedRefund : 0,
        customer,
        productName,
        reason,
        processType,
        shippingBear,
        requestedAt: reqDate,
        refundAt: refundDate,
        reasonDetail,
        actionMemo,
      });
      if (!result.created || !result.record) {
        toast.show("返品レコードの作成に失敗しました", "error");
        return;
      }
      toast.show(
        `${trimmedOrder} の返品を受付しました（${result.record.id}）`,
        "success",
      );
    }
    router.push(listPath);
  };

  const handleDelete = () => {
    if (!recordId) return;
    if (!window.confirm("この返品レコードを削除しますか？")) return;
    const current = returnStore.getState();
    returnStore.setItems(current.filter((r) => r.id !== recordId));
    toast.show("返品レコードを削除しました", "success");
    router.push(listPath);
  };

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? "返品編集" : "返品登録"}
        </h1>
        <div className="flex gap-2">
          {isEdit && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25 transition-all"
            >
              削除
            </button>
          )}
          <button
            onClick={() => router.push(listPath)}
            className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
          >
            {isEdit ? "更新" : "保存"}
          </button>
        </div>
      </div>

      {isEdit && (
        <div className="text-xs text-gray-500">
          発注・仕入管理 &gt; 返品伝票管理 &gt;{" "}
          <span className="text-blue-600">{recordId}</span> &gt; 編集
        </div>
      )}

      {/* 返品情報 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Undo2 className="h-4 w-4 text-gray-400" />返品情報
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {/* 返品番号（表示のみ） */}
          {isEdit && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">返品番号</label>
              <input
                disabled
                defaultValue={recordId ?? ""}
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/30 border border-white/50 text-gray-500 cursor-not-allowed"
              />
            </div>
          )}

          {/* 元受注番号 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              元受注番号 <span className="text-red-500 text-xs">*必須</span>
            </label>
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="ORD-2026-00820"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 返品受付日 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">返品受付日</label>
            <DatePicker
              placeholder="日付を選択"
              onChange={(d) => setRequestedAt(d ?? null)}
            />
          </div>

          {/* 顧客名 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">顧客名</label>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="渡辺 京子"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 返品商品名 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">返品商品</label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="ワイヤレスイヤホン Pro"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* SKU */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">SKUコード</label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="WEP-001-BK"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 倉庫 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">倉庫</label>
            <select
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {WAREHOUSES.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* 返品数量 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              返品数量 <span className="text-red-500 text-xs">*必須</span>
            </label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="1"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 返品理由 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">返品理由</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReturnReason)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {RETURN_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* 処理方法 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">処理方法</label>
            <select
              value={processType}
              onChange={(e) => setProcessType(e.target.value as ProcessType)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {PROCESS_TYPES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 返品送料負担 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">送料負担</label>
            <input
              value={shippingBear}
              onChange={(e) => setShippingBear(e.target.value)}
              placeholder="自社 / 顧客"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 返金額 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">返金額</label>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="0"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 返金日 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">返金日</label>
            <DatePicker
              placeholder="日付を選択"
              onChange={(d) => setRefundAt(d ?? null)}
            />
          </div>

          {/* ステータス表示（編集時のみ） */}
          {isEdit && existing && (
            <div
              className={cn(
                "col-span-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 text-sm",
              )}
            >
              <span className="text-gray-500">現在のステータス:</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700">
                {existing.status}
              </span>
              {existing.refundStatus && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    existing.refundStatus === "確定済"
                      ? "bg-emerald-500/15 text-emerald-700"
                      : existing.refundStatus === "起票済"
                      ? "bg-blue-500/15 text-blue-700"
                      : "bg-gray-500/15 text-gray-700",
                  )}
                >
                  返金: {existing.refundStatus}
                </span>
              )}
            </div>
          )}
        </div>
      </GlassCard>

      {/* 備考・対応履歴 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />備考・対応履歴
        </h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">返品理由詳細</label>
            <textarea
              rows={3}
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder="顧客からの説明..."
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">対応メモ</label>
            <textarea
              rows={3}
              value={actionMemo}
              onChange={(e) => setActionMemo(e.target.value)}
              placeholder="社内対応の記録..."
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
        </div>
      </GlassCard>

      {/* フッターボタン */}
      <div className="flex justify-end gap-2 pt-2">
        {isEdit && (
          <button
            onClick={handleDelete}
            className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25 transition-all"
          >
            削除
          </button>
        )}
        <button
          onClick={() => router.push(listPath)}
          className="px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
        >
          {isEdit ? "更新" : "保存"}
        </button>
      </div>
    </div>
  );
}
