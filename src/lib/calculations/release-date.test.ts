import { describe, it, expect } from "vitest";
import {
  isReadyForRelease,
  ordersReadyForRelease,
  type ReleaseCandidate,
} from "./release-date";

const candidate = (overrides: Partial<ReleaseCandidate> = {}): ReleaseCandidate => ({
  status: "発売日時待ち",
  releaseAt: "2026-05-15T10:00:00Z",
  ...overrides,
});

describe("isReadyForRelease", () => {
  it("returns true when 発売日時待ち and releaseAt is in the past", () => {
    const now = new Date("2026-05-15T11:00:00Z");
    expect(isReadyForRelease(candidate({ releaseAt: "2026-05-15T10:00:00Z" }), now)).toBe(true);
  });

  it("returns true when releaseAt equals the current instant (boundary)", () => {
    const now = new Date("2026-05-15T10:00:00Z");
    expect(isReadyForRelease(candidate({ releaseAt: "2026-05-15T10:00:00Z" }), now)).toBe(true);
  });

  it("returns false when releaseAt is in the future", () => {
    const now = new Date("2026-05-15T09:00:00Z");
    expect(isReadyForRelease(candidate({ releaseAt: "2026-05-15T10:00:00Z" }), now)).toBe(false);
  });

  it("returns false when status is not 発売日時待ち", () => {
    const now = new Date("2026-05-15T11:00:00Z");
    for (const status of [
      "新規受付",
      "確認待ち",
      "入金待ち",
      "引当待ち",
      "印刷待ち",
      "印刷済み",
      "出荷済み",
      "キャンセル",
    ] as const) {
      expect(isReadyForRelease(candidate({ status, releaseAt: "2026-05-15T10:00:00Z" }), now)).toBe(false);
    }
  });

  it("returns false when releaseAt is missing", () => {
    const now = new Date("2026-05-15T11:00:00Z");
    expect(isReadyForRelease(candidate({ releaseAt: undefined }), now)).toBe(false);
  });

  it("returns false when releaseAt is an invalid ISO string (defensive)", () => {
    const now = new Date("2026-05-15T11:00:00Z");
    expect(isReadyForRelease(candidate({ releaseAt: "not-a-date" }), now)).toBe(false);
  });
});

describe("ordersReadyForRelease", () => {
  it("returns only orders whose releaseAt has been reached", () => {
    const now = new Date("2026-05-15T11:00:00Z");
    const orders = [
      { id: "A", ...candidate({ releaseAt: "2026-05-14T00:00:00Z" }) },
      { id: "B", ...candidate({ releaseAt: "2026-05-16T00:00:00Z" }) },
      { id: "C", status: "確認待ち" as const, releaseAt: "2026-05-10T00:00:00Z" },
      { id: "D", ...candidate({ releaseAt: "2026-05-15T11:00:00Z" }) },
    ];

    const ready = ordersReadyForRelease(orders, now);

    expect(ready.map((o) => o.id)).toEqual(["A", "D"]);
  });

  it("preserves object identity for matched orders", () => {
    const now = new Date("2026-05-15T11:00:00Z");
    const orders = [{ id: "A", ...candidate({ releaseAt: "2026-05-14T00:00:00Z" }) }];

    const ready = ordersReadyForRelease(orders, now);

    expect(ready[0]).toBe(orders[0]);
  });

  it("returns an empty array when no order is ready", () => {
    const now = new Date("2026-05-15T11:00:00Z");
    const orders = [{ id: "A", ...candidate({ releaseAt: "2026-05-16T00:00:00Z" }) }];

    expect(ordersReadyForRelease(orders, now)).toEqual([]);
  });
});
