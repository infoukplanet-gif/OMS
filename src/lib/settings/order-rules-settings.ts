export interface OrderDefaultRow {
  key: string;
  label: string;
  value: string;
}

export interface OrderFeeRow {
  method: string;
  fee: string;
  note: string;
}

export interface OrderConversionRow {
  type: "支払方法" | "発送方法";
  from: string;
  to: string;
  shop: string;
}

export interface OrderDateRuleRow {
  name: string;
  rule: string;
}

const DEFAULT_DEFAULTS: OrderDefaultRow[] = [
  { key: "payment", label: "デフォルト支払方法", value: "クレジットカード" },
  { key: "shipping", label: "デフォルト配送方法", value: "ヤマト運輸" },
  { key: "warehouse", label: "デフォルト倉庫", value: "東京本社倉庫" },
  { key: "tax", label: "税率", value: "10%" },
  { key: "fee", label: "送料（標準）", value: "¥800" },
  { key: "freeShip", label: "送料無料条件", value: "¥10,000以上" },
];

const DEFAULT_FEES: OrderFeeRow[] = [
  { method: "クレジットカード", fee: "0%", note: "" },
  { method: "銀行振込", fee: "0%", note: "振込手数料は顧客負担" },
  { method: "代金引換", fee: "¥330", note: "一律" },
  { method: "請求書払い", fee: "0%", note: "卸先のみ" },
];

const DEFAULT_CONVERSIONS: OrderConversionRow[] = [
  { type: "支払方法", from: "クレジットカード", to: "クレジット", shop: "楽天市場" },
  { type: "支払方法", from: "銀行振込（前払）", to: "銀行振込", shop: "Yahoo!" },
  { type: "発送方法", from: "ヤマト宅急便", to: "ヤマト運輸", shop: "全店舗" },
  { type: "発送方法", from: "佐川飛脚便", to: "佐川急便", shop: "全店舗" },
];

const DEFAULT_DATE_RULES: OrderDateRuleRow[] = [
  { name: "出荷予定日", rule: "受注日 + 1営業日" },
  { name: "お届け予定日", rule: "出荷予定日 + 2営業日" },
  { name: "支払期限日", rule: "受注日 + 7日" },
  { name: "請求日", rule: "月末締" },
];

let _defaults: OrderDefaultRow[] = DEFAULT_DEFAULTS.map((d) => ({ ...d }));
let _fees: OrderFeeRow[] = DEFAULT_FEES.map((f) => ({ ...f }));
let _conversions: OrderConversionRow[] = DEFAULT_CONVERSIONS.map((c) => ({ ...c }));
let _dateRules: OrderDateRuleRow[] = DEFAULT_DATE_RULES.map((r) => ({ ...r }));
let _excludedAreas: string[] = [];

export function getOrderDefaults(): OrderDefaultRow[] { return _defaults; }
export function setOrderDefaults(rows: OrderDefaultRow[]): void { _defaults = rows.map((d) => ({ ...d })); }

export function getOrderFees(): OrderFeeRow[] { return _fees; }
export function setOrderFees(rows: OrderFeeRow[]): void { _fees = rows.map((f) => ({ ...f })); }

export function getOrderConversions(): OrderConversionRow[] { return _conversions; }
export function setOrderConversions(rows: OrderConversionRow[]): void { _conversions = rows.map((c) => ({ ...c })); }

export function getOrderDateRules(): OrderDateRuleRow[] { return _dateRules; }
export function setOrderDateRules(rows: OrderDateRuleRow[]): void { _dateRules = rows.map((r) => ({ ...r })); }

export function getExcludedAreas(): string[] { return [..._excludedAreas]; }
export function setExcludedAreas(areas: string[]): void { _excludedAreas = [...areas]; }

export function resetOrderRules(): void {
  _defaults = DEFAULT_DEFAULTS.map((d) => ({ ...d }));
  _fees = DEFAULT_FEES.map((f) => ({ ...f }));
  _conversions = DEFAULT_CONVERSIONS.map((c) => ({ ...c }));
  _dateRules = DEFAULT_DATE_RULES.map((r) => ({ ...r }));
  _excludedAreas = [];
}
