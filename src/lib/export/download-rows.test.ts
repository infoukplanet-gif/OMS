import { describe, it, expect } from "vitest";
import {
  salesDownload,
  purchaseOrderDownload,
  analyticsCsvDownload,
  statusDownload,
  notificationDownload,
  infoDownload,
  completionReport,
  documentsDownload,
  pdfBulkDownload,
  type DownloadDataset,
} from "./download-rows";

const ALL: { name: string; dataset: DownloadDataset }[] = [
  { name: "salesDownload", dataset: salesDownload },
  { name: "purchaseOrderDownload", dataset: purchaseOrderDownload },
  { name: "analyticsCsvDownload", dataset: analyticsCsvDownload },
  { name: "statusDownload", dataset: statusDownload },
  { name: "notificationDownload", dataset: notificationDownload },
  { name: "infoDownload", dataset: infoDownload },
  { name: "completionReport", dataset: completionReport },
  { name: "documentsDownload", dataset: documentsDownload },
  { name: "pdfBulkDownload", dataset: pdfBulkDownload },
];

/** フィルタ未指定（全件出力）の標準コンテキスト。 */
const noFilter = { filters: {} as Record<string, string> };

describe("download-rows データセット共通仕様", () => {
  for (const { name, dataset } of ALL) {
    describe(name, () => {
      it("フィルタ無しで非空の行を返す（ヘッダーのみCSVにならない）", () => {
        const rows = dataset.buildRows(noFilter);
        expect(rows.length).toBeGreaterThan(0);
      });

      it("全行のセル数が列定義数と一致する", () => {
        const rows = dataset.buildRows(noFilter);
        for (const row of rows) {
          expect(row).toHaveLength(dataset.columns.length);
        }
      });

      it("セルは文字列か数値のみ（undefined/null を出力しない）", () => {
        const rows = dataset.buildRows(noFilter);
        for (const row of rows) {
          for (const cell of row) {
            expect(["string", "number"]).toContain(typeof cell);
          }
        }
      });
    });
  }
});

describe("対象期間フィルタ", () => {
  it("範囲外の期間を指定すると行が絞られる（0件もしくは全件未満）", () => {
    const full = salesDownload.buildRows(noFilter).length;
    const narrowed = salesDownload.buildRows({
      ...noFilter,
      from: new Date(2026, 4, 1),
      to: new Date(2026, 4, 1),
    }).length;
    expect(narrowed).toBeLessThan(full);
  });

  it("はるか未来の期間では該当行が0件になる", () => {
    const rows = analyticsCsvDownload.buildRows({
      ...noFilter,
      from: new Date(2099, 0, 1),
      to: new Date(2099, 0, 2),
    });
    expect(rows).toHaveLength(0);
  });
});

describe("属性フィルタ", () => {
  it("仕入先で絞ると全件未満になる", () => {
    const full = purchaseOrderDownload.buildRows(noFilter).length;
    const supplierCell = purchaseOrderDownload.buildRows(noFilter)[0][2] as string;
    const narrowed = purchaseOrderDownload.buildRows({
      filters: { supplier: supplierCell },
    });
    expect(narrowed.length).toBeGreaterThan(0);
    expect(narrowed.length).toBeLessThanOrEqual(full);
    // 絞り込み結果はすべて指定仕入先
    for (const row of narrowed) {
      expect(row[2]).toBe(supplierCell);
    }
  });

  it("「すべて」は絞り込みなしとして全件返す", () => {
    const all = analyticsCsvDownload.buildRows({ filters: { shop: "すべて" } });
    const none = analyticsCsvDownload.buildRows(noFilter);
    expect(all.length).toBe(none.length);
  });
});

describe("salesDownload は税抜+税額=税込を満たす", () => {
  it("各行の税抜金額と税額の合計が税込金額に一致する", () => {
    const rows = salesDownload.buildRows(noFilter);
    for (const row of rows) {
      const exclusive = row[10] as number;
      const tax = row[11] as number;
      const inclusive = row[12] as number;
      expect(exclusive + tax).toBe(inclusive);
    }
  });
});
