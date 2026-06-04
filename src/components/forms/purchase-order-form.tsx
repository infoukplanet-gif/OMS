"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Plus, Trash2, ClipboardList, Building2, FileText } from "lucide-react";
import { purchaseStore, type PurchaseOrderRecord } from "@/lib/stores/purchase";
import type { PurchaseOrderLine, PurchaseOrderStatus } from "@/lib/state-machines/purchase";

const WAREHOUSES = ["東京本社倉庫", "大阪倉庫", "福岡倉庫", "九州物流センター"] as const;
const SUPPLIERS = [
  "株式会社ABC電子",
  "グローバルパーツ合同会社",
  "株式会社ケーブルワークス",
  "アジアサプライ株式会社",
  "フジタ資材株式会社",
  "東亜電機株式会社",
] as const;

interface LineRow {
  rowId: number;
  sku: string;
  skuName: string;
  unitPrice: string;
  qty: string;
  warehouse: string;
}

interface PurchaseOrderFormProps {
  mode: "create" | "edit";
  recordId?: string;
}

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export function PurchaseOrderForm({ mode, recordId }: PurchaseOrderFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const toast = useToast();

  const existing = isEdit && recordId
    ? (purchaseStore.getState().find((p) => p.id === recordId) as (PurchaseOrderRecord & { supplier?: string; amount?: number; date?: string; expected?: string; daysToArrive?: number }) | undefined)
    : undefined;

  const [supplier, setSupplier] = useState(
    () => existing ? String(existing.supplier ?? "") : "",
  );
  const [supplierCode, setSupplierCode] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierTel, setSupplierTel] = useState("");
  const [warehouse, setWarehouse] = useState<string>("東京本社倉庫");
  const [orderedAt, setOrderedAt] = useState<Date | null>(new Date());
  const [expectedAt, setExpectedAt] = useState<Date | null>(null);
  const [memo, setMemo] = useState("");
  const [assignee, setAssignee] = useState("");

  const [lineCounter, setLineCounter] = useState(3);
  const [lines, setLines] = useState<LineRow[]>(() => {
    if (existing && existing.lines.length > 0) {
      return existing.lines.map((l, i) => ({
        rowId: i + 1,
        sku: l.sku,
        skuName: "",
        unitPrice: "",
        qty: String(l.orderedQty),
        warehouse: l.warehouse,
      }));
    }
    return [
      { rowId: 1, sku: "", skuName: "", unitPrice: "", qty: "", warehouse: "東京本社倉庫" },
      { rowId: 2, sku: "", skuName: "", unitPrice: "", qty: "", warehouse: "東京本社倉庫" },
      { rowId: 3, sku: "", skuName: "", unitPrice: "", qty: "", warehouse: "東京本社倉庫" },
    ];
  });

  const subtotal = useMemo(
    () =>
      lines.reduce((s, l) => {
        const p = Number(l.unitPrice);
        const q = Number(l.qty);
        return s + (Number.isFinite(p) && Number.isFinite(q) ? p * q : 0);
      }, 0),
    [lines],
  );
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const fmtDate = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const addLine = () => {
    const newId = lineCounter + 1;
    setLineCounter(newId);
    setLines((prev) => [
      ...prev,
      { rowId: newId, sku: "", skuName: "", unitPrice: "", qty: "", warehouse },
    ]);
  };

  const removeLine = (rowId: number) => {
    setLines((prev) => prev.filter((l) => l.rowId !== rowId));
  };

  const updateLine = (rowId: number, field: keyof LineRow, value: string) => {
    setLines((prev) =>
      prev.map((l) => (l.rowId === rowId ? { ...l, [field]: value } : l)),
    );
  };

  const listPath = "/purchasing";

  const handleSave = () => {
    if (!supplier.trim()) {
      toast.show("仕入先名を入力してください", "error");
      return;
    }
    const validLines = lines.filter(
      (l) => l.sku.trim() && Number(l.qty) > 0,
    );
    if (validLines.length === 0) {
      toast.show("明細を1行以上入力してください（商品コードと数量が必須）", "error");
      return;
    }

    const poLines: PurchaseOrderLine[] = validLines.map((l) => ({
      sku: l.sku.trim(),
      warehouse: l.warehouse,
      orderedQty: Math.max(1, Math.round(Number(l.qty))),
      receivedQty: 0,
    }));

    const now = orderedAt ?? new Date();
    const exp = expectedAt ? fmtDate(expectedAt) : "—";
    const daysToArrive = expectedAt
      ? Math.ceil((expectedAt.getTime() - Date.now()) / 86400000)
      : 0;

    if (isEdit && recordId) {
      const current = purchaseStore.getState();
      const idx = current.findIndex((p) => p.id === recordId);
      if (idx === -1) {
        toast.show("発注レコードが見つかりません", "error");
        return;
      }
      const before = current[idx];
      const updated: PurchaseOrderRecord = {
        ...before,
        supplier: supplier.trim(),
        lines: poLines,
        amount: total,
        items: poLines.length,
        date: fmtDate(now),
        expected: exp,
        daysToArrive: Math.max(0, daysToArrive),
        memo,
        assignee,
      };
      purchaseStore.setItems([
        ...current.slice(0, idx),
        updated,
        ...current.slice(idx + 1),
      ]);
      toast.show(`${recordId} の発注情報を更新しました`, "success");
    } else {
      // 新規: PO 採番 → purchaseStore に素のレコードを add（cascade 非発火）
      const current = purchaseStore.getState();
      const year = new Date().getFullYear();
      const nums = current
        .map((p) => {
          const m = new RegExp(`^PO-\\d{4}-(\\d+)$`).exec(p.id);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => n > 0);
      const next = (nums.length === 0 ? 49 : Math.max(...nums)) + 1;
      const newId = `PO-${year}-${String(next).padStart(4, "0")}`;

      const record: PurchaseOrderRecord = {
        id: newId,
        status: "未発行" as PurchaseOrderStatus,
        lines: poLines,
        supplier: supplier.trim(),
        supplierCode,
        supplierContact,
        supplierEmail,
        supplierTel,
        amount: total,
        items: poLines.length,
        date: fmtDate(now),
        expected: exp,
        daysToArrive: Math.max(0, daysToArrive),
        memo,
        assignee,
        warehouse,
      };
      purchaseStore.setItems([...current, record]);
      toast.show(`${supplier.trim()} へ発注書 ${newId} を登録しました`, "success");
    }
    router.push(listPath);
  };

  const handleCancel = () => {
    if (!recordId) return;
    if (!window.confirm(`${recordId} をキャンセルしますか？`)) return;
    const result = purchaseStore.applyCancel(recordId);
    if (!result.applied) {
      toast.show("この発注書はキャンセルできません", "error");
      return;
    }
    toast.show(`${recordId} をキャンセルしました`, "success");
    router.push(listPath);
  };

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? "発注編集" : "発注登録"}
        </h1>
        <div className="flex gap-2">
          {isEdit && existing && existing.status !== "仕入完了" && existing.status !== "キャンセル" && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25 transition-all"
            >
              発注キャンセル
            </button>
          )}
          <button
            onClick={() => router.push(listPath)}
            className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all"
          >
            戻る
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
          >
            {isEdit ? "更新" : "発注確定"}
          </button>
        </div>
      </div>

      {isEdit && (
        <div className="text-xs text-gray-500">
          発注・仕入管理 &gt;{" "}
          <span className="text-blue-600">{recordId}</span> &gt; 編集
        </div>
      )}

      {/* 発注情報 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-gray-400" />発注情報
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">発注番号</label>
            <input
              disabled
              placeholder="自動採番"
              defaultValue={isEdit ? (recordId ?? "") : undefined}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/30 border border-white/50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">発注日</label>
            <DatePicker
              placeholder="発注日を選択"
              onChange={(d) => setOrderedAt(d ?? null)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">納期希望日</label>
            <DatePicker
              placeholder="納期を選択"
              onChange={(d) => setExpectedAt(d ?? null)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">納品先倉庫 <span className="text-red-500 text-xs">*必須</span></label>
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">担当者</label>
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="自分"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </GlassCard>

      {/* 仕入先情報 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />仕入先情報
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              仕入先コード
            </label>
            <input
              value={supplierCode}
              onChange={(e) => setSupplierCode(e.target.value)}
              placeholder="SUP-001"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              仕入先名 <span className="text-red-500 text-xs">*必須</span>
            </label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">選択してください</option>
              {SUPPLIERS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">担当者</label>
            <input
              value={supplierContact}
              onChange={(e) => setSupplierContact(e.target.value)}
              placeholder="鈴木 直子"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">連絡先</label>
            <input
              type="tel"
              value={supplierTel}
              onChange={(e) => setSupplierTel(e.target.value)}
              placeholder="03-0000-0000"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">メール</label>
            <input
              type="email"
              value={supplierEmail}
              onChange={(e) => setSupplierEmail(e.target.value)}
              placeholder="suzuki@example.com"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </GlassCard>

      {/* 発注明細 */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">
            発注明細 <span className="text-red-500 text-xs ml-1">*1行以上必須</span>
          </h2>
          <button
            onClick={addLine}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" />明細を追加
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  商品コード <span className="text-red-400">*</span>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品名</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">倉庫</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">単価</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                  数量 <span className="text-red-400">*</span>
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">小計</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const sub =
                  Number(l.unitPrice) * Number(l.qty) || 0;
                return (
                  <tr key={l.rowId} className="border-t border-white/30">
                    <td className="px-3 py-2">
                      <input
                        value={l.sku}
                        onChange={(e) => updateLine(l.rowId, "sku", e.target.value)}
                        className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50"
                        placeholder="WEP-001"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={l.skuName}
                        onChange={(e) => updateLine(l.rowId, "skuName", e.target.value)}
                        className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50"
                        placeholder="ワイヤレスイヤホン Pro"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={l.warehouse}
                        onChange={(e) => updateLine(l.rowId, "warehouse", e.target.value)}
                        className="h-7 px-2 rounded-lg text-xs bg-white/50 border border-white/50"
                      >
                        {WAREHOUSES.map((w) => (
                          <option key={w}>{w}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={l.unitPrice}
                        onChange={(e) => updateLine(l.rowId, "unitPrice", e.target.value)}
                        className="h-7 w-24 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right"
                        placeholder="4,500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={l.qty}
                        onChange={(e) => updateLine(l.rowId, "qty", e.target.value)}
                        className="h-7 w-16 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-center"
                        placeholder="50"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 tabular-nums text-xs">
                      {fmt(sub)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeLine(l.rowId)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-1 text-sm text-right">
          <div className="flex justify-end gap-8">
            <span className="text-gray-500">小計</span>
            <span className="w-32 text-gray-700 tabular-nums">{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-end gap-8">
            <span className="text-gray-500">消費税(10%)</span>
            <span className="w-32 text-gray-700 tabular-nums">{fmt(tax)}</span>
          </div>
          <div className="flex justify-end gap-8 pt-1 border-t border-white/40">
            <span className="font-medium text-gray-800">合計</span>
            <span className="w-32 font-bold text-gray-800 text-lg tabular-nums">{fmt(total)}</span>
          </div>
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
          placeholder="仕入先への連絡事項、社内メモなど..."
          className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
        />
      </GlassCard>

      {/* フッターボタン */}
      <div className="flex justify-end gap-2 pt-2">
        {isEdit && existing && existing.status !== "仕入完了" && existing.status !== "キャンセル" && (
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25 transition-all"
          >
            発注キャンセル
          </button>
        )}
        <button
          onClick={() => router.push(listPath)}
          className={cn(
            "px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all",
          )}
        >
          戻る
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
        >
          {isEdit ? "更新" : "発注確定"}
        </button>
      </div>
    </div>
  );
}
