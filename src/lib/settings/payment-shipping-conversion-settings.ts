export type ConvType = "payment" | "shipping";

export interface Conv {
  id: string;
  type: ConvType;
  source: string;
  sourceValue: string;
  target: string;
  enabled: boolean;
  priority: number;
}

const DEFAULT: Conv[] = [
  { id: "p-1", type: "payment", source: "楽天RMS", sourceValue: "credit", target: "クレジットカード", enabled: true, priority: 1 },
  { id: "p-2", type: "payment", source: "楽天RMS", sourceValue: "cod", target: "代金引換", enabled: true, priority: 1 },
  { id: "p-3", type: "payment", source: "楽天RMS", sourceValue: "bank", target: "銀行振込（前払い）", enabled: true, priority: 1 },
  { id: "p-4", type: "payment", source: "楽天RMS", sourceValue: "rakutenpay", target: "クレジットカード", enabled: true, priority: 2 },
  { id: "p-5", type: "payment", source: "Yahoo!", sourceValue: "クレジットカード", target: "クレジットカード", enabled: true, priority: 1 },
  { id: "p-6", type: "payment", source: "Yahoo!", sourceValue: "代金引換", target: "代金引換", enabled: true, priority: 1 },
  { id: "p-7", type: "payment", source: "Amazon SP-API", sourceValue: "Other", target: "Amazon Pay", enabled: true, priority: 1 },
  { id: "s-1", type: "shipping", source: "楽天RMS", sourceValue: "宅配便A", target: "ヤマト運輸", enabled: true, priority: 1 },
  { id: "s-2", type: "shipping", source: "楽天RMS", sourceValue: "宅配便B", target: "佐川急便", enabled: true, priority: 1 },
  { id: "s-3", type: "shipping", source: "楽天RMS", sourceValue: "メール便", target: "ゆうパケット", enabled: true, priority: 1 },
  { id: "s-4", type: "shipping", source: "Yahoo!", sourceValue: "宅配便", target: "ヤマト運輸", enabled: true, priority: 1 },
  { id: "s-5", type: "shipping", source: "Amazon SP-API", sourceValue: "Standard", target: "ヤマト運輸", enabled: true, priority: 1 },
  { id: "s-6", type: "shipping", source: "Amazon SP-API", sourceValue: "Expedited", target: "ヤマト運輸（翌日）", enabled: true, priority: 1 },
  { id: "s-7", type: "shipping", source: "FAX手入力", sourceValue: "—", target: "ヤマト運輸", enabled: false, priority: 9 },
];

let _items: Conv[] = DEFAULT.map((c) => ({ ...c }));

export function getConversions(): Conv[] {
  return _items;
}

export function setConversions(items: Conv[]): void {
  _items = items.map((c) => ({ ...c }));
}

export function upsertConversion(conv: Conv): void {
  const idx = _items.findIndex((c) => c.id === conv.id);
  if (idx >= 0) {
    _items = _items.map((c) => (c.id === conv.id ? { ...conv } : c));
  } else {
    _items = [..._items, { ...conv }];
  }
}

export function removeConversion(id: string): void {
  _items = _items.filter((c) => c.id !== id);
}

export function resetConversions(): void {
  _items = DEFAULT.map((c) => ({ ...c }));
}
