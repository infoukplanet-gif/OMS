import { describe, it, expect } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("ヘッダー行と各データ行を改行で連結する", () => {
    const csv = toCsv(["SKU", "数量"], [["A-1", 10], ["B-2", 5]]);
    expect(csv).toBe("SKU,数量\r\nA-1,10\r\nB-2,5");
  });

  it("カンマを含む値はダブルクォートで囲む", () => {
    const csv = toCsv(["名称"], [["ケーブル, 1m"]]);
    expect(csv).toBe('名称\r\n"ケーブル, 1m"');
  });

  it("ダブルクォートを含む値はエスケープして囲む", () => {
    const csv = toCsv(["メモ"], [['12"モニタ']]);
    expect(csv).toBe('メモ\r\n"12""モニタ"');
  });

  it("改行を含む値はダブルクォートで囲む", () => {
    const csv = toCsv(["住所"], [["東京都\n千代田区"]]);
    expect(csv).toBe('住所\r\n"東京都\n千代田区"');
  });

  it("数値はそのまま文字列化する", () => {
    const csv = toCsv(["金額"], [[1234]]);
    expect(csv).toBe("金額\r\n1234");
  });

  it("行が無ければヘッダーのみを返す", () => {
    expect(toCsv(["A", "B"], [])).toBe("A,B");
  });

  it("newline に LF を指定すると LF 区切りで連結する", () => {
    const csv = toCsv(["SKU", "数量"], [["A-1", 10]], "\n");
    expect(csv).toBe("SKU,数量\nA-1,10");
  });
});
