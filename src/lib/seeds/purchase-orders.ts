/**
 * purchaseStore の初期シード値。
 *
 * purchasing/page（発注一覧）と purchasing/calculate/page（発注計算）の両方から import される。
 * どちらの画面が先にマウントされても同じ初期発注伝票が共有されるよう、
 * ページローカルではなくここに集約する（orders シードと同じ方針）。
 *
 * INITIAL_INVENTORY と同じ SKU を使うことで、入荷登録時の cascade が
 * inventoryStore.onHand に確実に反映される。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import type { PurchaseOrderLine } from "@/lib/state-machines/purchase";
import type { PurchaseOrderRecord } from "@/lib/stores/purchase";

/**
 * 発注一覧で使う発注書レコード。state-machine の (status, lines) に加えて
 * 一覧表示で使う非SM フィールド（仕入先・金額・予定日など）を持つ。
 */
export type SeededPurchaseOrder = PurchaseOrderRecord & {
  supplier: string;
  items: number;
  amount: number;
  date: string;
  expected: string;
  daysToArrive: number;
};

const line = (
  sku: string,
  warehouse: string,
  ordered: number,
  received = 0,
  expectedDate?: string,
): PurchaseOrderLine => ({
  sku,
  warehouse,
  orderedQty: ordered,
  receivedQty: received,
  ...(expectedDate ? { expectedDate } : {}),
});

export const INITIAL_PURCHASE_ORDERS: SeededPurchaseOrder[] = [
  {
    id: "PO-2026-0049",
    supplier: "フジタ資材株式会社",
    items: 3,
    amount: 67000,
    status: "条件未達成",
    lines: [line("UCB-002", "大阪倉庫", 20)],
    date: "2026-05-10",
    expected: "—",
    daysToArrive: 0,
  },
  {
    id: "PO-2026-0048",
    supplier: "東亜電機株式会社",
    items: 6,
    amount: 198000,
    status: "未発行",
    lines: [line("CHG-007", "東京本社倉庫", 30)],
    date: "2026-05-08",
    expected: "—",
    daysToArrive: 0,
  },
  {
    id: "PO-2026-0047",
    supplier: "株式会社ABC電子",
    items: 5,
    amount: 245000,
    status: "発行済",
    lines: [line("MBT-004", "東京本社倉庫", 30, 0, "2026/05/21")],
    date: "2026-04-25",
    expected: "2026-05-21",
    daysToArrive: 2,
  },
  {
    id: "PO-2026-0046",
    supplier: "グローバルパーツ合同会社",
    items: 3,
    amount: 128000,
    status: "注残あり",
    lines: [line("TWS-006-BK", "九州物流センター", 20, 6, "2026/05/19")],
    date: "2026-04-23",
    expected: "2026-05-22",
    daysToArrive: 3,
  },
  {
    id: "PO-2026-0045",
    supplier: "株式会社ケーブルワークス",
    items: 8,
    amount: 56000,
    status: "仕入完了",
    lines: [line("WEP-001-BK", "東京本社倉庫", 10, 10)],
    date: "2026-04-21",
    expected: "2026-04-25",
    daysToArrive: 0,
  },
  {
    id: "PO-2026-0044",
    supplier: "株式会社ABC電子",
    items: 2,
    amount: 89000,
    status: "仕入完了",
    lines: [line("JK-NV-L", "大阪倉庫", 25, 25)],
    date: "2026-04-19",
    expected: "2026-04-23",
    daysToArrive: 0,
  },
  {
    id: "PO-2026-0043",
    supplier: "アジアサプライ株式会社",
    items: 10,
    amount: 342000,
    status: "キャンセル",
    lines: [line("PFS-005", "東京本社倉庫", 100)],
    date: "2026-04-17",
    expected: "—",
    daysToArrive: 0,
  },
];
