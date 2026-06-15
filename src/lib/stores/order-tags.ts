/**
 * 受注分類タグ 共有マスタストア
 *
 * 受注に付けるタグの CRUD を画面横断で共有する。
 * 永続化（domain: "order-tags"）の正規オーナーページは
 * src/app/orders/tags/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface OrderTag {
  id: string;
  name: string;
  color: string;
  [extra: string]: unknown;
}

export const INITIAL_ORDER_TAGS: OrderTag[] = [
  { id: "TAG-1", name: "優先対応", color: "bg-red-500/15 text-red-700 border-red-500/20" },
  { id: "TAG-2", name: "ギフト", color: "bg-purple-500/15 text-purple-700 border-purple-500/20" },
  { id: "TAG-3", name: "同梱不可", color: "bg-orange-500/15 text-orange-700 border-orange-500/20" },
  { id: "TAG-4", name: "リピーター", color: "bg-blue-500/15 text-blue-700 border-blue-500/20" },
  { id: "TAG-5", name: "法人", color: "bg-teal-500/15 text-teal-700 border-teal-500/20" },
  { id: "TAG-6", name: "要確認", color: "bg-yellow-500/15 text-yellow-700 border-yellow-500/20" },
];

/** クライアントセッション内で共有される単一の OrderTagsStore インスタンス */
export const orderTagsStore: MasterStore<OrderTag> =
  createMasterStore<OrderTag>(INITIAL_ORDER_TAGS);
