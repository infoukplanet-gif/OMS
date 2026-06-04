import { describe, it, expect, beforeAll } from "vitest";
import { snapshotDomain, restoreDomain } from "./snapshots";

/**
 * DATABASE_URL 未設定（in-memory fallback）時の振る舞いを検証する。
 * getDb() は呼び出し時に process.env を読むので、ここで明示的に未設定にする。
 */
describe("snapshots actions（DB 未接続フォールバック）", () => {
  beforeAll(() => {
    delete process.env.DATABASE_URL;
  });

  it("snapshotDomain は DB 未接続なら no-db を返す", async () => {
    const res = await snapshotDomain("inventory", [{ id: "SKU-1" }]);
    expect(res).toEqual({ ok: false, reason: "no-db", count: 0 });
  });

  it("restoreDomain は DB 未接続なら null を返す", async () => {
    expect(await restoreDomain("payments")).toBeNull();
  });

  it("DB 未接続なら不正入力でも no-db（DB チェックが先）", async () => {
    const res = await snapshotDomain("orders", "not-an-array" as unknown as []);
    expect(res.reason).toBe("no-db");
  });
});
