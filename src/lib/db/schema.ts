/**
 * Drizzle schema（v2: 全ドメイン共通の snapshot/restore）。
 *
 * 仕様: docs/prd/order-state-machine.md / project_stores_horizontal_v1 / project_persistence_e2e_v1
 *
 * v1 は orders 専用の `order_snapshots` テーブルだったが、payment / shipment /
 * inventory / product / purchase / return / sales も同じ「store 全体を JSONB で
 * snapshot / restore する」形のため、ドメインを列で持つ単一テーブルに統一した。
 *
 * - (workspace, domain) の複合主キーで 1 ストア = 1 行
 * - workspace はマルチテナント拡張用（v2 は "default" 固定。本番 DB 接続前に
 *   server action 認証 + セッション由来の workspace 化が必須 — 下記 actions の注記参照）
 * - domain は SnapshotDomain（"orders" | "inventory" | ...）と一致させる
 */

import { pgTable, text, jsonb, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const storeSnapshotsTable = pgTable(
  "store_snapshots",
  {
    /** マルチテナント拡張用キー。v2 は "default" 固定。 */
    workspace: text("workspace").notNull(),
    /** ストア種別。SnapshotDomain と一致（"orders" | "inventory" | ...）。 */
    domain: text("domain").notNull(),
    /** store.getState() の JSON 全体（各ドメインの Record[] 相当）。 */
    data: jsonb("data").notNull(),
    /** 監査用最終更新時刻。 */
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.workspace, table.domain] })],
);

export type StoreSnapshotRow = typeof storeSnapshotsTable.$inferSelect;
export type StoreSnapshotInsert = typeof storeSnapshotsTable.$inferInsert;
