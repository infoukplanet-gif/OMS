/**
 * 出荷可能設定 共有マスタストア（single-config 1-record パターン）。
 *
 * 在庫引当ルール・配送業者別リードタイム/締切時刻・出荷定休日を
 * id 固定の 1 レコードとして保持し、画面横断で共有・永続化する。
 * 受注取込・出荷指示の自動判定で参照される設定。秘密情報は含まない。
 *
 * 永続化（domain: "shipment-availability"）の正規オーナーページは
 * src/app/shipments/availability/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type StockMode = "reserved" | "actual";
export type Carrier = "ヤマト" | "佐川" | "日本郵便" | "西濃";
export type Weekday = "月" | "火" | "水" | "木" | "金" | "土" | "日";

/**
 * 出荷可能設定の具体フィールド（index signature なし）。
 * フォーム側の `keyof` / `Omit` が壊れないよう Record とは別に定義する。
 */
export interface ShipmentAvailabilityFields {
  stockMode: StockMode;
  reserveOnImport: boolean;
  allowBackorder: boolean;
  autoAlternative: boolean;
  allowSetSplit: boolean;
  shippingDays: Record<Carrier, number>;
  cutoffByCarrier: Record<Carrier, string>;
  restDays: Weekday[];
}

export interface ShipmentAvailabilityRecord extends ShipmentAvailabilityFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_SHIPMENT_AVAILABILITY: ShipmentAvailabilityFields = {
  stockMode: "reserved",
  reserveOnImport: true,
  allowBackorder: false,
  autoAlternative: false,
  allowSetSplit: true,
  shippingDays: { ヤマト: 1, 佐川: 1, 日本郵便: 2, 西濃: 2 },
  cutoffByCarrier: { ヤマト: "15:00", 佐川: "14:00", 日本郵便: "13:00", 西濃: "12:00" },
  restDays: ["日"],
};

export const INITIAL_SHIPMENT_AVAILABILITY: ShipmentAvailabilityRecord[] = [
  { id: "config", ...DEFAULT_SHIPMENT_AVAILABILITY },
];

export const shipmentAvailabilityStore: MasterStore<ShipmentAvailabilityRecord> =
  createMasterStore<ShipmentAvailabilityRecord>(INITIAL_SHIPMENT_AVAILABILITY);
