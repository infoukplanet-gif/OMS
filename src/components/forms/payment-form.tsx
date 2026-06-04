"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { CreditCard, FileText } from "lucide-react";
import { paymentStore, type PaymentRecord } from "@/lib/stores/payment";

const PAYMENT_METHODS = ["銀行振込", "クレジットカード", "代金引換", "現金", "コンビニ払い"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

interface PaymentFormProps {
  mode: "create" | "edit";
  recordId?: string;
}

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export function PaymentForm({ mode, recordId }: PaymentFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const toast = useToast();

  const existing = isEdit && recordId
    ? paymentStore.getState().find((p) => p.id === recordId)
    : undefined;

  const [orderId, setOrderId] = useState(
    () => (existing ? (existing.orderId as string) : ""),
  );
  const [customer, setCustomer] = useState(
    () => (existing ? String(existing.customer ?? "") : ""),
  );
  const [orderTotal, setOrderTotal] = useState(
    () => (existing ? String(existing.orderTotal) : ""),
  );
  const [paidAmount, setPaidAmount] = useState(
    () => (existing ? String(existing.paidAmount) : ""),
  );
  const [paidAt, setPaidAt] = useState<Date | null>(() => {
    const v = existing ? String(existing.paidAt ?? "") : "";
    return v ? new Date(v) : new Date();
  });
  const [method, setMethod] = useState<PaymentMethod>(
    () => (existing ? (String(existing.method ?? "銀行振込") as PaymentMethod) : "銀行振込"),
  );
  const [bankAccount, setBankAccount] = useState(
    () => (existing ? String(existing.bankAccount ?? "") : ""),
  );
  const [memo, setMemo] = useState(
    () => (existing ? String(existing.memo ?? "") : ""),
  );

  const listPath = "/payments/register";

  const handleSave = () => {
    const trimmedOrder = orderId.trim();
    const parsedTotal = Number(orderTotal);
    const parsedPaid = Number(paidAmount);

    if (!trimmedOrder) {
      toast.show("受注番号を入力してください", "error");
      return;
    }
    if (!Number.isFinite(parsedPaid) || parsedPaid <= 0) {
      toast.show("入金額は1円以上の正の整数を入力してください", "error");
      return;
    }

    const pad2 = (n: number) => String(n).padStart(2, "0");
    const now = paidAt ?? new Date();
    const paidAtStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

    if (isEdit && recordId) {
      // 編集: 既存レコードを immutable 更新
      const current = paymentStore.getState();
      const idx = current.findIndex((p) => p.id === recordId);
      if (idx === -1) {
        toast.show("対象の入金レコードが見つかりません", "error");
        return;
      }
      const before = current[idx];
      const updated: PaymentRecord = {
        ...before,
        orderId: trimmedOrder,
        customer,
        orderTotal: Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : before.orderTotal,
        paidAmount: parsedPaid,
        paidAt: paidAtStr,
        method,
        bankAccount,
        memo,
      };
      const next = [
        ...current.slice(0, idx),
        updated,
        ...current.slice(idx + 1),
      ];
      paymentStore.setItems(next);
      toast.show(`${trimmedOrder} の入金情報を更新しました`, "success");
    } else {
      // 新規: PR 採番 → paymentStore に素のレコードを add（cascade 非発火）
      const current = paymentStore.getState();
      const year = new Date().getFullYear();
      const nums = current
        .map((p) => {
          const m = new RegExp(`^PR-\\d{4}-(\\d+)$`).exec(p.id);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => n > 0);
      const next = (nums.length === 0 ? 200 : Math.max(...nums)) + 1;
      const newId = `PR-${year}-${String(next).padStart(4, "0")}`;

      const record: PaymentRecord = {
        id: newId,
        orderId: trimmedOrder,
        status: parsedPaid >= (Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : parsedPaid)
          ? "入金済み"
          : parsedPaid > 0
          ? "一部入金"
          : "未入金",
        orderTotal: Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : parsedPaid,
        paidAmount: parsedPaid,
        overpaid:
          Number.isFinite(parsedTotal) &&
          parsedTotal > 0 &&
          parsedPaid > parsedTotal,
        customer,
        paidAt: paidAtStr,
        method,
        bankAccount,
        memo,
      };
      paymentStore.setItems([...current, record]);
      toast.show(`${trimmedOrder} の入金を登録しました（${newId}）`, "success");
    }
    router.push(listPath);
  };

  const handleDelete = () => {
    if (!recordId) return;
    if (!window.confirm("この入金レコードを削除しますか？")) return;
    const current = paymentStore.getState();
    paymentStore.setItems(current.filter((p) => p.id !== recordId));
    toast.show("入金レコードを削除しました", "success");
    router.push(listPath);
  };

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? "入金編集" : "入金登録"}
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
          入金管理 &gt; 入金登録 &gt;{" "}
          <span className="text-blue-600">{recordId}</span> &gt; 編集
        </div>
      )}

      {/* 入金情報 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" />入金情報
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {/* 受注番号 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              受注番号 <span className="text-red-500 text-xs">*必須</span>
            </label>
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="ORD-2026-00849"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 顧客名 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">顧客名</label>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="山田 太郎"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 受注金額 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">受注金額</label>
            <input
              type="number"
              value={orderTotal}
              onChange={(e) => setOrderTotal(e.target.value)}
              placeholder="32400"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 入金額 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              入金額 <span className="text-red-500 text-xs">*必須</span>
            </label>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="32400"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 入金日 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">入金日</label>
            <DatePicker
              placeholder="入金日を選択"
              onChange={(d) => setPaidAt(d ?? null)}
            />
          </div>

          {/* 入金方法 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              入金方法 <span className="text-red-500 text-xs">*必須</span>
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {PAYMENT_METHODS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* 振込先口座 */}
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">振込先口座</label>
            <input
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="三井住友 本店 普通 0000000"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 差額プレビュー */}
          {Number(orderTotal) > 0 && Number(paidAmount) > 0 && (
            <div className="col-span-3 flex items-center gap-3 px-3 py-2 rounded-xl bg-white/40 text-sm">
              <span className="text-gray-500">差額プレビュー:</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  Number(paidAmount) >= Number(orderTotal)
                    ? "text-emerald-700"
                    : "text-amber-700",
                )}
              >
                {fmt(Number(paidAmount) - Number(orderTotal))}
              </span>
              {Number(paidAmount) >= Number(orderTotal) && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">
                  入金済み
                </span>
              )}
              {Number(paidAmount) < Number(orderTotal) && Number(paidAmount) > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700">
                  一部入金
                </span>
              )}
            </div>
          )}
        </div>
      </GlassCard>

      {/* 備考 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />備考
        </h2>
        <textarea
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="入金に関する備考..."
          className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
        />
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
