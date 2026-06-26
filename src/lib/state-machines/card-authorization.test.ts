import { describe, it, expect } from "vitest";
import {
  transitionCardAuthorization,
  canTransitionCardAuthorization,
  nextCardAuthorizationStatus,
  type CardAuthorizationRecord,
} from "./card-authorization";

const base: CardAuthorizationRecord = {
  id: "RC-001",
  order: "ORD-2026-00851",
  customer: "山田太郎",
  amount: 32400,
  authAt: "2026-04-25",
  authExpire: "2026-05-25",
  daysToExpire: 30,
  status: "売上確定待ち",
};

describe("transitionCardAuthorization - 売上確定/期限切れフロー", () => {
  it("capture: 売上確定待ち → 売上確定済", () => {
    expect(transitionCardAuthorization(base, "capture").status).toBe("売上確定済");
  });

  it("expire: 売上確定待ち → オーソリ期限切れ", () => {
    expect(transitionCardAuthorization(base, "expire").status).toBe("オーソリ期限切れ");
  });
});

describe("transitionCardAuthorization - ガード（不正遷移は no-op で同一参照）", () => {
  it("売上確定済は終端（capture/expire 不可・同一参照）", () => {
    const done: CardAuthorizationRecord = { ...base, status: "売上確定済" };
    expect(transitionCardAuthorization(done, "capture")).toBe(done);
    expect(transitionCardAuthorization(done, "expire")).toBe(done);
  });

  it("オーソリ期限切れは終端（capture/expire 不可・同一参照）", () => {
    const expired: CardAuthorizationRecord = { ...base, status: "オーソリ期限切れ" };
    expect(transitionCardAuthorization(expired, "capture")).toBe(expired);
    expect(transitionCardAuthorization(expired, "expire")).toBe(expired);
  });

  it("失敗は終端（capture/expire 不可・同一参照）", () => {
    const failed: CardAuthorizationRecord = { ...base, status: "失敗" };
    expect(transitionCardAuthorization(failed, "capture")).toBe(failed);
    expect(transitionCardAuthorization(failed, "expire")).toBe(failed);
  });
});

describe("transitionCardAuthorization - 不変性", () => {
  it("元レコードを破壊しない", () => {
    const next = transitionCardAuthorization(base, "capture");
    expect(base.status).toBe("売上確定待ち");
    expect(next).not.toBe(base);
  });

  it("order/amount など他項目は維持する", () => {
    const next = transitionCardAuthorization(base, "capture");
    expect(next.order).toBe("ORD-2026-00851");
    expect(next.amount).toBe(32400);
  });
});

describe("canTransitionCardAuthorization / nextCardAuthorizationStatus", () => {
  it("canTransitionCardAuthorization は遷移可否を返す", () => {
    expect(canTransitionCardAuthorization("売上確定待ち", "capture")).toBe(true);
    expect(canTransitionCardAuthorization("売上確定待ち", "expire")).toBe(true);
    expect(canTransitionCardAuthorization("売上確定済", "capture")).toBe(false);
    expect(canTransitionCardAuthorization("オーソリ期限切れ", "capture")).toBe(false);
  });

  it("nextCardAuthorizationStatus は遷移先 or null を返す", () => {
    expect(nextCardAuthorizationStatus("売上確定待ち", "capture")).toBe("売上確定済");
    expect(nextCardAuthorizationStatus("売上確定待ち", "expire")).toBe("オーソリ期限切れ");
    expect(nextCardAuthorizationStatus("売上確定済", "capture")).toBeNull();
  });
});
