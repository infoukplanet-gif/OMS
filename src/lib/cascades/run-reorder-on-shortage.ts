/**
 * 欠品 → 発注 自動連鎖のUI向けグルー。
 *
 * 純粋 cascade（reorder-on-shortage.ts）はストア注入でテスト可能に保ち、グローバル
 * シングルトンと SKU マスタ（仕入先 / 原価）の読み取りはこの薄い層に閉じ込める。
 * 引当自動実行ページ・発注計算ページは、一括引当のあと欠品が残ったらこの1関数を呼ぶだけでよい。
 *
 * 数量算定は「両方併用」、起票は「未発行PO自動起票」、冪等性は「既存未発行POへマージ」
 * （インタビュー回答 2026-07-09）。副作用は purchaseStore への追記/更新のみ。
 */

import { orderStore } from "../stores/orders";
import { inventoryStore } from "../stores/inventory";
import { purchaseStore } from "../stores/purchase";
import { SKU_SUPPLIER, SKU_UNIT_COST } from "../seeds/inventory";
import {
  runReorderOnShortage,
  type ReorderOnShortageResult,
} from "./reorder-on-shortage";

/** 起票日・年を決定するローカル日付ヘルパー（PO id の年 / date 欄に使う）。 */
function todayParts(): { today: string; year: number } {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    today: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    year: d.getFullYear(),
  };
}

/**
 * グローバルストア上で、引当待ちに残った欠品受注から未発行 PO を自動起票／マージする。
 * 欠品が無ければストアは更新せず shortageSkus=0 を返す。再実行しても冪等（created/merged=0）。
 */
export function runReorderOnShortageGlobal(): ReorderOnShortageResult {
  const { today, year } = todayParts();
  return runReorderOnShortage(
    { orderStore, inventoryStore, purchaseStore },
    { maps: { supplier: SKU_SUPPLIER, unitCost: SKU_UNIT_COST }, today, year },
  );
}
