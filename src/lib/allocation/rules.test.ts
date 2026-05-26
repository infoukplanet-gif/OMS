import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_ALLOCATION_RULES,
  getAllocationRules,
  resetAllocationRules,
  setAllocationRules,
  warehouseRank,
} from "./rules";

afterEach(() => resetAllocationRules());

describe("allocation rules — get/set/reset", () => {
  it("既定値を返す", () => {
    expect(getAllocationRules().allowSplit).toBe(true);
    expect(getAllocationRules().orderBy).toBe("受注日昇順");
  });

  it("setAllocationRules で更新できる（配列はコピーされ外部変更の影響を受けない）", () => {
    const priority = ["A", "B"];
    setAllocationRules({ warehousePriority: priority, allowSplit: false, orderBy: "金額降順" });
    priority.push("C"); // 外部配列を変更
    const r = getAllocationRules();
    expect(r.warehousePriority).toEqual(["A", "B"]); // 影響を受けない
    expect(r.allowSplit).toBe(false);
    expect(r.orderBy).toBe("金額降順");
  });

  it("resetAllocationRules で既定に戻る", () => {
    setAllocationRules({ warehousePriority: ["X"], allowSplit: false, orderBy: "登録順" });
    resetAllocationRules();
    expect(getAllocationRules()).toEqual(DEFAULT_ALLOCATION_RULES);
  });
});

describe("warehouseRank", () => {
  it("優先リストの index を返す", () => {
    expect(warehouseRank("大阪", ["本社", "大阪"])).toBe(1);
  });
  it("リスト外は最大値（後回し）", () => {
    expect(warehouseRank("謎", ["本社"])).toBe(Number.MAX_SAFE_INTEGER);
  });
});
