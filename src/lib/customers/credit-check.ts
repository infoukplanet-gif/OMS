/**
 * 卸先（B2B）受注登録時の与信限度チェック（pure function）。
 *
 * 仕様: docs/prd/credit-limit-check-v1.md
 *
 * 受注登録フォームが、卸先の与信限度・取引ステータス・現在の与信使用額（未回収残）と
 * 今回の受注額を渡し、保存を「ブロック / 警告 / 許可」のどれにするか判定する。
 *
 * 判定（上から順に評価・最初に一致したものを採用）:
 *   1. 取引ステータスが「停止」          → block（取引不可）
 *   2. 与信限度 <= 0                     → block（与信を与えていない取引先）
 *   3. 未回収残 + 今回受注額 > 与信限度    → warn（警告して続行可）
 *   4. それ以外                          → ok
 *
 * Date も store singleton も触らない。フォームが数値を集めて渡す（src/lib は Date-free 維持）。
 */

export type CreditCheckStatus = "ok" | "warn" | "block";

/** 取引停止を表す卸先ステータス。 */
const STATUS_SUSPENDED = "停止";

export interface CreditCheckInput {
  /** 卸先の与信限度。 */
  creditLimit: number;
  /** 取引ステータス（"通常" | "重点" | "新規" | "停止" 等）。 */
  customerStatus: string;
  /** 既存の与信使用額（未回収残）。 */
  currentOutstanding: number;
  /** 今回登録する受注額。 */
  newOrderAmount: number;
}

export interface CreditCheckResult {
  status: CreditCheckStatus;
  /** 今回受注後の与信使用見込み（currentOutstanding + newOrderAmount）。 */
  projectedUsage: number;
  /** 今回前の残り与信枠（max(0, creditLimit - currentOutstanding)）。 */
  available: number;
  /** 限度超過額（max(0, projectedUsage - creditLimit)）。 */
  overBy: number;
  /** UI（ダイアログ / toast）に出す日本語の理由。 */
  reason: string;
}

function formatYen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

/**
 * 卸先受注の与信判定を行う。
 *
 * 適用範囲: customerCode が卸先マスタに実在する受注のみ呼ぶ。
 * B2C 個人受注（卸先に紐付かない）は呼び出し側でスキップする。
 */
export function checkCredit(input: CreditCheckInput): CreditCheckResult {
  const { creditLimit, customerStatus, currentOutstanding, newOrderAmount } = input;

  const projectedUsage = currentOutstanding + newOrderAmount;
  const available = Math.max(0, creditLimit - currentOutstanding);
  const overBy = Math.max(0, projectedUsage - creditLimit);

  if (customerStatus === STATUS_SUSPENDED) {
    return {
      status: "block",
      projectedUsage,
      available,
      overBy,
      reason: "取引停止中の卸先です。受注を登録できません。",
    };
  }

  if (creditLimit <= 0) {
    return {
      status: "block",
      projectedUsage,
      available,
      overBy,
      reason: "与信限度が設定されていません（取引不可）。受注を登録できません。",
    };
  }

  if (projectedUsage > creditLimit) {
    return {
      status: "warn",
      projectedUsage,
      available,
      overBy,
      reason: `与信限度を${formatYen(overBy)}超過します（残り枠 ${formatYen(available)}）。`,
    };
  }

  return {
    status: "ok",
    projectedUsage,
    available,
    overBy,
    reason: "与信限度内です。",
  };
}
