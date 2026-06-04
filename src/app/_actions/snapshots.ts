"use server";

/**
 * 全ストア共通の snapshot / restore server action。
 *
 * 設計:
 *  - (workspace='default', domain) の 1 行に JSON で store 全体を保存
 *  - snapshotDomain は upsert（同じ複合キーで常に上書き）
 *  - restoreDomain は SELECT 1 行で全件返す
 *  - DATABASE_URL 未設定時は no-db / null を返し、UI 側で in-memory seed にフォールバック
 *
 * 各ドメイン（orders / inventory / payments / ...）は同じ「store を丸ごと
 * snapshot / restore する」形なので、ドメインを引数で受ける汎用 action に集約した。
 *
 * ⚠ セキュリティ（fail-closed / secure by default）:
 *   snapshot/restore は "use server" により未認証で公開される。認証ライブラリが
 *   未導入の現状で本番 DB に全業務データが素通しになる事故を防ぐため、実 DB に
 *   読み書きするには env での明示的オプトインを必須にしている（evaluatePersistenceGuard）:
 *     - DATABASE_URL 未設定 → no-db（in-memory フォールバック。dev/e2e の既定）
 *     - DATABASE_URL 設定済み + OMS_PERSIST_ALLOW_UNAUTHENTICATED!=="1" → forbidden（拒否）
 *     - DATABASE_URL 設定済み + OMS_PERSIST_ALLOW_UNAUTHENTICATED==="1" → 許可
 *   フラグは「アプリ全体が既にログイン/ゲートウェイ背後にあり、かつシングルテナント」の
 *   場合にのみ立てること。公開・マルチテナント運用前には per-user 認証と
 *   セッション由来 workspace（resolveWorkspace 差し替え）が別途必須。
 *   参照: reference_security_audit_v1
 */

import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { storeSnapshotsTable } from "@/lib/db/schema";
import {
  isValidSnapshotRows,
  evaluatePersistenceGuard,
  resolveWorkspace,
  type SnapshotDomain,
  type SnapshotResult,
} from "@/lib/persistence/snapshot-domain";

/** env から永続化コンテキスト（可否判定・テナントキー）を解決する。 */
function persistenceContext() {
  const db = getDb();
  const decision = evaluatePersistenceGuard({
    hasDb: db !== null,
    allowUnauthenticated: process.env.OMS_PERSIST_ALLOW_UNAUTHENTICATED === "1",
  });
  return {
    db,
    decision,
    workspace: resolveWorkspace(process.env.OMS_WORKSPACE),
  };
}

/**
 * 指定ドメインの store 全件を JSON として upsert する。
 * DB 未接続時は no-db、未認証許可なしなら forbidden を返す（いずれも UI は in-memory のまま）。
 */
export async function snapshotDomain(
  domain: SnapshotDomain,
  rows: ReadonlyArray<unknown>,
): Promise<SnapshotResult> {
  const { db, decision, workspace } = persistenceContext();
  if (!decision.allowed) return { ok: false, reason: decision.reason, count: 0 };
  // decision.allowed は hasDb を含意するが、型を絞るため明示チェックする。
  if (db === null) return { ok: false, reason: "no-db", count: 0 };
  if (!isValidSnapshotRows(rows)) return { ok: false, reason: "invalid", count: 0 };

  try {
    await db
      .insert(storeSnapshotsTable)
      .values({ workspace, domain, data: rows })
      .onConflictDoUpdate({
        target: [storeSnapshotsTable.workspace, storeSnapshotsTable.domain],
        set: {
          data: rows,
          updatedAt: sql`now()`,
        },
      });
    return { ok: true, count: rows.length };
  } catch {
    return { ok: false, reason: "error", count: 0 };
  }
}

/**
 * 指定ドメインの保存済みデータを取り出す。
 * DB 未接続 / 未認証許可なし / 未保存時は null（UI 側は null フォールバックで seed を使う）。
 *
 * 戻り値は呼び出し側が各ドメインの Record[] にキャストする（保存時の形をそのまま返す）。
 */
export async function restoreDomain<T = unknown>(
  domain: SnapshotDomain,
): Promise<T[] | null> {
  const { db, decision, workspace } = persistenceContext();
  if (!decision.allowed || db === null) return null;

  try {
    const rows = await db
      .select()
      .from(storeSnapshotsTable)
      .where(
        sql`${storeSnapshotsTable.workspace} = ${workspace} and ${storeSnapshotsTable.domain} = ${domain}`,
      );
    if (rows.length === 0) return null;
    return rows[0].data as T[];
  } catch {
    return null;
  }
}
