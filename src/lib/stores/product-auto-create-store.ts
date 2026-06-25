/**
 * 商品自動作成設定 共有マスタストア（single-config 1-record パターン）。
 *
 * products/auto-create ページの全体オプション（自動検出/画像取込/管理者通知/
 * 重複スキップ/自動カテゴリ/既定利益率）と、取得ルール（R-01..R-05）の有効フラグを
 * id 固定の 1 レコードとして createMasterStore に載せ、リロード後も復元する。
 *
 * 永続化（domain: "product-auto-create-settings"）の正規オーナーページは
 * src/app/products/auto-create/page.tsx。
 *
 * runtime の自動作成挙動は従来どおり src/lib/products/auto-create-settings.ts の
 * シングルトン（setProductAutoCreateSettings）が担う。オーナーページが hydrate / save 時に
 * 有効ルールの仕入元から enabledSources を導出してシングルトンへ橋渡しする
 * （テスト済みの同期 API は不変）。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface ProductAutoCreateFields {
  autoDetect: boolean;
  downloadImage: boolean;
  notifyAdmin: boolean;
  skipConflict: boolean;
  autoCategorize: boolean;
  defaultMargin: number;
  /** ルール id -> 有効フラグ。 */
  ruleEnabled: Record<string, boolean>;
}

export interface ProductAutoCreateRecord extends ProductAutoCreateFields {
  id: string;
  [extra: string]: unknown;
}

/** ルールの既定有効状態（INITIAL_RULES の enabled を踏襲。enabledSources と整合）。 */
const DEFAULT_RULE_ENABLED: Record<string, boolean> = {
  "R-01": true,
  "R-02": true,
  "R-03": false,
  "R-04": true,
  "R-05": false,
};

export const DEFAULT_PRODUCT_AUTO_CREATE: ProductAutoCreateFields = {
  autoDetect: true,
  downloadImage: true,
  notifyAdmin: false,
  skipConflict: true,
  autoCategorize: true,
  defaultMargin: 30,
  ruleEnabled: { ...DEFAULT_RULE_ENABLED },
};

export const INITIAL_PRODUCT_AUTO_CREATE: ProductAutoCreateRecord[] = [
  { id: "config", ...DEFAULT_PRODUCT_AUTO_CREATE },
];

export const productAutoCreateStore: MasterStore<ProductAutoCreateRecord> =
  createMasterStore<ProductAutoCreateRecord>(INITIAL_PRODUCT_AUTO_CREATE);
