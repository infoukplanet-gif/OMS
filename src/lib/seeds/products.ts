/**
 * productStore の初期シード。
 *
 * /products 系画面（商品一覧・商品登録）と OrderForm の商品サジェストが
 * 同じ商品マスタを共有するための初期データ。
 * どちらが先にマウントされても同じ商品群を共有するよう、ページローカルではなくここに集約する。
 *
 * code は INITIAL_INVENTORY の sku 接頭部と一致させること（在庫サジェストとの突合のため）。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import type { ProductRecord } from "@/lib/stores/product";

/** 商品一覧ページ用の表示拡張フィールド。 */
export type SeededProduct = ProductRecord & {
  id: string;
  skus: number;
  stock: number;
  safety: number;
  updated: string;
  /** 取込元モールの外部カテゴリ表記（カテゴリ変換ルールで再計算される）。 */
  externalCategory?: string;
  /** 取込元（楽天/Amazon/Yahoo!/自社EC/FAX手入力 等）。 */
  fromSource?: string;
};

export const INITIAL_PRODUCTS: SeededProduct[] = [
  { id: "P001", code: "WEP-001", name: "ワイヤレスイヤホン Pro", category: "家電", skus: 3, price: 12_800, cost: 4_500, stock: 45, safety: 10, status: "販売中", updated: "2026/04/28" },
  { id: "P002", code: "UCB-002", name: "USB-Cケーブル 2m", category: "家電", skus: 1, price: 1_280, cost: 320, stock: 8, safety: 15, status: "販売中", updated: "2026/04/27" },
  { id: "P003", code: "SWB-003", name: "スマートウォッチバンド", category: "雑貨", skus: 5, price: 3_980, cost: 1_200, stock: 5, safety: 10, status: "販売中", updated: "2026/04/27" },
  { id: "P004", code: "MBT-004", name: "モバイルバッテリー 20000mAh", category: "家電", skus: 2, price: 4_980, cost: 1_800, stock: 2, safety: 8, status: "販売中", updated: "2026/04/26" },
  { id: "P005", code: "PFS-005", name: "保護フィルム セット", category: "雑貨", skus: 4, price: 1_580, cost: 380, stock: 120, safety: 20, status: "販売中", updated: "2026/04/26" },
  { id: "P006", code: "TWS-006", name: "完全ワイヤレスイヤホン", category: "家電", skus: 2, price: 8_900, cost: 3_200, stock: 0, safety: 5, status: "販売中", updated: "2026/04/25" },
  { id: "P007", code: "CHG-007", name: "急速充電器 65W", category: "家電", skus: 1, price: 3_480, cost: 1_100, stock: 67, safety: 15, status: "販売中", updated: "2026/04/25" },
  { id: "P008", code: "OLD-008", name: "旧モデルケーブル 1m", category: "家電", skus: 1, price: 680, cost: 200, stock: 234, safety: 30, status: "廃番", updated: "2026/03/15" },
  { id: "P009", code: "TEE-009", name: "コットンTシャツ", category: "アパレル", skus: 6, price: 2_980, cost: 980, stock: 350, safety: 50, status: "販売中", updated: "2026/04/20", externalCategory: "レディース > トップス > Tシャツ", fromSource: "楽天" },
  { id: "P010", code: "STP-010", name: "停止中スマホスタンド", category: "雑貨", skus: 1, price: 1_980, cost: 600, stock: 18, safety: 5, status: "停止中", updated: "2026/04/01", externalCategory: "Beauty > Skincare", fromSource: "Amazon" },
];
