/**
 * 出荷指示書ドキュメントモデル生成（純粋関数・Date-free）。
 *
 * 出荷レコードと帳票テンプレート設定を受け取り、
 * 印刷可能ビューが描画できる構造化ドキュメントを返す。
 * src/lib なので Date を触らない。発行日は呼び出し側が文字列で渡す。
 */

/** 出荷指示書テンプレート設定（表示系サブセット）。 */
export interface ShipmentInstructionTemplateConfig {
  paperSize: "A4縦" | "A4横" | "ピッキングリスト形式";
  showBarcode: boolean;
  showLocation: boolean;
  showLot: boolean;
  showSetSplit: boolean;
  forWarehouse: "汎用" | "本社倉庫" | "外部委託" | "楽天スーパーロジ";
}

/** 出荷指示書生成の入力となる出荷レコード。 */
export interface ShipmentInstructionSource {
  id: string;
  customer: string;
  /** 出荷予定日（YYYY/MM/DD 文字列）。 */
  shipDate: string;
  carrier: string;
  shop: string;
  items: number;
  amount: number;
  trackingNumber?: string;
  lines?: ReadonlyArray<{
    sku: string;
    name?: string;
    qty: number;
    location?: string;
    lot?: string;
  }>;
}

export interface ShipmentInstructionDocumentLine {
  sku: string;
  name: string;
  qty: number;
  location: string | null;
  lot: string | null;
}

export interface ShipmentInstructionDocument {
  documentNo: string;
  issueDate: string;
  customerName: string;
  shipDate: string;
  carrier: string;
  shop: string;
  totalItems: number;
  totalAmount: number;
  trackingNumber: string | null;
  lines: ShipmentInstructionDocumentLine[];
  showBarcode: boolean;
  showLocation: boolean;
  showLot: boolean;
  showSetSplit: boolean;
  paperSize: "A4縦" | "A4横" | "ピッキングリスト形式";
  forWarehouse: string;
}

export function buildShipmentInstructionDocument(
  source: ShipmentInstructionSource,
  template: ShipmentInstructionTemplateConfig,
  issueDate?: string,
): ShipmentInstructionDocument {
  const lines: ShipmentInstructionDocumentLine[] = (source.lines ?? []).map((line) => ({
    sku: line.sku,
    name: line.name && line.name.trim() !== "" ? line.name : line.sku,
    qty: line.qty,
    location: template.showLocation && line.location ? line.location : null,
    lot: template.showLot && line.lot ? line.lot : null,
  }));

  // lines がなければダミー1行で出力する（出荷指示書の最低限の情報）
  if (lines.length === 0) {
    lines.push({
      sku: source.id,
      name: `（${source.items}点）`,
      qty: source.items,
      location: null,
      lot: null,
    });
  }

  return {
    documentNo: source.id,
    issueDate: issueDate ?? source.shipDate,
    customerName: source.customer,
    shipDate: source.shipDate,
    carrier: source.carrier,
    shop: source.shop,
    totalItems: source.items,
    totalAmount: source.amount,
    trackingNumber: source.trackingNumber ?? null,
    lines,
    showBarcode: template.showBarcode,
    showLocation: template.showLocation,
    showLot: template.showLot,
    showSetSplit: template.showSetSplit,
    paperSize: template.paperSize,
    forWarehouse: template.forWarehouse,
  };
}
