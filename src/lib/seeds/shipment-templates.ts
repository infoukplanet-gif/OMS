/**
 * 出荷指示書・納品書テンプレートの共有シード。
 *
 * 出荷指示書テンプレート（ShipmentInstructionTemplate）は
 * shipments/instruction-template ページが読み書きし、
 * 出荷一覧の「出荷指示書発行モーダル」がテンプレート選択肢として参照する。
 *
 * 納品書テンプレート（DeliveryNoteTemplate）は
 * shipments/delivery-note-template ページが読み書きし、
 * 出荷一覧の「納品書発行モーダル」がテンプレート選択肢として参照する。
 */

/** 出荷指示書テンプレート1件。 */
export interface ShipmentInstructionTemplate {
  id: string;
  name: string;
  forWarehouse: "汎用" | "本社倉庫" | "外部委託" | "楽天スーパーロジ";
  paperSize: "A4縦" | "A4横" | "ピッキングリスト形式";
  showBarcode: boolean;
  showLocation: boolean;
  showLot: boolean;
  showSetSplit: boolean;
  active: boolean;
  updatedAt: string;
  [extra: string]: unknown;
}

export const INITIAL_INSTRUCTION_TEMPLATES: ShipmentInstructionTemplate[] = [
  { id: "I-01", name: "本社倉庫 標準", forWarehouse: "本社倉庫", paperSize: "A4縦", showBarcode: true, showLocation: true, showLot: true, showSetSplit: true, active: true, updatedAt: "2026-04-22" },
  { id: "I-02", name: "外部委託 簡易版", forWarehouse: "外部委託", paperSize: "A4縦", showBarcode: true, showLocation: false, showLot: false, showSetSplit: true, active: true, updatedAt: "2026-04-18" },
  { id: "I-03", name: "楽天スーパーロジ連携", forWarehouse: "楽天スーパーロジ", paperSize: "ピッキングリスト形式", showBarcode: true, showLocation: true, showLot: false, showSetSplit: false, active: true, updatedAt: "2026-04-15" },
  { id: "I-04", name: "汎用ピッキング", forWarehouse: "汎用", paperSize: "A4横", showBarcode: false, showLocation: true, showLot: true, showSetSplit: true, active: false, updatedAt: "2026-03-30" },
];

/** 納品書テンプレート1件。 */
export interface DeliveryNoteTemplate {
  id: string;
  name: string;
  forUse: "汎用" | "個人顧客" | "卸先" | "VIP";
  paperSize: "A4縦" | "A4横" | "B5" | "B5横";
  showLogo: boolean;
  showInvoice: boolean;
  showPriceBreakdown: boolean;
  showSignature: boolean;
  active: boolean;
  updatedAt: string;
  [extra: string]: unknown;
}

export const INITIAL_DELIVERY_NOTE_TEMPLATES: DeliveryNoteTemplate[] = [
  { id: "D-01", name: "標準納品書", forUse: "汎用", paperSize: "A4縦", showLogo: true, showInvoice: true, showPriceBreakdown: true, showSignature: false, active: true, updatedAt: "2026-04-15" },
  { id: "D-02", name: "卸先専用 (A4横)", forUse: "卸先", paperSize: "A4横", showLogo: true, showInvoice: true, showPriceBreakdown: true, showSignature: true, active: true, updatedAt: "2026-04-12" },
  { id: "D-03", name: "VIP高級紙対応", forUse: "VIP", paperSize: "A4縦", showLogo: true, showInvoice: true, showPriceBreakdown: false, showSignature: true, active: true, updatedAt: "2026-03-28" },
  { id: "D-04", name: "簡易納品書 (B5)", forUse: "個人顧客", paperSize: "B5", showLogo: false, showInvoice: false, showPriceBreakdown: true, showSignature: false, active: false, updatedAt: "2026-02-14" },
];
