/**
 * 発注書ドキュメントモデル生成（純粋関数・Date-free）。
 *
 * 発注レコード（仕入先・明細・金額）と帳票テンプレート設定（言語・表示フラグ）を
 * 受け取り、印刷可能ビュー（PurchaseOrderPrint）がそのまま描画できる構造化
 * ドキュメントを返す。言語別ラベル・税内訳・行金額の算出をここに集約する。
 *
 * ここは src/lib なので Date を触らない。発行日は呼び出し側が文字列で渡す
 * （省略時は発注レコードの date を流用）。
 */

import type { TemplateLanguage, TemplatePaperSize } from "@/lib/seeds/document-templates";

/** 消費税率（発注書の税内訳表示で使用）。 */
export const PURCHASE_ORDER_TAX_RATE = 0.1;

/** 発注書生成に必要なテンプレート設定（DocumentTemplate の表示系サブセット）。 */
export interface DocumentTemplateConfig {
  language: TemplateLanguage;
  paperSize: TemplatePaperSize;
  showLogo: boolean;
  showInvoice: boolean;
  showSignature: boolean;
  showTaxBreakdown: boolean;
}

/** 発注書生成の入力となる発注レコード（SeededPurchaseOrder から必要分を抽出）。 */
export interface PurchaseOrderSource {
  id: string;
  supplier: string;
  /** 発注日（YYYY-MM-DD 文字列）。 */
  date: string;
  /** 入荷予定日。「—」「空」は予定なし扱い。 */
  expected?: string;
  /** 発注書の総額（明細単価が無い場合の小計フォールバック）。 */
  amount: number;
  lines: ReadonlyArray<{
    sku: string;
    name?: string;
    warehouse?: string;
    orderedQty: number;
    unitPrice?: number;
  }>;
}

export interface PurchaseOrderDocumentLine {
  sku: string;
  name: string;
  warehouse: string | null;
  quantity: number;
  unitPrice: number | null;
  amount: number | null;
}

export interface PurchaseOrderDocumentLabels {
  title: string;
  documentNo: string;
  issueDate: string;
  supplier: string;
  expected: string;
  item: string;
  sku: string;
  warehouse: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  subtotal: string;
  tax: string;
  total: string;
  invoiceNo: string;
  signature: string;
}

export interface PurchaseOrderDocument {
  title: string;
  documentNo: string;
  issueDate: string;
  supplierName: string;
  expectedDate: string | null;
  lines: PurchaseOrderDocumentLine[];
  subtotal: number;
  taxRate: number;
  tax: number | null;
  total: number;
  showLogo: boolean;
  showInvoice: boolean;
  showSignature: boolean;
  showTaxBreakdown: boolean;
  language: TemplateLanguage;
  paperSize: TemplatePaperSize;
  labels: PurchaseOrderDocumentLabels;
}

const LABELS: Record<TemplateLanguage, PurchaseOrderDocumentLabels> = {
  日本語: {
    title: "発注書",
    documentNo: "発注番号",
    issueDate: "発注日",
    supplier: "仕入先",
    expected: "入荷予定日",
    item: "品目",
    sku: "商品コード",
    warehouse: "入庫倉庫",
    quantity: "数量",
    unitPrice: "単価",
    amount: "金額",
    subtotal: "小計",
    tax: "消費税",
    total: "合計",
    invoiceNo: "適格請求書発行事業者番号",
    signature: "社印 / 担当者印",
  },
  English: {
    title: "Purchase Order",
    documentNo: "PO No.",
    issueDate: "Order Date",
    supplier: "Supplier",
    expected: "Expected Delivery",
    item: "Item",
    sku: "SKU",
    warehouse: "Warehouse",
    quantity: "Qty",
    unitPrice: "Unit Price",
    amount: "Amount",
    subtotal: "Subtotal",
    tax: "Tax",
    total: "Total",
    invoiceNo: "Invoice Reg. No.",
    signature: "Authorized Signature",
  },
  中文: {
    title: "采购订单",
    documentNo: "采购单号",
    issueDate: "采购日期",
    supplier: "供应商",
    expected: "预计到货日",
    item: "品名",
    sku: "商品编码",
    warehouse: "入库仓库",
    quantity: "数量",
    unitPrice: "单价",
    amount: "金额",
    subtotal: "小计",
    tax: "税额",
    total: "合计",
    invoiceNo: "发票登记号",
    signature: "盖章 / 经办人",
  },
};

function normalizeExpected(expected: string | undefined): string | null {
  if (!expected) return null;
  const trimmed = expected.trim();
  if (trimmed === "" || trimmed === "—" || trimmed === "-") return null;
  return trimmed;
}

export function buildPurchaseOrderDocument(
  source: PurchaseOrderSource,
  template: DocumentTemplateConfig,
  issueDate?: string,
): PurchaseOrderDocument {
  const labels = LABELS[template.language];

  const lines: PurchaseOrderDocumentLine[] = source.lines.map((line) => {
    const hasPrice = typeof line.unitPrice === "number";
    const unitPrice = hasPrice ? (line.unitPrice as number) : null;
    return {
      sku: line.sku,
      name: line.name && line.name.trim() !== "" ? line.name : line.sku,
      warehouse: line.warehouse && line.warehouse.trim() !== "" ? line.warehouse : null,
      quantity: line.orderedQty,
      unitPrice,
      amount: unitPrice !== null ? unitPrice * line.orderedQty : null,
    };
  });

  const allPriced = lines.length > 0 && lines.every((l) => l.amount !== null);
  const subtotal = allPriced
    ? lines.reduce((sum, l) => sum + (l.amount ?? 0), 0)
    : source.amount;

  const tax = template.showTaxBreakdown ? Math.round(subtotal * PURCHASE_ORDER_TAX_RATE) : null;
  const total = tax !== null ? subtotal + tax : subtotal;

  return {
    title: labels.title,
    documentNo: source.id,
    issueDate: issueDate ?? source.date,
    supplierName: source.supplier,
    expectedDate: normalizeExpected(source.expected),
    lines,
    subtotal,
    taxRate: PURCHASE_ORDER_TAX_RATE,
    tax,
    total,
    showLogo: template.showLogo,
    showInvoice: template.showInvoice,
    showSignature: template.showSignature,
    showTaxBreakdown: template.showTaxBreakdown,
    language: template.language,
    paperSize: template.paperSize,
    labels,
  };
}
