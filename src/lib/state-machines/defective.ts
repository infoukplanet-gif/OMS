/**
 * 不良品振替の状態機械。
 *
 * 仕様: docs/prd/defective-stocktake-cascade-v1.md
 *
 * 4状態: 承認待ち → 振替待ち → 振替完了 ／ 承認待ち → 却下。
 * - approve: 承認待ち → 振替待ち（在庫は触らない）
 * - reject : 承認待ち → 却下
 * - execute: 振替待ち → 振替完了（この時に良品 onHand を実減算する＝cascade 側の責務）
 *
 * 棚卸減耗（source: "stocktake"）は既に物理的に失われた在庫の監査記録なので、
 * 生成時点で status "振替完了" として積まれ、ここでの遷移対象にはならない。
 */

export type DefectiveStatus = "承認待ち" | "振替待ち" | "振替完了" | "却下";
export type DefectiveAction = "approve" | "reject" | "execute";
export type DefectiveSource = "manual" | "stocktake";

export interface DefectiveRecord {
  id: string;
  /** 関連受注番号（無ければ "—"） */
  order: string;
  product: string;
  sku: string;
  /** 振替元倉庫。良品 onHand を減算する在庫キーになる。 */
  warehouse: string;
  qty: number;
  reason: string;
  /** 振替先（返品倉庫 / メーカー返却 / アウトレット在庫 / 廃棄） */
  route: string;
  source: DefectiveSource;
  registeredAt: string;
  registeredBy: string;
  status: DefectiveStatus;
}

const TRANSITIONS: Record<
  DefectiveStatus,
  Partial<Record<DefectiveAction, DefectiveStatus>>
> = {
  承認待ち: { approve: "振替待ち", reject: "却下" },
  振替待ち: { execute: "振替完了" },
  振替完了: {},
  却下: {},
};

export function nextStatus(
  status: DefectiveStatus,
  action: DefectiveAction,
): DefectiveStatus | null {
  return TRANSITIONS[status][action] ?? null;
}

export function canTransition(
  status: DefectiveStatus,
  action: DefectiveAction,
): boolean {
  return nextStatus(status, action) !== null;
}

/**
 * 遷移を適用した新レコードを返す。
 * 不正遷移（ガード不成立）の場合は同一参照をそのまま返す（no-op）。
 */
export function transitionDefective(
  record: DefectiveRecord,
  action: DefectiveAction,
): DefectiveRecord {
  const target = nextStatus(record.status, action);
  if (target === null) return record;
  return { ...record, status: target };
}
