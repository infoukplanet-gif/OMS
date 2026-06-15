/**
 * 店舗内カテゴリ 共有マスタストア
 *
 * 店舗内カテゴリツリーの CRUD を画面横断で共有する。
 * 永続化（domain: "product-categories"）の正規オーナーページは
 * src/app/products/categories/page.tsx
 *
 * 注意: 元ページの Category 型は id/parentId が number だが、
 * createMasterStore は id: string を要求する。ストア境界で文字列 id に
 * 変換して保持し、ツリー構築・親子比較は文字列 id 同士で行う。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface CategoryRecord {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  displayOrder: number;
  productCount: number;
  enabled: boolean;
  [extra: string]: unknown;
}

export const INITIAL_CATEGORIES: CategoryRecord[] = [
  { id: "1", parentId: null, name: "ファッション", slug: "fashion", displayOrder: 1, productCount: 384, enabled: true },
  { id: "2", parentId: "1", name: "レディース", slug: "ladies", displayOrder: 1, productCount: 220, enabled: true },
  { id: "3", parentId: "2", name: "トップス", slug: "tops", displayOrder: 1, productCount: 95, enabled: true },
  { id: "4", parentId: "2", name: "ボトムス", slug: "bottoms", displayOrder: 2, productCount: 76, enabled: true },
  { id: "5", parentId: "2", name: "ワンピース", slug: "onepiece", displayOrder: 3, productCount: 49, enabled: true },
  { id: "6", parentId: "1", name: "メンズ", slug: "mens", displayOrder: 2, productCount: 164, enabled: true },
  { id: "7", parentId: "6", name: "トップス", slug: "mens-tops", displayOrder: 1, productCount: 84, enabled: true },
  { id: "8", parentId: "6", name: "ボトムス", slug: "mens-bottoms", displayOrder: 2, productCount: 80, enabled: true },
  { id: "9", parentId: null, name: "雑貨", slug: "goods", displayOrder: 2, productCount: 132, enabled: true },
  { id: "10", parentId: "9", name: "アクセサリー", slug: "accessories", displayOrder: 1, productCount: 78, enabled: true },
  { id: "11", parentId: "9", name: "バッグ", slug: "bags", displayOrder: 2, productCount: 54, enabled: false },
  { id: "12", parentId: null, name: "セール", slug: "sale", displayOrder: 3, productCount: 42, enabled: true },
];

/** クライアントセッション内で共有される単一の ProductCategoryStore インスタンス */
export const productCategoryStore: MasterStore<CategoryRecord> =
  createMasterStore<CategoryRecord>(INITIAL_CATEGORIES);
