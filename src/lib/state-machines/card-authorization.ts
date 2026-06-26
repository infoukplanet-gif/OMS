/**
 * 楽天カード決済のオーソリ→売上確定ライフサイクル状態機械。
 *
 * 楽天RMSのカードオーソリ済受注に対して、オーソリ期限（30日）内に
 * 売上確定（capture）を行う。期限を超過したものは expire でオーソリ期限切れに落ちる。
 * 「失敗」はプロバイダ起点で確定する終端状態（ここから先の遷移はない）。
 *
 * 操作:
 * - capture: 売上確定待ち → 売上確定済（売上確定処理）
 * - expire : 売上確定待ち → オーソリ期限切れ（期限超過）
 *
 * ページ側で `{ ...row, status }` のように status を直書きしない。必ず
 * transitionCardAuthorization(row, action) を経由して遷移後レコードを得る。
 */

export type CardAuthorizationStatus =
  | "売上確定待ち"
  | "売上確定済"
  | "オーソリ期限切れ"
  | "失敗";

export type CardAuthorizationAction = "capture" | "expire";

export interface CardAuthorizationRecord {
  id: string;
  /** 受注番号 */
  order: string;
  customer: string;
  amount: number;
  /** オーソリ日 */
  authAt: string;
  /** オーソリ期限 */
  authExpire: string;
  /** 期限までの残日数 */
  daysToExpire: number;
  status: CardAuthorizationStatus;
  /** createMasterStore（MasterRecord）互換のためのインデックスシグネチャ。 */
  [extra: string]: unknown;
}

const TRANSITIONS: Record<
  CardAuthorizationStatus,
  Partial<Record<CardAuthorizationAction, CardAuthorizationStatus>>
> = {
  売上確定待ち: { capture: "売上確定済", expire: "オーソリ期限切れ" },
  売上確定済: {},
  オーソリ期限切れ: {},
  失敗: {},
};

export function nextCardAuthorizationStatus(
  status: CardAuthorizationStatus,
  action: CardAuthorizationAction,
): CardAuthorizationStatus | null {
  return TRANSITIONS[status][action] ?? null;
}

export function canTransitionCardAuthorization(
  status: CardAuthorizationStatus,
  action: CardAuthorizationAction,
): boolean {
  return nextCardAuthorizationStatus(status, action) !== null;
}

/**
 * 遷移を適用した新レコードを返す。
 * 不正遷移（ガード不成立）の場合は同一参照をそのまま返す（no-op）。
 */
export function transitionCardAuthorization(
  record: CardAuthorizationRecord,
  action: CardAuthorizationAction,
): CardAuthorizationRecord {
  const target = nextCardAuthorizationStatus(record.status, action);
  if (target === null) return record;
  return { ...record, status: target };
}
