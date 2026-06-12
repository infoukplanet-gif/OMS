import { describe, expect, it } from "vitest";

import {
  canTransitionMail,
  nextMailStatus,
  transitionMail,
  type MailRecord,
} from "./mail";

const base: MailRecord = {
  id: "Q-20260430-0042",
  orderId: "ORD-2026-08423",
  to: "yamada@example.com",
  customer: "山田 太郎",
  subject: "【ご注文ありがとうございます】ORD-2026-08423",
  body: "山田 太郎 様\n\nご注文ありがとうございます。",
  type: "サンクスメール",
  trigger: "受注確認",
  triggerType: "thanks",
  priority: "通常",
  scheduled: "2026/04/30 10:00",
  sentAt: null,
  retry: 0,
  status: "送信待ち",
  source: "seed",
};

describe("nextMailStatus / canTransitionMail", () => {
  it("送信待ちから send / hold / cancel / fail が成立する", () => {
    expect(nextMailStatus("送信待ち", "send")).toBe("送信済");
    expect(nextMailStatus("送信待ち", "hold")).toBe("保留");
    expect(nextMailStatus("送信待ち", "cancel")).toBe("キャンセル済");
    expect(nextMailStatus("送信待ち", "fail")).toBe("エラー");
  });

  it("保留から resume / send / cancel が成立する", () => {
    expect(nextMailStatus("保留", "resume")).toBe("送信待ち");
    expect(nextMailStatus("保留", "send")).toBe("送信済");
    expect(nextMailStatus("保留", "cancel")).toBe("キャンセル済");
  });

  it("エラーから resend のみ成立する", () => {
    expect(nextMailStatus("エラー", "resend")).toBe("送信済");
    expect(nextMailStatus("エラー", "cancel")).toBeNull();
    expect(canTransitionMail("エラー", "resend")).toBe(true);
  });

  it("送信済・キャンセル済は終端（全アクション不成立）", () => {
    for (const action of ["send", "hold", "resume", "cancel", "fail", "resend"] as const) {
      expect(nextMailStatus("送信済", action)).toBeNull();
      expect(nextMailStatus("キャンセル済", action)).toBeNull();
    }
  });

  it("送信待ちから resume / resend は不成立", () => {
    expect(nextMailStatus("送信待ち", "resume")).toBeNull();
    expect(nextMailStatus("送信待ち", "resend")).toBeNull();
  });
});

describe("transitionMail", () => {
  it("send で送信済になり sentAt が記録される", () => {
    const sent = transitionMail(base, "send", "2026/06/11 13:00");
    expect(sent.status).toBe("送信済");
    expect(sent.sentAt).toBe("2026/06/11 13:00");
    expect(sent.retry).toBe(0);
  });

  it("resend で送信済になり retry が +1 される", () => {
    const errored: MailRecord = { ...base, status: "エラー", retry: 2 };
    const resent = transitionMail(errored, "resend", "2026/06/11 13:05");
    expect(resent.status).toBe("送信済");
    expect(resent.retry).toBe(3);
    expect(resent.sentAt).toBe("2026/06/11 13:05");
  });

  it("fail でエラーになる（retry は据え置き）", () => {
    const failed = transitionMail(base, "fail");
    expect(failed.status).toBe("エラー");
    expect(failed.retry).toBe(0);
    expect(failed.sentAt).toBeNull();
  });

  it("不正遷移は同一参照を返す（no-op）", () => {
    const sent: MailRecord = { ...base, status: "送信済", sentAt: "2026/04/30 09:00" };
    expect(transitionMail(sent, "send", "2026/06/11 13:00")).toBe(sent);
  });

  it("元レコードを破壊しない（イミュータブル）", () => {
    const result = transitionMail(base, "send", "2026/06/11 13:00");
    expect(result).not.toBe(base);
    expect(base.status).toBe("送信待ち");
    expect(base.sentAt).toBeNull();
  });
});
