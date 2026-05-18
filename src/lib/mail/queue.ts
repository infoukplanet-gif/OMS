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

export type MailTriggerType = "thanks" | "ship-notify" | "payment-confirmed";

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
