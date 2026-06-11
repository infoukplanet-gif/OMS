import { describe, it, expect } from "vitest";
import { renderPurchaseOrderHtml } from "./purchase-order-html";
import {
  buildPurchaseOrderDocument,
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

const source: PurchaseOrderSource = {
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

const issuer = {
  name: "株式会社サンプル商事",
  postalCode: "150-0001",
  address: "東京都渋谷区神宮前1-2-3",
  tel: "03-1234-5678",
  invoiceNo: "T1234567890123",
};

describe("renderPurchaseOrderHtml", () => {
  it("完全な HTML ドキュメント文字列を返す", () => {
    const html = renderPurchaseOrderHtml(buildPurchaseOrderDocument(source, JP_TEMPLATE), issuer);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("</html>");
    expect(html).toContain("発注書");
    expect(html).toContain("PO-2026-0048");
    expect(html).toContain("東亜電機株式会社");
  });

  it("明細行（品名・数量・金額）を描画する", () => {
    const html = renderPurchaseOrderHtml(buildPurchaseOrderDocument(source, JP_TEMPLATE), issuer);
    expect(html).toContain("USBケーブル");
    expect(html).toContain("HDMIケーブル");
    expect(html).toContain("120,000");
    expect(html).toContain("78,000");
  });

  it("税内訳ありなら小計・消費税・合計を出す", () => {
    const html = renderPurchaseOrderHtml(buildPurchaseOrderDocument(source, JP_TEMPLATE), issuer);
    expect(html).toContain("小計");
    expect(html).toContain("消費税");
    expect(html).toContain("217,800"); // 198000 + 19800
  });

  it("税内訳なしなら小計・消費税欄を出さない", () => {
    const noTax = renderPurchaseOrderHtml(
      buildPurchaseOrderDocument(source, { ...JP_TEMPLATE, showTaxBreakdown: false }),
      issuer,
    );
    expect(noTax).not.toContain("消費税");
  });

  it("showInvoice が true ならインボイス番号を印字する", () => {
    const html = renderPurchaseOrderHtml(buildPurchaseOrderDocument(source, JP_TEMPLATE), issuer);
    expect(html).toContain("T1234567890123");
  });

  it("showInvoice が false ならインボイス番号を印字しない", () => {
    const html = renderPurchaseOrderHtml(
      buildPurchaseOrderDocument(source, { ...JP_TEMPLATE, showInvoice: false }),
      issuer,
    );
    expect(html).not.toContain("T1234567890123");
  });

  it("showSignature が true なら社印欄を出す", () => {
    const withSig = renderPurchaseOrderHtml(buildPurchaseOrderDocument(source, JP_TEMPLATE), issuer);
    const noSig = renderPurchaseOrderHtml(
      buildPurchaseOrderDocument(source, { ...JP_TEMPLATE, showSignature: false }),
      issuer,
    );
    expect(withSig).toContain("社印");
    expect(noSig).not.toContain("社印");
  });

  it("HTML特殊文字をエスケープする（XSS防止）", () => {
    const html = renderPurchaseOrderHtml(
      buildPurchaseOrderDocument(
        { ...source, supplier: "<script>alert(1)</script>" },
        JP_TEMPLATE,
      ),
      issuer,
    );
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("英語テンプレートは英語ラベルで描画する", () => {
    const html = renderPurchaseOrderHtml(
      buildPurchaseOrderDocument(source, {
        ...JP_TEMPLATE,
        language: "English",
        showTaxBreakdown: false,
      }),
      issuer,
    );
    expect(html).toContain("Purchase Order");
    expect(html).toContain("Supplier");
  });

  it("A4横なら landscape の @page を出力する", () => {
    const html = renderPurchaseOrderHtml(
      buildPurchaseOrderDocument(source, { ...JP_TEMPLATE, paperSize: "A4横" }),
      issuer,
    );
    expect(html).toContain("landscape");
  });
});
