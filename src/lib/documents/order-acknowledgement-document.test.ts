import { describe, it, expect } from "vitest";
import {
  buildOrderAcknowledgementDocument,
  ORDER_ACKNOWLEDGEMENT_TAX_RATE,
  type OrderAcknowledgementSource,
} from "./order-acknowledgement-document";

const BASE_SOURCE: OrderAcknowledgementSource = {
  id: "ORD-2026-08851",
  customerName: "山田太郎",
  orderDate: "2026/07/09",
  status: "入金済み",
  shippingFee: 800,
  lines: [
    { sku: "WEP-001", name: "ワイヤレスイヤホン Pro", unitPrice: 12800, qty: 2 },
    { sku: "UCB-002", name: "USB-Cケーブル 2m", unitPrice: 1280, qty: 3 },
    { sku: "PFS-005", name: "保護フィルム セット", unitPrice: 1580, qty: 1 },
  ],
};

describe("buildOrderAcknowledgementDocument", () => {
  it("固定タイトル『注文請書』と受注番号を documentNo に載せる", () => {
    const doc = buildOrderAcknowledgementDocument(BASE_SOURCE);
    expect(doc.title).toBe("注文請書");
    expect(doc.documentNo).toBe("ORD-2026-08851");
  });

  it("各行の金額は単価×数量で算出する", () => {
    const doc = buildOrderAcknowledgementDocument(BASE_SOURCE);
    expect(doc.lines[0].amount).toBe(25600);
    expect(doc.lines[1].amount).toBe(3840);
    expect(doc.lines[2].amount).toBe(1580);
  });

  it("小計は全行金額の合計", () => {
    const doc = buildOrderAcknowledgementDocument(BASE_SOURCE);
    expect(doc.subtotal).toBe(31020);
  });

  it("消費税は（小計＋送料）×税率を四捨五入し、合計は小計＋送料＋税", () => {
    const doc = buildOrderAcknowledgementDocument(BASE_SOURCE);
    // (31020 + 800) * 0.1 = 3182
    expect(doc.tax).toBe(3182);
    expect(doc.total).toBe(35002);
    expect(doc.taxRate).toBe(ORDER_ACKNOWLEDGEMENT_TAX_RATE);
  });

  it("送料0のときは送料を加えず、税は小計のみに課税する", () => {
    const doc = buildOrderAcknowledgementDocument({ ...BASE_SOURCE, shippingFee: 0 });
    expect(doc.shippingFee).toBe(0);
    expect(doc.tax).toBe(3102); // 31020 * 0.1
    expect(doc.total).toBe(34122);
  });

  it("負の送料は0扱いにする", () => {
    const doc = buildOrderAcknowledgementDocument({ ...BASE_SOURCE, shippingFee: -500 });
    expect(doc.shippingFee).toBe(0);
  });

  it("name 未指定の行は SKU をフォールバック表示に使う", () => {
    const doc = buildOrderAcknowledgementDocument({
      ...BASE_SOURCE,
      lines: [{ sku: "NO-NAME", unitPrice: 100, qty: 1 }],
    });
    expect(doc.lines[0].name).toBe("NO-NAME");
  });

  it("発行日を渡さない場合は受注日を流用する", () => {
    const doc = buildOrderAcknowledgementDocument(BASE_SOURCE);
    expect(doc.issueDate).toBe("2026/07/09");
  });

  it("発行日を渡した場合はそれを issueDate に使う", () => {
    const doc = buildOrderAcknowledgementDocument(BASE_SOURCE, "2026/07/15");
    expect(doc.issueDate).toBe("2026/07/15");
    expect(doc.orderDate).toBe("2026/07/09");
  });
});
