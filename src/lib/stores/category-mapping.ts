/**
 * カテゴリ変換設定 共有マスタストア
 *
 * 店舗内カテゴリ → 各モール側カテゴリへの変換マッピングを画面横断で共有する。
 * 永続化（domain: "category-mapping"）の正規オーナーページは
 * src/app/products/category-mapping/page.tsx
 *
 * 注意: ページ側の旧 Mapping 型は数値 id だったが、createMasterStore は
 * id: string を要求するため、ストア境界で String 化して保持する。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type Mall = "rakuten" | "yahoo" | "amazon" | "shopify";

export interface CategoryMappingRecord {
  id: string;
  internalCategory: string;
  mall: Mall;
  mallCategoryPath: string;
  mallCategoryId: string;
  active: boolean;
  [extra: string]: unknown;
}

export const INITIAL_CATEGORY_MAPPINGS: CategoryMappingRecord[] = [
  { id: "1", internalCategory: "ファッション / レディース / トップス", mall: "rakuten", mallCategoryPath: "レディースファッション > トップス > Tシャツ・カットソー", mallCategoryId: "100371", active: true },
  { id: "2", internalCategory: "ファッション / レディース / トップス", mall: "yahoo", mallCategoryPath: "ファッション > レディースファッション > トップス", mallCategoryId: "2497", active: true },
  { id: "3", internalCategory: "ファッション / レディース / トップス", mall: "amazon", mallCategoryPath: "Fashion > Women > Tops & Tees", mallCategoryId: "7141123051", active: true },
  { id: "4", internalCategory: "ファッション / レディース / ボトムス", mall: "rakuten", mallCategoryPath: "レディースファッション > パンツ", mallCategoryId: "100371A", active: true },
  { id: "5", internalCategory: "雑貨 / アクセサリー", mall: "shopify", mallCategoryPath: "Jewelry > Necklaces", mallCategoryId: "ap-neck", active: true },
  { id: "6", internalCategory: "雑貨 / バッグ", mall: "rakuten", mallCategoryPath: "レディースバッグ > ハンドバッグ", mallCategoryId: "216131", active: false },
];

/** クライアントセッション内で共有される単一の CategoryMappingStore インスタンス */
export const categoryMappingStore: MasterStore<CategoryMappingRecord> =
  createMasterStore<CategoryMappingRecord>(INITIAL_CATEGORY_MAPPINGS);
