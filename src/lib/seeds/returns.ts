/**
 * returnStore の初期シード値。
 *
 * 顧客返品（RMA）画面 returns/page から import される。
 * lines の sku / warehouse は INITIAL_INVENTORY と一致させること
 * （返品完了 → 在庫戻し cascade が実 record に着地するため必須）。
 * orderId は INITIAL_ORDERS と一致させると返金 cascade も突合できる。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import type { ReturnRecord } from "@/lib/stores/return";

export type SeededReturn = ReturnRecord & {
  customer: string;
  reason: string;
  requestedAt: string;
};

export const INITIAL_RETURNS: SeededReturn[] = [
  {
    id: "RMA-2026-00001",
    status: "返品依頼",
    orderId: "ORD-2026-0312",
    lines: [{ sku: "WEP-001-BK", warehouse: "東京本社倉庫", qty: 1, restockQty: 0 }],
    refundAmount: 8800,
    refundStatus: "未起票",
    customer: "田中 美咲",
    reason: "イメージ違い（未開封）",
    requestedAt: "2026-05-22",
  },
  {
    id: "RMA-2026-00002",
    status: "返品承認",
    orderId: "ORD-2026-0298",
    lines: [{ sku: "CHG-007", warehouse: "東京本社倉庫", qty: 2, restockQty: 0 }],
    refundAmount: 3600,
    refundStatus: "未起票",
    customer: "株式会社サンプル商事",
    reason: "数量間違い（過剰注文）",
    requestedAt: "2026-05-23",
  },
  {
    id: "RMA-2026-00003",
    status: "検品中",
    orderId: "ORD-2026-0276",
    lines: [
      { sku: "TS-WH-M", warehouse: "九州物流センター", qty: 1, restockQty: 0 },
      { sku: "UCB-002", warehouse: "大阪倉庫", qty: 1, restockQty: 0 },
    ],
    refundAmount: 5400,
    refundStatus: "未起票",
    customer: "佐藤 健一",
    reason: "初期不良の疑い（1点）",
    requestedAt: "2026-05-24",
  },
  {
    id: "RMA-2026-00004",
    status: "返品完了",
    orderId: "ORD-2026-0240",
    lines: [{ sku: "JK-NV-L", warehouse: "大阪倉庫", qty: 1, restockQty: 1 }],
    refundAmount: 12000,
    refundStatus: "起票済",
    customer: "鈴木 由香",
    reason: "サイズ不適合（タグ付き）",
    requestedAt: "2026-05-18",
  },
  {
    id: "RMA-2026-00005",
    status: "却下",
    orderId: "ORD-2026-0205",
    lines: [{ sku: "MBT-004", warehouse: "東京本社倉庫", qty: 1, restockQty: 0 }],
    refundAmount: 0,
    refundStatus: "未起票",
    customer: "高橋 翔",
    reason: "使用済み・返品期限超過",
    requestedAt: "2026-05-12",
  },
];
