/**
 * 帳票テンプレート（発注書フォーマット）の共有シード。
 *
 * 「設定 > 発注書テンプレート設定」(purchasing/order-template) が読み書きし、
 * 発注書発行（purchasing 一覧の「発注書発行」）と発注書ダウンロード
 * (purchasing/order-download) のテンプレート選択肢がここを参照する。
 *
 * テンプレートの表示フラグ（ロゴ/インボイス/社印/税内訳）と言語・用紙サイズが
 * buildPurchaseOrderDocument を通して実際の発注書レイアウトに反映される。
 *
 * v1 はクライアントセッション内シングルトン（リロードで初期化）。
 * 永続化は usePersistentStore + snapshotDomain/restoreDomain で別途行う。
 */

export type TemplateLanguage = "日本語" | "English" | "中文";
export type TemplatePaperSize = "A4縦" | "A4横";

/** 帳票テンプレート1件。id を一意キーとする（MasterRecord 互換）。 */
export interface DocumentTemplate {
  id: string;
  name: string;
  language: TemplateLanguage;
  paperSize: TemplatePaperSize;
  /** 社ロゴ画像を表示。 */
  showLogo: boolean;
  /** インボイス番号を印字。 */
  showInvoice: boolean;
  /** 社印・担当者印欄を表示。 */
  showSignature: boolean;
  /** 税内訳（小計・消費税）を表示。 */
  showTaxBreakdown: boolean;
  /** 有効化（無効テンプレートは発行候補に出さない）。 */
  active: boolean;
  updatedAt: string;
  [extra: string]: unknown;
}

export const INITIAL_DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  { id: "T-01", name: "標準発注書", language: "日本語", paperSize: "A4縦", showLogo: true, showInvoice: true, showSignature: true, showTaxBreakdown: true, active: true, updatedAt: "2026-04-22" },
  { id: "T-02", name: "海外仕入先向け", language: "English", paperSize: "A4縦", showLogo: true, showInvoice: false, showSignature: true, showTaxBreakdown: false, active: true, updatedAt: "2026-04-15" },
  { id: "T-03", name: "中国仕入先向け", language: "中文", paperSize: "A4縦", showLogo: true, showInvoice: false, showSignature: true, showTaxBreakdown: false, active: true, updatedAt: "2026-04-10" },
  { id: "T-04", name: "簡易版", language: "日本語", paperSize: "A4横", showLogo: false, showInvoice: false, showSignature: false, showTaxBreakdown: true, active: false, updatedAt: "2026-03-20" },
];
