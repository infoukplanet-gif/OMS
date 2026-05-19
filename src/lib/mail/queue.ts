/**
 * 自動メール送信 queue（v1: in-memory モック）
 *
 * 仕様: docs/prd/mail-trigger-v1.md
 *
 * - handler が返した sendMail 記述子（MailJob）を enqueue する
 * - (orderId, triggerType) で重複送信を抑止（dedupeKey でユニーク判定）
 * - 自動送信トリガーが OFF のジョブはスキップ（dedupe slot は消費しない）
 * - v2 で実送信・retry・persistence を担うジョブワーカに置き換え
 */

export type MailTriggerType =
  | "thanks"
  | "ship-notify"
  | "payment-confirmed"
  | "payment-reminder-3d"
  | "payment-final-call-7d";

export interface MailJob {
  orderId: string;
  triggerType: MailTriggerType;
  /** `${orderId}:${triggerType}` 形式の重複抑止キー */
  dedupeKey: string;
}

export type AutoMailEnabled = Readonly<Record<MailTriggerType, boolean>>;

export interface EnqueueResult {
  enqueued: number;
  duplicateSkipped: number;
  disabledSkipped: number;
}

export interface MailQueue {
  enqueueAll(jobs: ReadonlyArray<MailJob>, enabled?: AutoMailEnabled): EnqueueResult;
  snapshot(): MailJob[];
}

const DEFAULT_ENABLED: AutoMailEnabled = {
  thanks: true,
  "ship-notify": true,
  "payment-confirmed": true,
  "payment-reminder-3d": true,
  "payment-final-call-7d": true,
};

export function createMailQueue(): MailQueue {
  const seen = new Set<string>();
  const jobs: MailJob[] = [];

  return {
    enqueueAll(batch, enabled = DEFAULT_ENABLED) {
      let enqueued = 0;
      let duplicateSkipped = 0;
      let disabledSkipped = 0;

      for (const job of batch) {
        if (!enabled[job.triggerType]) {
          disabledSkipped++;
          continue;
        }
        if (seen.has(job.dedupeKey)) {
          duplicateSkipped++;
          continue;
        }
        seen.add(job.dedupeKey);
        jobs.push(job);
        enqueued++;
      }

      return { enqueued, duplicateSkipped, disabledSkipped };
    },
    snapshot() {
      return [...jobs];
    },
  };
}

/**
 * クライアントセッション内で共有される単一の MailQueue インスタンス。
 *
 * v1 はブラウザの module 評価スコープで保持される（リロードで消える）ので
 * 「同一セッション中の自動 enqueue が mail/pending から覗ける」という UX のみ提供する。
 * 永続化・サーバ集約は v2 で server action + DB に置き換える。
 *
 * テストは createMailQueue() を直接使う想定（singleton は global state なので test 用ではない）。
 */
export const mailQueue: MailQueue = createMailQueue();
