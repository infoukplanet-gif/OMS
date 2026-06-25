/**
 * 後払い決済（NP後払い / atone）の与信ライフサイクル状態機械。
 *
 * NP・atone は外部決済プロバイダだが、与信→請求→支払（または与信NG切替 /
 * 回収不能の貸倒）という同一の状態遷移を持つため、1つの状態機械を共有する。
 * NP は 回収不能/貸倒処理済 の状態に到達しないだけで、状態集合は上位互換。
 *
 * 操作（プロバイダ起点の確定・社内対応）:
 * - approve      : 与信中 → 与信OK（プロバイダ同期で与信確定）
 * - switchPayment: 与信NG → 切替済（受注側の支払方法変更が別途必要）
 * - writeOff     : 回収不能 → 貸倒処理済（保証適用・社内損益反映、atone のみ）
 *
 * 請求中の取引への「催促」は status 遷移ではなく reminded フラグ更新なので、
 * 状態機械を経由せずストアの upsert で行う（ここには含めない）。
 *
 * ページ側で `{ ...row, status }` のように status を直書きしない。必ず
 * transitionDeferredPayment(row, action) を経由して遷移後レコードを得る。
 */

export type DeferredPaymentStatus =
  | "与信OK"
  | "与信NG"
  | "与信中"
  | "請求中"
  | "支払済"
  | "回収不能"
  | "切替済"
  | "貸倒処理済";

export type DeferredPaymentAction = "approve" | "switchPayment" | "writeOff";

export interface DeferredPaymentRecord {
  id: string;
  /** 受注番号 */
  order: string;
  customer: string;
  amount: number;
  status: DeferredPaymentStatus;
  registeredAt: string;
  /** 登録からの経過日数 */
  daysAged: number;
  /** 請求中の取引に再請求の催促を送信済みか */
  reminded?: boolean;
  /** createMasterStore（MasterRecord）互換のためのインデックスシグネチャ。 */
  [extra: string]: unknown;
}

const TRANSITIONS: Record<
  DeferredPaymentStatus,
  Partial<Record<DeferredPaymentAction, DeferredPaymentStatus>>
> = {
  与信中: { approve: "与信OK" },
  与信NG: { switchPayment: "切替済" },
  回収不能: { writeOff: "貸倒処理済" },
  与信OK: {},
  請求中: {},
  支払済: {},
  切替済: {},
  貸倒処理済: {},
};

export function nextDeferredPaymentStatus(
  status: DeferredPaymentStatus,
  action: DeferredPaymentAction,
): DeferredPaymentStatus | null {
  return TRANSITIONS[status][action] ?? null;
}

export function canTransitionDeferredPayment(
  status: DeferredPaymentStatus,
  action: DeferredPaymentAction,
): boolean {
  return nextDeferredPaymentStatus(status, action) !== null;
}

/**
 * 遷移を適用した新レコードを返す。
 * 不正遷移（ガード不成立）の場合は同一参照をそのまま返す（no-op）。
 */
export function transitionDeferredPayment(
  record: DeferredPaymentRecord,
  action: DeferredPaymentAction,
): DeferredPaymentRecord {
  const target = nextDeferredPaymentStatus(record.status, action);
  if (target === null) return record;
  return { ...record, status: target };
}
