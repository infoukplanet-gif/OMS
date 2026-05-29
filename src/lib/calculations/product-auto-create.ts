/**
 * 商品マスタ自動作成（受注取込時の未登録SKU検出）の pure ロジック。
 *
 * 仕様（2026-05-29 セッションで確定）:
 * - 発火: 受注取込の取込実行時（orders/import の confirmImport）
 * - 失敗時: 不正行はスキップし正常行のみ生成（取込全体は止めない）
 * - 冪等性: skipConflict=ON で既存SKUはスキップ、OFF で上書き。SKU が一意キーなので
 *   同じ入力を何度流しても作成対象が安定する。
 * - 手動オーバーライド: autoDetect=OFF で自動作成を全停止（未登録は受注エラー扱い）。
 *
 * UI（productStore.upsert）への副作用は持たず、作成/更新/スキップの計画だけを返す。
 */

import type { ProductRecord } from "@/lib/stores/product";
import { applyCategoryConversion, type ConversionRule } from "./category-conversion";

/** 受注取込のプレビュー1行から、自動作成に必要な情報を抜き出した型。 */
export interface ImportProductRow {
  skuCode: string;
  productName: string;
  price: number;
  /** 入手元（楽天市場 / Amazon / Yahoo!ショッピング 等）。enabledSources と突き合わせる。 */
  source: string;
  /** モール側カテゴリ表記（autoCategorize 用・任意）。 */
  externalCategory?: string;
  /** 取込バリデーション結果。"error" は不正行として除外。 */
  status?: "ok" | "warning" | "error";
}

/** products/auto-create ページの設定を pure ロジックに渡す形へ正規化したもの。 */
export interface ProductAutoCreateSettings {
  /** 未登録商品を自動検出するか（OFF なら全停止）。 */
  autoDetect: boolean;
  /** 既存コードと衝突する場合にスキップするか（OFF なら上書き）。 */
  skipConflict: boolean;
  /** モールカテゴリ → 自社カテゴリの自動マッピングを行うか。 */
  autoCategorize: boolean;
  /** デフォルト原価率（%）。原価 = 価格 × (1 - 原価率/100)。 */
  defaultMargin: number;
  /** 自動作成を有効化したソース一覧（取得元別ルールの enabled=true）。 */
  enabledSources: ReadonlyArray<string>;
  /** カテゴリ未マッチ・autoCategorize=OFF 時のフォールバックカテゴリ。 */
  defaultCategory: string;
}

export type SkipReason =
  | "自動検出OFF"
  | "対象外ソース"
  | "不正行"
  | "重複行"
  | "既存スキップ";

export interface AutoCreateSkip {
  sku: string;
  reason: SkipReason;
}

export interface AutoCreateResult {
  /** 新規作成すべき商品（productStore に未存在）。 */
  created: ProductRecord[];
  /** skipConflict=false で上書きする既存商品。 */
  updated: ProductRecord[];
  /** 作成・更新しなかった行と理由。 */
  skipped: AutoCreateSkip[];
}

/** 原価率を 0〜100% にクランプ。非数値は 0%（原価=価格）扱い。 */
function clampMargin(margin: number): number {
  if (!Number.isFinite(margin)) return 0;
  return Math.min(100, Math.max(0, margin));
}

/**
 * 受注取込行から、自動作成すべき商品マスタの計画を組み立てる。
 *
 * @param rows           取込プレビュー行
 * @param settings       自動作成設定（products/auto-create）
 * @param existingCodes  既存商品コード（productStore.getState() の code 群）
 * @param categoryRules  カテゴリ変換ルール（autoCategorize 用・既定は空）
 */
export function buildAutoCreatedProducts(
  rows: ReadonlyArray<ImportProductRow>,
  settings: ProductAutoCreateSettings,
  existingCodes: ReadonlyArray<string>,
  categoryRules: ReadonlyArray<ConversionRule> = [],
): AutoCreateResult {
  const created: ProductRecord[] = [];
  const updated: ProductRecord[] = [];
  const skipped: AutoCreateSkip[] = [];

  // 手動オーバーライド: 自動検出 OFF なら 1 件も作成せず全行をスキップ扱い。
  if (!settings.autoDetect) {
    return {
      created,
      updated,
      skipped: rows.map((r) => ({ sku: r.skuCode.trim(), reason: "自動検出OFF" as const })),
    };
  }

  const existing = new Set(existingCodes);
  const seenInBatch = new Set<string>();
  const margin = clampMargin(settings.defaultMargin);

  for (const r of rows) {
    const sku = r.skuCode.trim();

    // 不正行: error ステータス / SKU空 / 商品名空 / 価格<=0 は除外（取込は継続）。
    if (r.status === "error" || sku === "" || r.productName.trim() === "" || r.price <= 0) {
      skipped.push({ sku, reason: "不正行" });
      continue;
    }

    if (!settings.enabledSources.includes(r.source)) {
      skipped.push({ sku, reason: "対象外ソース" });
      continue;
    }

    // バッチ内重複: 先頭行のみ採用（先勝ち）。
    if (seenInBatch.has(sku)) {
      skipped.push({ sku, reason: "重複行" });
      continue;
    }
    seenInBatch.add(sku);

    const isExisting = existing.has(sku);
    if (isExisting && settings.skipConflict) {
      skipped.push({ sku, reason: "既存スキップ" });
      continue;
    }

    const mapped =
      settings.autoCategorize && r.externalCategory
        ? applyCategoryConversion(r.externalCategory, r.source, categoryRules)
        : null;

    const record: ProductRecord = {
      code: sku,
      name: r.productName.trim(),
      category: mapped ?? settings.defaultCategory,
      price: r.price,
      cost: Math.round(r.price * (1 - margin / 100)),
      status: "販売中",
    };

    if (isExisting) updated.push(record);
    else created.push(record);
  }

  return { created, updated, skipped };
}
