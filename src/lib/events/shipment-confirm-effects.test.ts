import { describe, expect, it } from "vitest";
import {
  onShipmentConfirmed,
  resolveMallChannel,
  type ShipmentConfirmContext,
} from "./shipment-confirm-effects";

function ctx(overrides: Partial<ShipmentConfirmContext> = {}): ShipmentConfirmContext {
  return {
    shipmentId: "ORD-2026-08851",
    orderId: "ORD-2026-08851",
    shop: "楽天店",
    customer: "山田 太郎",
    carrier: "ヤマト運輸",
    warehouse: "東京本社倉庫",
    trackingNumber: "TRK-123",
    actor: "システム",
    ...overrides,
  };
}

describe("resolveMallChannel — 店舗名からモールチャネルを判定", () => {
  it("楽天店 / 楽天市場 は rakuten", () => {
    expect(resolveMallChannel("楽天店")?.code).toBe("rakuten");
    expect(resolveMallChannel("楽天市場")?.code).toBe("rakuten");
  });

  it("Yahoo!店 / Yahoo! は yahoo", () => {
    expect(resolveMallChannel("Yahoo!店")?.code).toBe("yahoo");
    expect(resolveMallChannel("Yahoo!")?.code).toBe("yahoo");
  });

  it("Amazon店 / Amazon は amazon", () => {
    expect(resolveMallChannel("Amazon店")?.code).toBe("amazon");
    expect(resolveMallChannel("Amazon")?.code).toBe("amazon");
  });

  it("自社店舗（本店 / 本社 / Shopify）は null（モール外）", () => {
    expect(resolveMallChannel("本店")).toBeNull();
    expect(resolveMallChannel("本社")).toBeNull();
    expect(resolveMallChannel("Shopify")).toBeNull();
    expect(resolveMallChannel("")).toBeNull();
  });

  it("モール判定にはわかりやすい日本語ラベルが付く", () => {
    expect(resolveMallChannel("楽天店")?.label).toBe("楽天市場");
    expect(resolveMallChannel("Yahoo!店")?.label).toBe("Yahoo!ショッピング");
    expect(resolveMallChannel("Amazon店")?.label).toBe("Amazon");
  });
});

describe("onShipmentConfirmed — 出荷確定の追加副作用記述子", () => {
  it("モール受注は出荷通知データ記述子を生成する（楽天/Yahoo!/Amazon）", () => {
    const effects = onShipmentConfirmed(ctx({ shop: "楽天店" }));
    expect(effects.mallNotification).toMatchObject({
      shipmentId: "ORD-2026-08851",
      orderId: "ORD-2026-08851",
      mall: "rakuten",
      mallLabel: "楽天市場",
      customer: "山田 太郎",
      carrier: "ヤマト運輸",
      trackingNumber: "TRK-123",
    });
  });

  it("自社店舗（本店）はモール出荷通知記述子を生成しない", () => {
    const effects = onShipmentConfirmed(ctx({ shop: "本店" }));
    expect(effects.mallNotification).toBeUndefined();
  });

  it("倉庫委託先への確定報告（FTP配信）記述子は倉庫が判明していれば常に生成する", () => {
    const effects = onShipmentConfirmed(ctx({ shop: "本店", warehouse: "東京本社倉庫" }));
    expect(effects.warehouseFtp).toMatchObject({
      shipmentId: "ORD-2026-08851",
      orderId: "ORD-2026-08851",
      warehouse: "東京本社倉庫",
    });
    expect(effects.warehouseFtp?.fileName).toContain("ORD-2026-08851");
  });

  it("倉庫が不明な場合は FTP配信記述子を生成しない", () => {
    const effects = onShipmentConfirmed(ctx({ warehouse: "" }));
    expect(effects.warehouseFtp).toBeUndefined();
  });

  it("出荷確定の監査ログ記述子は常に生成する", () => {
    const effects = onShipmentConfirmed(ctx({ shop: "本店", warehouse: "" }));
    expect(effects.auditLog).toMatchObject({
      shipmentId: "ORD-2026-08851",
      orderId: "ORD-2026-08851",
      actor: "システム",
    });
    expect(effects.auditLog?.detail).toContain("山田 太郎");
  });

  it("orderId が無くても監査ログだけは残す（出荷自体の確定記録）", () => {
    const effects = onShipmentConfirmed(ctx({ orderId: undefined, shop: "本店", warehouse: "" }));
    expect(effects.auditLog).toBeDefined();
    expect(effects.mallNotification).toBeUndefined();
    expect(effects.warehouseFtp).toBeUndefined();
  });
});
