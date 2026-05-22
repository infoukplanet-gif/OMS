"use server";

/**
 * orderStore の snapshot / restore を行う server action。
 *
 * 設計:
 *  - workspace='default' の 1 行に JSON で全 OrderSeed[] を保存
 *  - snapshotOrders は upsert（同じ workspace key で常に上書き）
 *  - restoreOrders は SELECT 1 行で全件返す
 *  - DATABASE_URL 未設定時は null を返し、UI 側で in-memory seed にフォールバック
 *
 * v1 のスコープは「snapshot / restore」のみ。行単位の細かい更新（楽観ロック等）は
 * v2 で各ドメインを切り出した時に実装する。
 */

import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orderSnapshotsTable } from "@/lib/db/schema";
import type { OrderSeed } from "@/lib/seeds/orders";

const WORKSPACE = "default";

/** 保存できる最大件数（DoS・暴走入力対策）。 */
const MAX_ORDERS = 50_000;

/**
 * 保存前の最小バリデーション。配列であること・件数上限・各要素が
 * id/status を持つオブジェクトであることを検証する（任意 JSON の保存を防ぐ）。
 *
 * 注意（要対応）: snapshot/restore は "use server" により未認証で公開される。
 * 本番 DB（DATABASE_URL）接続前に、必ず認証チェックと workspace のセッション由来化
 * （テナント分離）を追加すること。現状は DATABASE_URL 未設定の in-memory fallback 前提。
 */
function isValidOrders(orders: unknown): orders is ReadonlyArray<OrderSeed> {
  if (!Array.isArray(orders)) return false;
  if (orders.length > MAX_ORDERS) return false;
  return orders.every(
    (o) =>
      typeof o === "object" &&
      o !== null &&
      typeof (o as { id?: unknown }).id === "string" &&
      typeof (o as { status?: unknown }).status === "string",
  );
}

export interface SnapshotResult {
  ok: boolean;
  /** "no-db" | "error" | undefined（成功時） */
  reason?: "no-db" | "error";
  /** 保存できた件数（DB なし時は 0） */
  count: number;
}

/**
 * orderStore 全件を JSON として workspace 'default' に upsert する。
 * DB 未接続時は { ok: false, reason: 'no-db', count: 0 }。
 */
export async function snapshotOrders(orders: ReadonlyArray<OrderSeed>): Promise<SnapshotResult> {
  const db = getDb();
  if (db === null) return { ok: false, reason: "no-db", count: 0 };
  if (!isValidOrders(orders)) return { ok: false, reason: "error", count: 0 };

  try {
    await db
      .insert(orderSnapshotsTable)
      .values({ workspace: WORKSPACE, data: orders })
      .onConflictDoUpdate({
        target: orderSnapshotsTable.workspace,
        set: {
          data: orders,
          updatedAt: sql`now()`,
        },
      });
    return { ok: true, count: orders.length };
  } catch {
    return { ok: false, reason: "error", count: 0 };
  }
}

/**
 * workspace 'default' から保存済みの OrderSeed[] を取り出す。
 * DB 未接続 or 未保存時は null を返す。UI 側は null フォールバックで in-memory seed を使う。
 */
export async function restoreOrders(): Promise<OrderSeed[] | null> {
  const db = getDb();
  if (db === null) return null;

  try {
    const rows = await db
      .select()
      .from(orderSnapshotsTable)
      .where(sql`${orderSnapshotsTable.workspace} = ${WORKSPACE}`);
    if (rows.length === 0) return null;
    return rows[0].data as OrderSeed[];
  } catch {
    return null;
  }
}
