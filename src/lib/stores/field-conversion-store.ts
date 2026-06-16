/**
 * 項目変換設定 共有マスタストア
 *
 * 外部モール・取込データの項目を OMS 内部項目へマッピングするルールの CRUD を
 * 画面横断で共有する。永続化（domain: "field-conversion-settings"）の
 * 正規オーナーページは src/app/settings/field-conversion/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type FieldTransform =
  | "そのまま"
  | "全角→半角"
  | "半角→全角"
  | "前後トリム"
  | "数値化"
  | "日付フォーマット変換"
  | "正規表現"
  | "辞書変換";

export interface FieldMapping {
  id: string;
  source: string;
  sourceField: string;
  target: string;
  targetField: string;
  transform: FieldTransform;
  defaultValue: string;
  required: boolean;
  enabled: boolean;
  [extra: string]: unknown;
}

export const INITIAL_FIELD_MAPPINGS: FieldMapping[] = [
  { id: "m-1", source: "楽天RMS", sourceField: "rcvOrderNum", target: "OMS受注", targetField: "external_order_no", transform: "そのまま", defaultValue: "—", required: true, enabled: true },
  { id: "m-2", source: "楽天RMS", sourceField: "rcvOrderName", target: "OMS受注", targetField: "customer_name", transform: "前後トリム", defaultValue: "—", required: true, enabled: true },
  { id: "m-3", source: "楽天RMS", sourceField: "telephone", target: "OMS受注", targetField: "tel", transform: "全角→半角", defaultValue: "—", required: true, enabled: true },
  { id: "m-4", source: "Yahoo!", sourceField: "OrderTime", target: "OMS受注", targetField: "ordered_at", transform: "日付フォーマット変換", defaultValue: "—", required: true, enabled: true },
  { id: "m-5", source: "Yahoo!", sourceField: "Subtotal", target: "OMS受注", targetField: "subtotal", transform: "数値化", defaultValue: "0", required: true, enabled: true },
  { id: "m-6", source: "Amazon SP-API", sourceField: "OrderStatus", target: "OMS受注", targetField: "order_status", transform: "辞書変換", defaultValue: "未処理", required: true, enabled: true },
  { id: "m-7", source: "FAX手入力", sourceField: "memo_freetext", target: "OMS受注", targetField: "remarks", transform: "そのまま", defaultValue: "—", required: false, enabled: true },
  { id: "m-8", source: "楽天RMS", sourceField: "shopOrderItemNum", target: "OMS明細", targetField: "external_line_no", transform: "数値化", defaultValue: "0", required: false, enabled: false },
];

/** クライアントセッション内で共有される単一の FieldConversionStore インスタンス */
export const fieldConversionStore: MasterStore<FieldMapping> =
  createMasterStore<FieldMapping>(INITIAL_FIELD_MAPPINGS);
