/**
 * メール送信ログ 状態機械 v1
 *
 * 送信待ち → 送信済（send）/ 保留（hold）/ キャンセル済（cancel）/ エラー（fail）
 * 保留     → 送信待ち（resume）/ 送信済（send）/ キャンセル済（cancel）
 * エラー   → 送信済（resend, retry+1）
 * 送信済・キャンセル済は終端。
 *
 * 不正遷移は同一参照を返す（no-op シグナル）。
 */

import type { MailTriggerType } from "../mail/queue";

export type MailStatus = "送信待ち" | "保留" | "送信済" | "エラー" | "キャンセル済";

export type MailAction = "send" | "hold" | "resume" | "cancel" | "fail" | "resend";

export type MailPriority = "高" | "通常" | "低";

export type MailSource = "auto" | "seed" | "manual";

export interface MailRecord {
  id: string;
  orderId: string;
  to: string;
  customer: string;
  subject: string;
  body: string;
  /** サンクスメール / 出荷通知 / 入金確認 / フォロー / お詫び 等 */
  type: string;
  /** 受注確認 / 出荷完了 / 入金待ち3日 等の日本語トリガーラベル */
  trigger: string;
  /** 自動キュー由来の場合のみトリガー種別を保持 */
  triggerType: MailTriggerType | null;
  priority: MailPriority;
  scheduled: string;
  sentAt: string | null;
  retry: number;
  status: MailStatus;
  source: MailSource;
}

const TRANSITIONS: Record<MailStatus, Partial<Record<MailAction, MailStatus>>> = {
  送信待ち: {
    send: "送信済",
    hold: "保留",
    cancel: "キャンセル済",
    fail: "エラー",
  },
  保留: {
    resume: "送信待ち",
    send: "送信済",
    cancel: "キャンセル済",
  },
  エラー: {
    resend: "送信済",
  },
  送信済: {},
  キャンセル済: {},
};

export function nextMailStatus(status: MailStatus, action: MailAction): MailStatus | null {
  return TRANSITIONS[status][action] ?? null;
}

export function canTransitionMail(status: MailStatus, action: MailAction): boolean {
  return nextMailStatus(status, action) !== null;
}

/**
 * 遷移を適用した新しいレコードを返す。不正遷移は同一参照を返す。
 * send / resend で sentAt を記録し、resend は retry を +1 する。
 */
export function transitionMail(
  record: MailRecord,
  action: MailAction,
  now?: string,
): MailRecord {
  const next = nextMailStatus(record.status, action);
  if (next === null) return record;

  const isSendLike = action === "send" || action === "resend";
  return {
    ...record,
    status: next,
    sentAt: isSendLike ? (now ?? record.sentAt) : record.sentAt,
    retry: action === "resend" ? record.retry + 1 : record.retry,
  };
}
