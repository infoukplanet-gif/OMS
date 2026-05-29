import { describe, it, expect, beforeEach } from "vitest";
import {
  getProductAutoCreateSettings,
  setProductAutoCreateSettings,
  resetProductAutoCreateSettings,
  DEFAULT_AUTO_CREATE_SETTINGS,
} from "./auto-create-settings";
import { createProductStore } from "@/lib/stores/product";
import { buildAutoCreatedProducts, type ImportProductRow } from "@/lib/calculations/product-auto-create";

beforeEach(() => {
  resetProductAutoCreateSettings();
});

describe("auto-create-settings シングルトン", () => {
  it("初期値はデフォルトと一致し、getter は防御的コピーを返す", () => {
    const a = getProductAutoCreateSettings();
    expect(a).toEqual(DEFAULT_AUTO_CREATE_SETTINGS);
    (a.enabledSources as string[]).push("改ざん");
    expect(getProductAutoCreateSettings().enabledSources).not.toContain("改ざん");
  });

  it("部分上書きは指定 key のみ反映し、他は維持する", () => {
    setProductAutoCreateSettings({ autoDetect: false, defaultMargin: 40 });
    const s = getProductAutoCreateSettings();
    expect(s.autoDetect).toBe(false);
    expect(s.defaultMargin).toBe(40);
    expect(s.skipConflict).toBe(DEFAULT_AUTO_CREATE_SETTINGS.skipConflict);
  });
});

describe("受注取込→商品マスタ自動作成 統合（confirmImport が行う処理を再現）", () => {
  function runImport(rows: ImportProductRow[], store: ReturnType<typeof createProductStore>) {
    const settings = getProductAutoCreateSettings();
    const plan = buildAutoCreatedProducts(rows, settings, store.getState().map((p) => p.code));
    for (const rec of [...plan.created, ...plan.updated]) store.upsert(rec);
    return plan;
  }

  it("未登録SKUが商品マスタに追加され、既存SKUは skipConflict に従ってスキップされる", () => {
    const store = createProductStore([
      { code: "WEP-001", name: "既存イヤホン", category: "オーディオ", price: 12800, cost: 9000, status: "販売中" },
    ]);
    setProductAutoCreateSettings({ enabledSources: ["楽天市場"], autoCategorize: false });

    const plan = runImport(
      [
        { skuCode: "WEP-001", productName: "ワイヤレスイヤホン Pro", price: 12800, source: "楽天市場", status: "ok" },
        { skuCode: "BTS-008", productName: "Bluetoothスピーカー", price: 7000, source: "楽天市場", status: "ok" },
        { skuCode: "", productName: "商品名空", price: 0, source: "楽天市場", status: "error" },
      ],
      store,
    );

    // 新規 BTS-008 が追加され、既存 WEP-001 はスキップ、不正行は除外
    expect(store.findByCode("BTS-008")).toMatchObject({ name: "Bluetoothスピーカー", status: "販売中" });
    expect(plan.created.map((p) => p.code)).toEqual(["BTS-008"]);
    expect(plan.skipped.some((s) => s.sku === "WEP-001" && s.reason === "既存スキップ")).toBe(true);
    // 既存マスタは上書きされない
    expect(store.findByCode("WEP-001")?.name).toBe("既存イヤホン");
    // ストア件数: 既存1 + 新規1
    expect(store.getState()).toHaveLength(2);
  });

  it("autoDetect=OFF なら取込しても商品マスタは一切増えない", () => {
    const store = createProductStore([]);
    setProductAutoCreateSettings({ autoDetect: false, enabledSources: ["楽天市場"] });
    runImport(
      [{ skuCode: "NEW-1", productName: "新商品", price: 1000, source: "楽天市場", status: "ok" }],
      store,
    );
    expect(store.getState()).toHaveLength(0);
  });
});
