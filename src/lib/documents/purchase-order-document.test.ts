import { describe, it, expect } from "vitest";
import {
  buildPurchaseOrderDocument,
  PURCHASE_ORDER_TAX_RATE,
  type PurchaseOrderSource,
  type DocumentTemplateConfig,
} from "./purchase-order-document";

const JP_TEMPLATE: DocumentTemplateConfig = {
  language: "日本語",
  paperSize: "A4縦",
  showLogo: true,
  showInvoice: true,
  showSignature: true,
  showTaxBreakdown: true,
};

const EN_TEMPLATE: DocumentTemplateConfig = {
  language: "English",
  paperSize: "A4縦",
  showLogo: true,
  showInvoice: false,
  showSignature: true,
  showTaxBreakdown: false,
};

const baseSource: PurchaseOrderSource = {
  id: "PO-2026-0048",
  supplier: "東亜電機株式会社",
  date: "2026-05-09",
  expected: "2026-05-16",
  amount: 198000,
  lines: [
    { sku: "UCB-002", name: "USBケーブル", warehouse: "大阪倉庫", orderedQty: 100, unitPrice: 1200 },
    { sku: "HDM-010", name: "HDMIケーブル", warehouse: "大阪倉庫", orderedQty: 50, unitPrice: 1560 },
  ],
};

describe("buildPurchaseOrderDocument", () => {
  it("発注番号・仕入先・発注日をそのまま転記する", () => {
    const doc = buildPurchaseOrderDocument(baseSource, JP_TEMPLATE);
    expect(doc.documentNo).toBe("PO-2026-0048");
    expect(doc.supplierName).toBe("東亜電機株式会社");
    expect(doc.issueDate).toBe("2026-05-09");
    expect(doc.expectedDate).toBe("2026-05-16");
  });

  it("issueDate を明示指定するとそちらを優先する（Date-free）", () => {
    const doc = buildPurchaseOrderDocument(baseSource, JP_TEMPLATE, "2026-06-01");
    expect(doc.issueDate).toBe("2026-06-01");
  });

  it("言語に応じてタイトルを切り替える", () => {
    expect(buildPurchaseOrderDocument(baseSource, JP_TEMPLATE).title).toBe("発注書");
    expect(buildPurchaseOrderDocument(baseSource, EN_TEMPLATE).title).toBe("Purchase Order");
    expect(
      buildPurchaseOrderDocument(baseSource, { ...JP_TEMPLATE, language: "中文" }).title,
    ).toBe("采购订单");
  });

  it("明細の単価がある場合は行金額=単価×数量で算出する", () => {
    const doc = buildPurchaseOrderDocument(baseSource, JP_TEMPLATE);
    expect(doc.lines[0].amount).toBe(120000);
    expect(doc.lines[1].amount).toBe(78000);
  });

  it("商品名が無い明細は SKU をフォールバック表示する", () => {
    const doc = buildPurchaseOrderDocument(
      { ...baseSource, lines: [{ sku: "ABC-001", orderedQty: 5 }] },
      JP_TEMPLATE,
    );
    expect(doc.lines[0].name).toBe("ABC-001");
    expect(doc.lines[0].unitPrice).toBeNull();
    expect(doc.lines[0].amount).toBeNull();
  });

  it("全明細に単価があれば小計は行金額の合計", () => {
    const doc = buildPurchaseOrderDocument(baseSource, JP_TEMPLATE);
    expect(doc.subtotal).toBe(198000);
  });

  it("単価が欠ける明細があれば小計は発注書の amount にフォールバックする", () => {
    const doc = buildPurchaseOrderDocument(
      {
        ...baseSource,
        amount: 67000,
        lines: [{ sku: "UCB-002", orderedQty: 20 }],
      },
      JP_TEMPLATE,
    );
    expect(doc.subtotal).toBe(67000);
  });

  it("税内訳ありなら消費税と税込合計を出す", () => {
    const doc = buildPurchaseOrderDocument(baseSource, JP_TEMPLATE);
    expect(doc.tax).toBe(Math.round(198000 * PURCHASE_ORDER_TAX_RATE));
    expect(doc.total).toBe(198000 + Math.round(198000 * PURCHASE_ORDER_TAX_RATE));
  });

  it("税内訳なしなら tax=null・合計=小計（amount を税込総額として扱う）", () => {
    const doc = buildPurchaseOrderDocument(baseSource, EN_TEMPLATE);
    expect(doc.tax).toBeNull();
    expect(doc.total).toBe(198000);
  });

  it("テンプレートの表示フラグをそのまま引き渡す", () => {
    const doc = buildPurchaseOrderDocument(baseSource, EN_TEMPLATE);
    expect(doc.showLogo).toBe(true);
    expect(doc.showInvoice).toBe(false);
    expect(doc.showSignature).toBe(true);
    expect(doc.showTaxBreakdown).toBe(false);
    expect(doc.language).toBe("English");
    expect(doc.paperSize).toBe("A4縦");
  });

  it("expected が空や「—」なら expectedDate は null", () => {
    expect(
      buildPurchaseOrderDocument({ ...baseSource, expected: "—" }, JP_TEMPLATE).expectedDate,
    ).toBeNull();
    expect(
      buildPurchaseOrderDocument({ ...baseSource, expected: "" }, JP_TEMPLATE).expectedDate,
    ).toBeNull();
    expect(
      buildPurchaseOrderDocument({ ...baseSource, expected: undefined }, JP_TEMPLATE).expectedDate,
    ).toBeNull();
  });

  it("言語別ラベルを返す（明細ヘッダ・合計欄）", () => {
    const jp = buildPurchaseOrderDocument(baseSource, JP_TEMPLATE).labels;
    expect(jp.item).toBe("品目");
    expect(jp.total).toBe("合計");
    const en = buildPurchaseOrderDocument(baseSource, EN_TEMPLATE).labels;
    expect(en.item).toBe("Item");
    expect(en.total).toBe("Total");
  });
});
