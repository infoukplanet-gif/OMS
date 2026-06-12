import { describe, expect, it } from "vitest";

import { createMailStore } from "../stores/mail";
import { createMailQueue, type MailJob } from "./queue";
import { buildAutoMailRecord, syncMailQueueIntoStore } from "./log-bridge";

const job = (orderId: string, triggerType: MailJob["triggerType"]): MailJob => ({
  orderId,
  triggerType,
  dedupeKey: `${orderId}:${triggerType}`,
});

describe("buildAutoMailRecord", () => {
  it("thanks ジョブをサンクスメールのレコードに変換する", () => {
    const rec = buildAutoMailRecord(job("ORD-2026-08851", "thanks"), [
      { id: "ORD-2026-08851", customer: "山田 太郎" },
    ]);
    expect(rec.id).toBe("QA-ORD-2026-08851-thanks");
    expect(rec.orderId).toBe("ORD-2026-08851");
    expect(rec.type).toBe("サンクスメール");
    expect(rec.trigger).toBe("受注確認");
    expect(rec.customer).toBe("山田 太郎");
    expect(rec.subject).toContain("ORD-2026-08851");
    expect(rec.body).toContain("山田 太郎");
    expect(rec.status).toBe("送信待ち");
    expect(rec.source).toBe("auto");
    expect(rec.triggerType).toBe("thanks");
  });

  it("催促系は優先度「高」、フォローは「低」になる", () => {
    expect(buildAutoMailRecord(job("ORD-1", "payment-reminder-3d"), []).priority).toBe("高");
    expect(buildAutoMailRecord(job("ORD-1", "payment-final-call-7d"), []).priority).toBe("高");
    expect(buildAutoMailRecord(job("ORD-1", "rebill-mismatch"), []).priority).toBe("高");
    expect(buildAutoMailRecord(job("ORD-1", "follow-up"), []).priority).toBe("低");
    expect(buildAutoMailRecord(job("ORD-1", "ship-notify"), []).priority).toBe("通常");
  });

  it("受注が見つからない場合は顧客「—」で組み立てる", () => {
    const rec = buildAutoMailRecord(job("ORD-UNKNOWN", "ship-notify"), []);
    expect(rec.customer).toBe("—");
    expect(rec.status).toBe("送信待ち");
  });
});

describe("syncMailQueueIntoStore", () => {
  it("queue のジョブを送信待ちレコードとしてストアに積む", () => {
    const queue = createMailQueue();
    const store = createMailStore();
    queue.enqueueAll([job("ORD-1", "thanks"), job("ORD-2", "ship-notify")]);

    const added = syncMailQueueIntoStore(queue, store, [
      { id: "ORD-1", customer: "山田 太郎" },
    ]);

    expect(added).toBe(2);
    const rows = store.getState();
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.status === "送信待ち" && r.source === "auto")).toBe(true);
  });

  it("再同期は冪等（既存 id はスキップ）", () => {
    const queue = createMailQueue();
    const store = createMailStore();
    queue.enqueueAll([job("ORD-1", "thanks")]);

    expect(syncMailQueueIntoStore(queue, store, [])).toBe(1);
    expect(syncMailQueueIntoStore(queue, store, [])).toBe(0);

    queue.enqueueAll([job("ORD-1", "ship-notify")]);
    expect(syncMailQueueIntoStore(queue, store, [])).toBe(1);
    expect(store.getState()).toHaveLength(2);
  });

  it("ストア側で既に送信済へ進んだレコードを巻き戻さない", () => {
    const queue = createMailQueue();
    const store = createMailStore();
    queue.enqueueAll([job("ORD-1", "thanks")]);
    syncMailQueueIntoStore(queue, store, []);
    store.applyTransition("QA-ORD-1-thanks", "send", "2026/06/11 13:00");

    expect(syncMailQueueIntoStore(queue, store, [])).toBe(0);
    expect(store.getState()[0].status).toBe("送信済");
  });
});
