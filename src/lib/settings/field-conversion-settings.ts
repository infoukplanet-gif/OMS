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
}

const DEFAULT: FieldMapping[] = [
  { id: "m-1", source: "楽天RMS", sourceField: "rcvOrderNum", target: "OMS受注", targetField: "external_order_no", transform: "そのまま", defaultValue: "—", required: true, enabled: true },
  { id: "m-2", source: "楽天RMS", sourceField: "rcvOrderName", target: "OMS受注", targetField: "customer_name", transform: "前後トリム", defaultValue: "—", required: true, enabled: true },
  { id: "m-3", source: "楽天RMS", sourceField: "telephone", target: "OMS受注", targetField: "tel", transform: "全角→半角", defaultValue: "—", required: true, enabled: true },
  { id: "m-4", source: "Yahoo!", sourceField: "OrderTime", target: "OMS受注", targetField: "ordered_at", transform: "日付フォーマット変換", defaultValue: "—", required: true, enabled: true },
  { id: "m-5", source: "Yahoo!", sourceField: "Subtotal", target: "OMS受注", targetField: "subtotal", transform: "数値化", defaultValue: "0", required: true, enabled: true },
  { id: "m-6", source: "Amazon SP-API", sourceField: "OrderStatus", target: "OMS受注", targetField: "order_status", transform: "辞書変換", defaultValue: "未処理", required: true, enabled: true },
  { id: "m-7", source: "FAX手入力", sourceField: "memo_freetext", target: "OMS受注", targetField: "remarks", transform: "そのまま", defaultValue: "—", required: false, enabled: true },
  { id: "m-8", source: "楽天RMS", sourceField: "shopOrderItemNum", target: "OMS明細", targetField: "external_line_no", transform: "数値化", defaultValue: "0", required: false, enabled: false },
];

let _items: FieldMapping[] = DEFAULT.map((m) => ({ ...m }));

export function getFieldMappings(): FieldMapping[] {
  return _items;
}

export function setFieldMappings(items: FieldMapping[]): void {
  _items = items.map((m) => ({ ...m }));
}

export function upsertFieldMapping(mapping: FieldMapping): void {
  const idx = _items.findIndex((m) => m.id === mapping.id);
  if (idx >= 0) {
    _items = _items.map((m) => (m.id === mapping.id ? { ...mapping } : m));
  } else {
    _items = [..._items, { ...mapping }];
  }
}

export function removeFieldMapping(id: string): void {
  _items = _items.filter((m) => m.id !== id);
}

export function resetFieldMappings(): void {
  _items = DEFAULT.map((m) => ({ ...m }));
}
