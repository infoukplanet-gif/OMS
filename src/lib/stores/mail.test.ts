import { describe, expect, it, vi } from "vitest";

import type { MailRecord } from "../state-machines/mail";
import { createMailStore } from "./mail";

const record = (over: Partial<MailRecord> = {}): MailRecord => ({
  id: "Q-20260430-0042",
  orderId: "ORD-2026-08423",
  to: "yamada@example.com",
  customer: "山田 太郎",
  subject: "【ご注文ありがとうございます】ORD-2026-08423",
  body: "本文",
  type: "サンクスメール",
  trigger: "受注確認",
  triggerType: "thanks",
  priority: "通常",
  scheduled: "2026/04/30 10:00",
  sentAt: null,
  retry: 0,
  status: "送信待ち",
  source: "seed",
  ...over,
});

describe("createMailStore", () => {
  it("register は新規を積み、同一 id は duplicate で no-op", () => {
    const store = createMailStore();
    expect(store.register(record())).toEqual({ applied: true, duplicate: false });
    expect(store.register(record({ subject: "別件名" }))).toEqual({
      applied: false,
      duplicate: true,
    });
    expect(store.getState()).toHaveLength(1);
    expect(store.getState()[0].subject).toBe(
      "【ご注文ありがとうございます】ORD-2026-08423",
    );
  });

  it("applyTransition が SM 経由で状態を進める", () => {
    const store = createMailStore([record()]);
    const result = store.applyTransition("Q-20260430-0042", "send", "2026/06/11 13:00");
    expect(result.applied).toBe(true);
    expect(result.record?.status).toBe("送信済");
    expect(result.record?.sentAt).toBe("2026/06/11 13:00");
    expect(store.getState()[0].status).toBe("送信済");
  });

  it("applyTransition は不正遷移・未存在 id で applied=false", () => {
    const store = createMailStore([record({ status: "送信済" })]);
    expect(store.applyTransition("Q-20260430-0042", "send").applied).toBe(false);
    expect(store.applyTransition("NOPE", "send")).toEqual({
      applied: false,
      record: null,
    });
  });

  it("patch は表示フィールドを部分更新し、status は触らない", () => {
    const store = createMailStore([record()]);
    const ok = store.patch("Q-20260430-0042", {
      subject: "編集後件名",
      scheduled: "2026/05/01 09:00",
    });
    expect(ok).toBe(true);
    const row = store.getState()[0];
    expect(row.subject).toBe("編集後件名");
    expect(row.scheduled).toBe("2026/05/01 09:00");
    expect(row.status).toBe("送信待ち");
    expect(store.patch("NOPE", { subject: "x" })).toBe(false);
  });

  it("通知は台帳が実際に変化した時のみ飛ぶ", () => {
    const store = createMailStore([record()]);
    const listener = vi.fn();
    store.subscribe(listener);

    store.register(record()); // duplicate → 通知しない
    store.applyTransition("Q-20260430-0042", "resume"); // 不正遷移 → 通知しない
    expect(listener).not.toHaveBeenCalled();

    store.applyTransition("Q-20260430-0042", "hold");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("setItems は台帳を置換する", () => {
    const store = createMailStore([record()]);
    store.setItems([record({ id: "M-1" }), record({ id: "M-2" })]);
    expect(store.getState().map((r) => r.id)).toEqual(["M-1", "M-2"]);
  });
});
