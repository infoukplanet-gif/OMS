/**
 * 受注設定 共有マスタストア（single-config 1-record パターン）。
 *
 * 規定値設定・支払方法別手数料・支払発送変換・日付自動登録・除外地域の
 * 5 セクションを id 固定の 1 レコードとして createMasterStore に載せる。
 *
 * 永続化（domain: "order-rules-settings"）の正規オーナーページは
 * src/app/settings/order-rules/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

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

/**
 * 受注設定の具体フィールド（index signature なし）。
 */
export interface OrderRulesFields {
  defaults: OrderDefaultRow[];
  fees: OrderFeeRow[];
  conversions: OrderConversionRow[];
  dateRules: OrderDateRuleRow[];
  excludedAreas: string[];
}

export interface OrderRulesRecord extends OrderRulesFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_ORDER_RULES: OrderRulesFields = {
  defaults: [
    { key: "payment", label: "デフォルト支払方法", value: "クレジットカード" },
    { key: "shipping", label: "デフォルト配送方法", value: "ヤマト運輸" },
    { key: "warehouse", label: "デフォルト倉庫", value: "東京本社倉庫" },
    { key: "tax", label: "税率", value: "10%" },
    { key: "fee", label: "送料（標準）", value: "¥800" },
    { key: "freeShip", label: "送料無料条件", value: "¥10,000以上" },
  ],
  fees: [
    { method: "クレジットカード", fee: "0%", note: "" },
    { method: "銀行振込", fee: "0%", note: "振込手数料は顧客負担" },
    { method: "代金引換", fee: "¥330", note: "一律" },
    { method: "請求書払い", fee: "0%", note: "卸先のみ" },
  ],
  conversions: [
    { type: "支払方法", from: "クレジットカード", to: "クレジット", shop: "楽天市場" },
    { type: "支払方法", from: "銀行振込（前払）", to: "銀行振込", shop: "Yahoo!" },
    { type: "発送方法", from: "ヤマト宅急便", to: "ヤマト運輸", shop: "全店舗" },
    { type: "発送方法", from: "佐川飛脚便", to: "佐川急便", shop: "全店舗" },
  ],
  dateRules: [
    { name: "出荷予定日", rule: "受注日 + 1営業日" },
    { name: "お届け予定日", rule: "出荷予定日 + 2営業日" },
    { name: "支払期限日", rule: "受注日 + 7日" },
    { name: "請求日", rule: "月末締" },
  ],
  excludedAreas: [],
};

export const INITIAL_ORDER_RULES: OrderRulesRecord[] = [
  { id: "config", ...DEFAULT_ORDER_RULES },
];

export const orderRulesStore: MasterStore<OrderRulesRecord> =
  createMasterStore<OrderRulesRecord>(INITIAL_ORDER_RULES);
