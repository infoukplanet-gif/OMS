/**
 * 商品マスタ自動作成の設定（モジュール内シングルトン）。
 *
 * 仕様: src/lib/calculations/product-auto-create.ts のヘッダ参照。
 *
 * - `products/auto-create` ページのトグル・原価率・取得元別ルールがここを書き換える
 * - `orders/import` の confirmImport が getProductAutoCreateSettings() を読み、
 *   buildAutoCreatedProducts に渡すことで未登録SKUを商品マスタへ自動作成する
 * - v1 はブラウザ module スコープでの保持（リロードで初期化）。永続化は v2 で server action + DB
 *
 * テストは reset → 操作 → 検証の順で書く（singleton なので beforeEach での明示 reset 必須）。
 */

import type { ProductAutoCreateSettings } from "@/lib/calculations/product-auto-create";

export const DEFAULT_AUTO_CREATE_SETTINGS: ProductAutoCreateSettings = {
  autoDetect: true,
  skipConflict: true,
  autoCategorize: true,
  defaultMargin: 30,
  enabledSources: ["楽天市場", "Yahoo!ショッピング", "自社EC（Shopify）"],
  defaultCategory: "未分類",
};

let settings: ProductAutoCreateSettings = { ...DEFAULT_AUTO_CREATE_SETTINGS };

/** 現在の設定のコピーを返す（呼び出し元の mutation で内部状態が壊れないように）。 */
export function getProductAutoCreateSettings(): ProductAutoCreateSettings {
  return { ...settings, enabledSources: [...settings.enabledSources] };
}

/** 部分的に上書き。指定しなかった key は維持。 */
export function setProductAutoCreateSettings(patch: Partial<ProductAutoCreateSettings>): void {
  settings = {
    ...settings,
    ...patch,
    enabledSources: patch.enabledSources ? [...patch.enabledSources] : settings.enabledSources,
  };
}

/** デフォルトに戻す（テスト用 + 「初期値に戻す」用）。 */
export function resetProductAutoCreateSettings(): void {
  settings = { ...DEFAULT_AUTO_CREATE_SETTINGS };
}
