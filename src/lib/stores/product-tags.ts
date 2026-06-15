/**
 * 商品分類タグ 共有マスタストア
 *
 * 商品に付けるタグの CRUD を画面横断で共有する。
 * 永続化（domain: "product-tags"）の正規オーナーページは
 * src/app/products/tags/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface ProductTag {
  id: string;
  name: string;
  color: string;
  [extra: string]: unknown;
}

export const INITIAL_PRODUCT_TAGS: ProductTag[] = [
  { id: "PTAG-1", name: "新商品", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20" },
  { id: "PTAG-2", name: "セール", color: "bg-red-500/15 text-red-700 border-red-500/20" },
  { id: "PTAG-3", name: "売れ筋", color: "bg-blue-500/15 text-blue-700 border-blue-500/20" },
  { id: "PTAG-4", name: "在庫限り", color: "bg-orange-500/15 text-orange-700 border-orange-500/20" },
  { id: "PTAG-5", name: "予約受付", color: "bg-purple-500/15 text-purple-700 border-purple-500/20" },
  { id: "PTAG-6", name: "廃番予定", color: "bg-yellow-500/15 text-yellow-700 border-yellow-500/20" },
];

/** クライアントセッション内で共有される単一の ProductTagsStore インスタンス */
export const productTagsStore: MasterStore<ProductTag> =
  createMasterStore<ProductTag>(INITIAL_PRODUCT_TAGS);
