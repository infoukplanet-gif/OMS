/**
 * 自動メール queue → メール送信ログストア 同期ブリッジ v1
 *
 * mailQueue（cascade が enqueue する生ジョブ）を MailRecord に変換して
 * mailStore に冪等に積む。queue 側 API は無改変（orders/dashboard の
 * enqueueAll 呼び出しはそのまま）。メール系ページがマウント時に
 * syncMailQueueIntoStore を呼ぶことで、セッション内の自動 enqueue が
 * 送信待ち一覧に合流する。
 *
 * - レコード id は `QA-${orderId}-${triggerType}`（dedupeKey と1:1）
 * - 既存 id はスキップ → 再同期・リロード後の再 enqueue でも二重登録しない
 * - ストア側で送信済等へ進んだレコードは巻き戻さない（id 一致で除外）
 */

import type { MailPriority, MailRecord } from "../state-machines/mail";
import type { MailStore } from "../stores/mail";
import { mailStore } from "../stores/mail";
import type { MailJob, MailQueue, MailTriggerType } from "./queue";
import { mailQueue } from "./queue";

export interface OrderLookupEntry {
  id: string;
  customer?: unknown;
}

interface TriggerMeta {
  type: string;
  trigger: string;
  priority: MailPriority;
  subject: (orderId: string) => string;
  body: (customer: string, orderId: string) => string;
}

const TRIGGER_META: Record<MailTriggerType, TriggerMeta> = {
  thanks: {
    type: "サンクスメール",
    trigger: "受注確認",
    priority: "通常",
    subject: (o) => `【ご注文ありがとうございます】${o}`,
    body: (c, o) =>
      `${c} 様\n\nこの度はご注文いただき誠にありがとうございます。\nご注文番号: ${o}\n商品の発送準備が整い次第、改めてご連絡いたします。`,
  },
  "ship-notify": {
    type: "出荷通知",
    trigger: "出荷完了",
    priority: "通常",
    subject: (o) => `【出荷完了のお知らせ】${o}`,
    body: (c, o) =>
      `${c} 様\n\nご注文いただいた商品を出荷いたしました。\nご注文番号: ${o}\n到着まで今しばらくお待ちください。`,
  },
  "delivery-notify": {
    type: "出荷通知",
    trigger: "配送中",
    priority: "通常",
    subject: (o) => `【配送状況のお知らせ】${o}`,
    body: (c, o) =>
      `${c} 様\n\nご注文いただいた商品が配送中です。\nご注文番号: ${o}\n追跡番号は出荷通知メールをご確認ください。`,
  },
  "payment-confirmed": {
    type: "入金確認",
    trigger: "入金確認",
    priority: "通常",
    subject: (o) => `【ご入金確認のお知らせ】${o}`,
    body: (c, o) =>
      `${c} 様\n\nご入金を確認いたしました。ありがとうございます。\nご注文番号: ${o}\n出荷準備を進めてまいります。`,
  },
  "payment-reminder-3d": {
    type: "入金確認",
    trigger: "入金待ち3日",
    priority: "高",
    subject: (o) => `【お支払いのお願い】${o}`,
    body: (c, o) =>
      `${c} 様\n\nご注文から3日が経過しましたが、ご入金の確認が取れておりません。\nご注文番号: ${o}\nお支払い手続きをお願いいたします。`,
  },
  "payment-final-call-7d": {
    type: "入金確認",
    trigger: "入金待ち7日",
    priority: "高",
    subject: (o) => `【最終のお支払いのお願い】${o}`,
    body: (c, o) =>
      `${c} 様\n\nご注文から7日が経過しております。\nご注文番号: ${o}\n期日までにご入金が確認できない場合、ご注文をキャンセルさせていただく場合がございます。`,
  },
  "follow-up": {
    type: "フォロー",
    trigger: "配達完了後",
    priority: "低",
    subject: (o) => `【商品到着のご確認】${o}`,
    body: (c, o) =>
      `${c} 様\n\n先日お届けした商品はいかがでしたでしょうか。\nご注文番号: ${o}\nご不明点がございましたらお気軽にお問い合わせください。`,
  },
  "rebill-mismatch": {
    type: "入金確認",
    trigger: "金額不一致",
    priority: "高",
    subject: (o) => `【ご請求金額のご確認】${o}`,
    body: (c, o) =>
      `${c} 様\n\nご入金額とご請求金額に差異がございました。\nご注文番号: ${o}\nお手数ですが内容のご確認をお願いいたします。`,
  },
};

function resolveCustomer(orderId: string, orders: ReadonlyArray<OrderLookupEntry>): string {
  const hit = orders.find((o) => o.id === orderId);
  return typeof hit?.customer === "string" && hit.customer.length > 0 ? hit.customer : "—";
}

/** 受注に顧客メールを持たないため、注文番号から表示用アドレスを合成する */
function synthesizeAddress(orderId: string): string {
  const digits = orderId.replace(/\D/g, "").slice(-5) || "00000";
  return `customer-${digits}@example.com`;
}

export function buildAutoMailRecord(
  job: MailJob,
  orders: ReadonlyArray<OrderLookupEntry>,
): MailRecord {
  const meta = TRIGGER_META[job.triggerType];
  const customer = resolveCustomer(job.orderId, orders);

  return {
    id: `QA-${job.orderId}-${job.triggerType}`,
    orderId: job.orderId,
    to: synthesizeAddress(job.orderId),
    customer,
    subject: meta.subject(job.orderId),
    body: meta.body(customer === "—" ? "お客" : customer, job.orderId),
    type: meta.type,
    trigger: meta.trigger,
    triggerType: job.triggerType,
    priority: meta.priority,
    scheduled: "即時",
    sentAt: null,
    retry: 0,
    status: "送信待ち",
    source: "auto",
  };
}

/**
 * queue の全ジョブをストアへ冪等同期する。追加できた件数を返す。
 * 既定はセッション共有 singleton 同士（メール系ページの useEffect から呼ぶ）。
 */
export function syncMailQueueIntoStore(
  queue: MailQueue = mailQueue,
  store: MailStore = mailStore,
  orders: ReadonlyArray<OrderLookupEntry> = [],
): number {
  let added = 0;
  for (const job of queue.snapshot()) {
    const result = store.register(buildAutoMailRecord(job, orders));
    if (result.applied) added++;
  }
  return added;
}
