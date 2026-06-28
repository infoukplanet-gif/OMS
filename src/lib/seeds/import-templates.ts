/**
 * 取込マッピングテンプレートのシード。
 *
 * 各取込ページ（受注／商品／仕入先／卸先）のマッピング設定テンプレート名一覧。
 * 「新規保存」でユーザーが追加した名前がリロードで消えないよう、取込コンテキストごとに
 * 専用ストア + usePersistentStore で永続化する。各取込ページが自分のコンテキストのオーナー。
 */

export interface ImportTemplateRecord {
  id: string;
  name: string;
  [extra: string]: unknown;
}

const toRecords = (names: readonly string[]): ImportTemplateRecord[] =>
  names.map((name) => ({ id: name, name }));

export const INITIAL_ORDER_IMPORT_TEMPLATES: ImportTemplateRecord[] = toRecords([
  "楽天CSV用",
  "Amazon用",
  "卸先A用",
]);

export const INITIAL_PRODUCT_IMPORT_TEMPLATES: ImportTemplateRecord[] = toRecords([
  "楽天RMS用",
  "Amazon SP-API用",
  "Shopify用",
  "自社EDI用",
]);

export const INITIAL_SUPPLIER_IMPORT_TEMPLATES: ImportTemplateRecord[] = toRecords([
  "自社CSV用",
  "仕入管理エクセル用",
  "銀行マスタ連携用",
]);

export const INITIAL_WHOLESALE_IMPORT_TEMPLATES: ImportTemplateRecord[] = toRecords([
  "自社CSV用",
  "MerchantSync連携用",
  "卸先A帳票用",
]);
