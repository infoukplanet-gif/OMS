/**
 * Drizzle schema（v1: orderStore snapshot/restore のみ）。
 *
 * 仕様: docs/prd/order-state-machine.md / project_stores_horizontal_v1
 *
 * v1 では orderStore 全体を単一 JSONB として保存する key-value 方式を採用する。
 * シナリオが「snapshot / restore」だけのため、行単位の細かい更新は不要。
 * workspace カラムで複数テナント拡張に備えるが、v1 では 'default' 固定。
 *
 * v2 で payment / shipment / inventory / purchase のスナップショットも追加する想定。
 */

import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const orderSnapshotsTable = pgTable("order_snapshots", {
  /** マルチテナント拡張用キー。v1 は "default" 固定。 */
  workspace: text("workspace").primaryKey(),
  /** orderStore.getState() の JSON 全体（OrderSeed[] 相当） */
  data: jsonb("data").notNull(),
  /** 監査用最終更新時刻 */
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type OrderSnapshotRow = typeof orderSnapshotsTable.$inferSelect;
export type OrderSnapshotInsert = typeof orderSnapshotsTable.$inferInsert;
