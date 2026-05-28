/**
 * shipmentStore の初期シード。
 *
 * v1 のクライアントセッション内ストアを画面横断で共有するための初期データ。
 * shipments/page（出荷一覧）と shipments/tracking/page（配送番号反映）の両方から import される。
 * どちらが先にマウントされても同じ出荷伝票群を共有するよう、ページローカルではなくここに集約する。
 *
 * orderIds は INITIAL_ORDERS と一致させること（cascade 連動・受注情報のクロス参照のため）。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import type { ShipmentRecord } from "@/lib/stores/shipment";
import type { ShipmentStatus } from "@/lib/state-machines/shipment";

/** 出荷一覧で扱う出荷レコード型。共有 ShipmentRecord に表示用フィールドを追加。 */
export type SeededShipment = ShipmentRecord & {
  customer: string;
  items: number;
  amount: number;
  carrier: string;
  shipDate: string;
  shop: string;
};

const make = (
  partial: Omit<SeededShipment, "orderIds" | "status"> & { orderIds?: string[]; status: ShipmentStatus },
): SeededShipment => {
  const { orderIds, ...rest } = partial;
  return {
    ...rest,
    orderIds: orderIds ?? [partial.id],
  } as SeededShipment;
};

export const INITIAL_SHIPMENTS: SeededShipment[] = [
  make({ id: "ORD-2026-08855", customer: "井上 智美", items: 2, amount: 14_200, carrier: "ヤマト運輸", shipDate: "2026/05/02", status: "出荷指示作成", shop: "本店" }),
  make({ id: "ORD-2026-08854", customer: "斎藤 拓海", items: 1, amount: 5_900, carrier: "佐川急便", shipDate: "2026/05/02", status: "ピッキング待ち", shop: "楽天店" }),
  make({ id: "ORD-2026-08853", customer: "森田 静香", items: 4, amount: 38_700, carrier: "ヤマト運輸", shipDate: "2026/05/02", status: "ピッキング待ち", shop: "本店" }),
  make({ id: "ORD-2026-08852", customer: "石田 浩二", items: 3, amount: 21_600, carrier: "日本郵便", shipDate: "2026/05/01", status: "検品待ち", shop: "Amazon店" }),
  make({ id: "ORD-2026-08851", customer: "山田 太郎", items: 3, amount: 32_400, carrier: "ヤマト運輸", shipDate: "2026/04/30", status: "出荷待ち", shop: "本店" }),
  make({ id: "ORD-2026-08850", customer: "佐藤 花子", items: 1, amount: 8_900, carrier: "佐川急便", shipDate: "2026/04/30", status: "出荷待ち", shop: "楽天店" }),
  make({ id: "ORD-2026-08849", customer: "田中 一郎", items: 5, amount: 154_000, carrier: "ヤマト運輸", shipDate: "2026/04/30", status: "出荷待ち", shop: "本店" }),
  make({ id: "ORD-2026-08848", customer: "渡辺 美咲", items: 2, amount: 24_800, carrier: "日本郵便", shipDate: "2026/05/01", status: "出荷待ち", shop: "Yahoo!店" }),
  make({ id: "ORD-2026-08847", customer: "木村 健", items: 1, amount: 6_200, carrier: "ヤマト運輸", shipDate: "2026/05/01", status: "出荷待ち", shop: "本店" }),
  make({ id: "ORD-2026-08846", customer: "渡辺 京子", items: 4, amount: 45_200, carrier: "佐川急便", shipDate: "2026/04/29", status: "出荷済み", shop: "Amazon店" }),
  make({ id: "ORD-2026-08845", customer: "伊藤 大輔", items: 2, amount: 18_600, carrier: "日本郵便", trackingNumber: "JP1234567890", shipDate: "2026/04/29", status: "出荷済み", shop: "本店" }),
  make({ id: "ORD-2026-08844", customer: "中村 あかり", items: 1, amount: 3_200, carrier: "ヤマト運輸", trackingNumber: "3456-7890-1234", shipDate: "2026/04/29", status: "配送中", shop: "Amazon店" }),
  make({ id: "ORD-2026-08843", customer: "小林 修", items: 3, amount: 67_500, carrier: "佐川急便", trackingNumber: "5678-9012-3456", shipDate: "2026/04/28", status: "配送中", shop: "楽天店" }),
  make({ id: "ORD-2026-08842", customer: "高橋 涼", items: 4, amount: 88_400, carrier: "西濃運輸", trackingNumber: "9012-3456-7890", shipDate: "2026/04/28", status: "配送中", shop: "本店" }),
  make({ id: "ORD-2026-08840", customer: "松本 愛", items: 2, amount: 15_800, carrier: "ヤマト運輸", trackingNumber: "7890-1234-5678", shipDate: "2026/04/27", status: "配達完了", shop: "本店" }),
  make({ id: "ORD-2026-08839", customer: "木村 拓也", items: 1, amount: 4_200, carrier: "日本郵便", trackingNumber: "JP9876543210", shipDate: "2026/04/27", status: "配達完了", shop: "Yahoo!店" }),
  make({ id: "ORD-2026-08838", customer: "吉田 あゆみ", items: 2, amount: 12_300, carrier: "佐川急便", trackingNumber: "1357-2468-9876", shipDate: "2026/04/26", status: "配達完了", shop: "本店" }),
  make({ id: "ORD-2026-08837", customer: "原田 明", items: 1, amount: 4_800, carrier: "ヤマト運輸", shipDate: "2026/04/26", status: "キャンセル", shop: "Yahoo!店" }),
];
