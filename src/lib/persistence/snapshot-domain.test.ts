import { describe, it, expect } from "vitest";
import {
  isValidSnapshotRows,
  MAX_SNAPSHOT_ROWS,
  DEFAULT_WORKSPACE,
  resolveWorkspace,
  evaluatePersistenceGuard,
} from "./snapshot-domain";

describe("isValidSnapshotRows", () => {
  it("空配列は有効（store が空の snapshot を許す）", () => {
    expect(isValidSnapshotRows([])).toBe(true);
  });

  it("plain なレコードオブジェクトの配列は有効（id 有無を問わない）", () => {
    expect(
      isValidSnapshotRows([
        { id: "A", status: "x" },
        { id: "B", foo: 1 },
      ]),
    ).toBe(true);
    // sales 台帳のように id を持たず別キー（shipmentId）で識別するレコードも有効。
    expect(
      isValidSnapshotRows([{ shipmentId: "SHP-1", amount: 100 }]),
    ).toBe(true);
  });

  it("配列でない入力は無効", () => {
    expect(isValidSnapshotRows(null)).toBe(false);
    expect(isValidSnapshotRows(undefined)).toBe(false);
    expect(isValidSnapshotRows({ id: "A" })).toBe(false);
    expect(isValidSnapshotRows("[]")).toBe(false);
  });

  it("プリミティブ/配列要素を含むと無効（レコードの配列でない）", () => {
    expect(isValidSnapshotRows([123])).toBe(false);
    expect(isValidSnapshotRows(["str"])).toBe(false);
    expect(isValidSnapshotRows([{ id: "ok" }, [1, 2]])).toBe(false);
  });

  it("null 要素を含むと無効", () => {
    expect(isValidSnapshotRows([null])).toBe(false);
  });

  it("上限件数を超えると無効", () => {
    const tooMany = Array.from({ length: MAX_SNAPSHOT_ROWS + 1 }, (_, i) => ({
      id: String(i),
    }));
    expect(isValidSnapshotRows(tooMany)).toBe(false);
  });

  it("上限ちょうどは有効", () => {
    const exactly = Array.from({ length: MAX_SNAPSHOT_ROWS }, (_, i) => ({
      id: String(i),
    }));
    expect(isValidSnapshotRows(exactly)).toBe(true);
  });
});

describe("resolveWorkspace", () => {
  it("未設定なら既定 workspace を返す", () => {
    expect(resolveWorkspace(undefined)).toBe(DEFAULT_WORKSPACE);
  });

  it("空文字・空白のみは既定にフォールバック", () => {
    expect(resolveWorkspace("")).toBe(DEFAULT_WORKSPACE);
    expect(resolveWorkspace("   ")).toBe(DEFAULT_WORKSPACE);
  });

  it("指定値は trim して採用する", () => {
    expect(resolveWorkspace("acme")).toBe("acme");
    expect(resolveWorkspace("  acme  ")).toBe("acme");
  });
});

describe("evaluatePersistenceGuard（fail-closed / secure by default）", () => {
  it("DB 未接続は常に拒否（no-db）", () => {
    expect(
      evaluatePersistenceGuard({ hasDb: false, allowUnauthenticated: false }),
    ).toEqual({ allowed: false, reason: "no-db" });
    // 未認証許可フラグが立っていても DB が無ければ no-db が優先
    expect(
      evaluatePersistenceGuard({ hasDb: false, allowUnauthenticated: true }),
    ).toEqual({ allowed: false, reason: "no-db" });
  });

  it("DB 接続済みでも未認証許可が無ければ拒否（forbidden）", () => {
    expect(
      evaluatePersistenceGuard({ hasDb: true, allowUnauthenticated: false }),
    ).toEqual({ allowed: false, reason: "forbidden" });
  });

  it("DB 接続済み + 明示許可で初めて許可", () => {
    expect(
      evaluatePersistenceGuard({ hasDb: true, allowUnauthenticated: true }),
    ).toEqual({ allowed: true });
  });
});
