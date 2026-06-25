/**
 * snapshot/restore の共有型と入力バリデーション。
 *
 * server action（"use server"）からも client hook からもテストからも import する。
 * このモジュール自体は "use server" を付けない（純粋ロジックのみ）ので、
 * client / test バンドルに安全に取り込める。
 */

/**
 * 永続化対象のストア種別。schema の `store_snapshots.domain` 列と一致させる。
 * 新しいストアを永続化する時はここに足す（型で網羅性を担保）。
 */
export type SnapshotDomain =
  | "orders"
  | "inventory"
  | "payments"
  | "shipments"
  | "products"
  | "purchases"
  | "returns"
  | "sales"
  | "defective"
  | "document-templates"
  | "instruction-templates"
  | "delivery-note-templates"
  | "mails"
  | "blacklist"
  | "customer-ranks"
  | "order-confirm-rules"
  | "order-numbering"
  | "bulk-import-limit"
  | "channel-allocation"
  | "delivery-periods"
  | "allocation-patterns"
  | "import-patterns"
  | "order-tags"
  | "product-tags"
  | "cancel-reasons"
  | "payment-methods"
  | "shipping-methods"
  | "code-mapping"
  | "product-categories"
  | "category-mapping"
  | "defaults-settings"
  | "date-auto-settings"
  | "payment-message-settings"
  | "settings-templates"
  | "company-settings"
  | "ai-settings"
  | "from-addresses"
  | "mail-signatures"
  | "order-fetch-settings"
  | "order-fetch-channels"
  | "bulk-complete-orders"
  | "payment-fees"
  | "shipment-availability"
  | "field-conversion-settings"
  | "category-conversion-settings"
  | "payment-shipping-conversion-settings"
  | "api-global-settings"
  | "api-keys"
  | "api-connections"
  | "excluded-areas"
  | "order-rules-settings"
  | "permission-groups"
  | "warehouses"
  | "misc-settings"
  | "auto-mail-settings"
  | "automation-jobs"
  | "product-auto-create-settings"
  | "customer-auto-create-settings"
  | "mail-auto-template-settings"
  | "mail-free-template-settings"
  | "mail-schedule-settings"
  | "mail-server-settings"
  | "mail-retry-settings"
  | "mail-templates"
  | "order-notes-conversion-settings"
  | "payment-np-connect-settings"
  | "payment-np-rows"
  | "payment-atone-rows"
  | "product-warehouse-link-settings"
  | "shipment-defective-transfer-settings"
  | "shipment-defective-lots"
  | "shipment-tracking-support-settings"
  | "warehouse-logizard-settings"
  | "warehouse-yahoo-logi-settings"
  | "warehouse-rsl-inbound-settings"
  | "warehouse-rsl-return-settings"
  | "warehouse-rsl-setup-settings";

/** 1 スナップショットに保存できる最大行数（DoS・暴走入力対策）。 */
export const MAX_SNAPSHOT_ROWS = 50_000;

/**
 * snapshot/restore の失敗理由。
 * - no-db: DATABASE_URL 未設定（in-memory フォールバック）
 * - forbidden: 実 DB 接続済みだが未認証での永続化が明示許可されていない（secure by default）
 * - invalid: 入力が plain object の配列でない / 件数超過
 * - error: DB 例外
 */
export type SnapshotReason = "no-db" | "forbidden" | "invalid" | "error";

export interface SnapshotResult {
  ok: boolean;
  /** 失敗理由。成功時は undefined。 */
  reason?: SnapshotReason;
  /** 保存できた件数（失敗時は 0）。 */
  count: number;
}

/** テナント分離キー未指定時の既定 workspace。 */
export const DEFAULT_WORKSPACE = "default";

/**
 * 永続化に使う workspace（テナントキー）を解決する。
 *
 * v2 はシングルテナント運用を前提に env `OMS_WORKSPACE` で固定値を与える。
 * 将来マルチテナント化する際は、ここをセッション由来の値に差し替える単一接続点とする
 * （ページ/アクション側で workspace を直書きしない）。
 *
 * @param raw process.env.OMS_WORKSPACE の生値（未設定なら undefined）
 */
export function resolveWorkspace(raw: string | undefined): string {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : DEFAULT_WORKSPACE;
}

/** 永続化可否の判定入力。env 由来の状態を純粋関数に渡してテスト可能にする。 */
export interface PersistenceGuardInput {
  /** 実 DB に接続されているか（DATABASE_URL 設定済みで getDb()!==null）。 */
  hasDb: boolean;
  /**
   * 未認証での永続化を運用者が明示的に許可したか
   * （env `OMS_PERSIST_ALLOW_UNAUTHENTICATED==="1"`）。
   * アプリ全体が既にログイン/ゲートウェイ背後にあり、かつシングルテナントである場合にのみ true。
   */
  allowUnauthenticated: boolean;
}

export type PersistenceDecision =
  | { allowed: true }
  | { allowed: false; reason: "no-db" | "forbidden" };

/**
 * snapshot/restore を実行してよいか判定する（fail-closed / secure by default）。
 *
 * - DB 未接続 → 常に拒否（reason "no-db"。UI は in-memory seed にフォールバック）
 * - DB 接続済みだが未認証許可フラグ無し → 拒否（reason "forbidden"）。
 *   DATABASE_URL を設定しただけで、全業務データが未認証の server action 経由で
 *   読み書き可能になる事故を防ぐ。運用者の明示的なオプトインを必須にする。
 * - DB 接続済み + 明示許可 → 許可。
 *
 * ⚠ これは「認証基盤が未導入の現状での最小の安全弁」であり、本来の per-user 認証の代替ではない。
 *   公開・マルチテナント運用前には別途ログイン認証とセッション由来 workspace が必須。
 *   参照: reference_security_audit_v1
 */
export function evaluatePersistenceGuard(
  input: PersistenceGuardInput,
): PersistenceDecision {
  if (!input.hasDb) return { allowed: false, reason: "no-db" };
  if (!input.allowUnauthenticated) return { allowed: false, reason: "forbidden" };
  return { allowed: true };
}

/**
 * 保存前の最小バリデーション。
 * 「配列であること・件数上限内・各要素が plain な非 null オブジェクト（配列でない）」を
 * 検証し、任意 JSON や巨大ペイロードの保存を防ぐ。
 *
 * 識別キーは各ドメインでまちまち（orders/inventory は `id`、sales は `shipmentId` 等）なので
 * 特定キーの存在は要求しない。各ドメイン固有の項目検証もしない（ストア側で型を保証している）。
 * ここは「レコードの配列であること・サイズ上限」だけを担保する境界ガードに徹する。
 */
export function isValidSnapshotRows(
  rows: unknown,
): rows is ReadonlyArray<Record<string, unknown>> {
  if (!Array.isArray(rows)) return false;
  if (rows.length > MAX_SNAPSHOT_ROWS) return false;
  return rows.every(
    (r) => typeof r === "object" && r !== null && !Array.isArray(r),
  );
}
