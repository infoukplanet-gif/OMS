/**
 * 納品書ドキュメントモデル生成（純粋関数・Date-free）。
 *
 * 出荷レコードと帳票テンプレート設定を受け取り、
 * 印刷可能ビューが描画できる構造化ドキュメントを返す。
 * src/lib なので Date を触らない。発行日は呼び出し側が文字列で渡す。
 */

/** 消費税率 */
export const DELIVERY_NOTE_TAX_RATE = 0.1;

/** 納品書テンプレート設定（表示系サブセット）。 */
export interface DeliveryNoteTemplateConfig {
  paperSize: "A4縦" | "A4横" | "B5" | "B5横";
  forUse: "汎用" | "個人顧客" | "卸先" | "VIP";
  showLogo: boolean;
  showInvoice: boolean;
  showPriceBreakdown: boolean;
  showSignature: boolean;
}

/** 納品書生成の入力となる出荷レコード。 */
export interface DeliveryNoteSource {
  id: string;
  customer: string;
  /** 出荷予定日（YYYY/MM/DD 文字列）。 */
  shipDate: string;
  carrier: string;
  shop: string;
  amount: number;
  lines?: ReadonlyArray<{
    sku: string;
    name?: string;
    qty: number;
    unitPrice?: number;
  }>;
}

export interface DeliveryNoteDocumentLine {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number | null;
  amount: number | null;
}

export interface DeliveryNoteDocument {
  documentNo: string;
  issueDate: string;
  customerName: string;
  shipDate: string;
  carrier: string;
  shop: string;
  lines: DeliveryNoteDocumentLine[];
  subtotal: number;
  taxRate: number;
  tax: number | null;
  total: number;
  showLogo: boolean;
  showInvoice: boolean;
  showPriceBreakdown: boolean;
  showSignature: boolean;
  paperSize: "A4縦" | "A4横" | "B5" | "B5横";
  forUse: string;
}

export function buildDeliveryNoteDocument(
  source: DeliveryNoteSource,
  template: DeliveryNoteTemplateConfig,
  issueDate?: string,
): DeliveryNoteDocument {
  const lines: DeliveryNoteDocumentLine[] = (source.lines ?? []).map((line) => {
    const hasPrice = typeof line.unitPrice === "number";
    const unitPrice = hasPrice ? (line.unitPrice as number) : null;
    return {
      sku: line.sku,
      name: line.name && line.name.trim() !== "" ? line.name : line.sku,
      qty: line.qty,
      unitPrice,
      amount: unitPrice !== null ? unitPrice * line.qty : null,
    };
  });

  // lines がなければダミー1行
  if (lines.length === 0) {
    lines.push({
      sku: source.id,
      name: "（明細省略）",
      qty: 1,
      unitPrice: source.amount,
      amount: source.amount,
    });
  }

  const allPriced = lines.every((l) => l.amount !== null);
  const subtotal = allPriced ? lines.reduce((s, l) => s + (l.amount ?? 0), 0) : source.amount;
  const tax = template.showPriceBreakdown ? Math.round(subtotal * DELIVERY_NOTE_TAX_RATE) : null;
  const total = tax !== null ? subtotal + tax : subtotal;

  return {
    documentNo: source.id,
    issueDate: issueDate ?? source.shipDate,
    customerName: source.customer,
    shipDate: source.shipDate,
    carrier: source.carrier,
    shop: source.shop,
    lines,
    subtotal,
    taxRate: DELIVERY_NOTE_TAX_RATE,
    tax,
    total,
    showLogo: template.showLogo,
    showInvoice: template.showInvoice,
    showPriceBreakdown: template.showPriceBreakdown,
    showSignature: template.showSignature,
    paperSize: template.paperSize,
    forUse: template.forUse,
  };
}
