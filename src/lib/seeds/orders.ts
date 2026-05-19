/**
 * orderStore の初期シード。
 *
 * v1 のクライアントセッション内ストアを画面横断で共有する際、
 * 最初にマウントされたページが空ストアにセットする初期データ。
 * orders/page と orders/new の両方から import される。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import type { OrderRecord } from "@/lib/stores/orders";
import type { AllocationLine } from "@/lib/state-machines/inventory";

export type OrderSeed = OrderRecord & {
  shop: string;
  customer: string;
  items: number;
  amount: number;
  payment: string;
  date: string;
  allocation: AllocationLine[];
};

/** allocation の 1 行ヘルパ。 */
const alloc = (sku: string, warehouse: string, qty: number): AllocationLine[] => [
  { sku, warehouse, qty },
];

export const INITIAL_ORDERS: OrderSeed[] = [
  { id: "ORD-2026-08851", shop: "楽天市場", customer: "山田 太郎", items: 3, amount: 32_400, payment: "クレジットカード", status: "新規受付", date: "2026/04/30 10:42", allocation: alloc("WEP-001-BK", "東京本社倉庫", 3) },
  { id: "ORD-2026-08850", shop: "Amazon", customer: "佐藤 花子", items: 1, amount: 8_900, payment: "クレジットカード", status: "印刷待ち", date: "2026/04/30 10:35", allocation: alloc("MBT-004", "東京本社倉庫", 1) },
  { id: "ORD-2026-08849", shop: "Shopify", customer: "田中 一郎", items: 5, amount: 154_000, payment: "請求書払い", status: "確認待ち", date: "2026/04/30 10:22", allocation: alloc("PFS-005", "東京本社倉庫", 5) },
  { id: "ORD-2026-08848", shop: "Yahoo!", customer: "鈴木 美咲", items: 2, amount: 5_600, payment: "銀行振込", status: "出荷済み", date: "2026/04/30 09:58", allocation: alloc("TS-WH-M", "九州物流センター", 2) },
  { id: "ORD-2026-08847", shop: "楽天市場", customer: "高橋 健", items: 1, amount: 22_800, payment: "代金引換", status: "印刷済み", date: "2026/04/30 09:41", allocation: alloc("CHG-007", "東京本社倉庫", 1) },
  { id: "ORD-2026-08846", shop: "Amazon", customer: "渡辺 京子", items: 4, amount: 45_200, payment: "クレジットカード", status: "新規受付", date: "2026/04/30 09:30", allocation: alloc("WEP-001-WH", "東京本社倉庫", 4) },
  { id: "ORD-2026-08845", shop: "Shopify", customer: "伊藤 大輔", items: 2, amount: 18_600, payment: "クレジットカード", status: "引当待ち", date: "2026/04/30 09:15", allocation: alloc("UCB-002", "大阪倉庫", 2) },
  { id: "ORD-2026-08844", shop: "Yahoo!", customer: "中村 あかり", items: 1, amount: 3_200, payment: "銀行振込", status: "出荷済み", date: "2026/04/29 18:55", allocation: alloc("JK-NV-L", "大阪倉庫", 1) },
  { id: "ORD-2026-08843", shop: "楽天市場", customer: "小林 修", items: 3, amount: 67_500, payment: "クレジットカード", status: "入金待ち", date: "2026/04/29 16:40", allocation: alloc("WEP-001-BK", "東京本社倉庫", 3) },
  { id: "ORD-2026-08842", shop: "Amazon", customer: "加藤 裕子", items: 2, amount: 12_400, payment: "代金引換", status: "キャンセル", date: "2026/04/29 14:22", allocation: alloc("MBT-004", "東京本社倉庫", 2) },
  { id: "ORD-2026-08841", shop: "楽天市場", customer: "吉田 あゆみ", items: 4, amount: 56_800, payment: "クレジットカード", status: "発売日時待ち", date: "2026/04/29 11:10", allocation: alloc("PFS-005", "東京本社倉庫", 4) },
  { id: "ORD-2026-08840", shop: "Yahoo!", customer: "松本 愛", items: 2, amount: 15_800, payment: "クレジットカード", status: "印刷待ち", date: "2026/04/28 15:00", allocation: alloc("UCB-002", "大阪倉庫", 2) },
];
