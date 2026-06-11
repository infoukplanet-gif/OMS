/**
 * 棚卸の負差異（減耗）→ 不良品台帳レコードの純粋ビルダー。
 *
 * 仕様: docs/prd/defective-stocktake-cascade-v1.md（方向①）
 *
 * 棚卸で実棚 < システム在庫だった分（不足数）を不良品台帳へ「監査記録」として積む。
 * - status は最初から "振替完了"（既に物理的に失われている）
 * - source は "stocktake"（手動振替と区別）
 * - 在庫 onHand の減算は棚卸ページの confirmDiff() が担う。ここで作る記録は
 *   在庫を二重減算しない（cascade の execute 遷移対象にもならない）。
 *
 * Date を持たない純関数。登録日時・登録者・id 接頭辞は呼び出し側が渡す。
 */

import type { DefectiveRecord } from "../state-machines/defective";

export interface ShrinkageLine {
  sku: string;
  warehouse: string;
  product: string;
  /** 不足数（システム在庫 − 実棚）。正の値のみ減耗として扱う。 */
  qty: number;
}

export interface ShrinkageMeta {
  registeredAt: string;
  registeredBy: string;
  /** 生成 id の接頭辞。`${idPrefix}-001` の形で連番を振る。 */
  idPrefix: string;
}

export function buildShrinkageDefectives(
  lines: ReadonlyArray<ShrinkageLine>,
  meta: ShrinkageMeta,
): DefectiveRecord[] {
  return lines
    .filter((line) => line.qty > 0)
    .map((line, index) => ({
      id: `${meta.idPrefix}-${String(index + 1).padStart(3, "0")}`,
      order: "—",
      product: line.product,
      sku: line.sku,
      warehouse: line.warehouse,
      qty: line.qty,
      reason: "棚卸減耗",
      route: "廃棄",
      source: "stocktake" as const,
      registeredAt: meta.registeredAt,
      registeredBy: meta.registeredBy,
      status: "振替完了" as const,
    }));
}
