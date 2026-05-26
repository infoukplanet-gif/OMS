/**
 * 顧客返品ドメイン状態機械
 *
 * 仕様: docs/prd/return-state-machine.md
 *
 * 受注ライフサイクルの逆フロー。出荷済み（配達完了含む）の受注に対して
 * 顧客から返品申請が起き、承認 → 返送品到着 → 検品 → 返品完了 と進む。
 *
 * 連動の起点は「返品完了」到達のみ:
 *   - 検品で良品判定された数量（restockQty）だけ在庫へ戻す
 *   - 返金予定額（refundAmount）を payment ドメインへ起票する
 * 連鎖の実行は handler / store / page の責務（この SM は記述子の素材を持つだけ）。
 *
 * 全遷移はイミュータブル更新（新しい ReturnState を返す）かつ冪等（guard 違反時は no-op）。
 */

export type ReturnStatus =
  | "返品依頼" // 顧客からの返品申請受付
  | "返品承認" // オペレーター承認・返送先案内済み
  | "検品中" // 返送品到着・検品中
  | "返品完了" // 検品完了 → 在庫戻し＋返金起票
  | "却下"; // 返品不可（申請却下／検品 NG）

export const RETURN_STATUSES: readonly ReturnStatus[] = [
  "返品依頼",
  "返品承認",
  "検品中",
  "返品完了",
  "却下",
] as const;

/**
 * 返品に対して実行可能なアクション。
 * - approve: 返品依頼 → 返品承認
 * - receiveItems: 返品承認 → 検品中（返送品到着スキャン）
 * - completeInspection: 検品中 → 返品完了（良品数量を確定）
 * - reject: 返品依頼 / 検品中 → 却下
 */
export type ReturnAction =
  | "approve"
  | "receiveItems"
  | "completeInspection"
  | "reject";

/**
 * 返品明細。1 返品が複数 SKU を含み得る。
 * restockQty は検品で良品判定された数量で、completeInspection で確定する（検品前は 0）。
 */
export interface ReturnLine {
  sku: string;
  warehouse: string;
  /** 顧客が返品申請した数量 */
  qty: number;
  /** 検品で良品（再販可能）と判定された数量。これだけ在庫に戻す。 */
  restockQty: number;
}

/**
 * 返品エンティティの状態機械が扱う最小フィールド集合。
 * 実エンティティには返品理由・申請日・担当者・写真等が乗るが、遷移ロジックはこれだけに依存する。
 */
export interface ReturnState {
  status: ReturnStatus;
  /** 元の受注番号（返金・突合に使用）。 */
  orderId: string;
  lines: ReturnLine[];
  /** 返金予定額。返品完了で payment ドメインへ渡す。0 なら返金なし。 */
  refundAmount: number;
}

/** 却下可能な状態セット。返品完了後・却下後は再度却下できない。 */
const REJECTABLE_STATUSES: ReadonlySet<ReturnStatus> = new Set<ReturnStatus>([
  "返品依頼",
  "検品中",
]);

export function isReturnRejectable(status: ReturnStatus): boolean {
  return REJECTABLE_STATUSES.has(status);
}

/**
 * アクションに対応する期待 from 状態。guard 違反時は no-op で元の参照を返す（冪等）。
 */
const TRANSITION_GUARDS: Record<ReturnAction, ReadonlyArray<ReturnStatus>> = {
  approve: ["返品依頼"],
  receiveItems: ["返品承認"],
  completeInspection: ["検品中"],
  reject: ["返品依頼", "検品中"],
};

/** 検品で確定する良品数量（sku + warehouse 単位）。 */
export interface InspectedGoodQty {
  sku: string;
  warehouse: string;
  goodQty: number;
}

interface TransitionOptions {
  /**
   * completeInspection 時の良品判定数量。
   * 指定が無い line は restockQty=0（＝全数不良で在庫に戻さない）。
   * goodQty は 0..line.qty にクランプされる。
   */
  inspectedGoodQty?: ReadonlyArray<InspectedGoodQty>;
}

const keyOf = (sku: string, warehouse: string): string => `${sku} ${warehouse}`;

/** completeInspection: inspectedGoodQty を line.restockQty に反映した新しい lines を返す。 */
function applyInspection(
  lines: ReadonlyArray<ReturnLine>,
  inspected: ReadonlyArray<InspectedGoodQty>,
): ReturnLine[] {
  const goodByKey = new Map<string, number>();
  for (const g of inspected) {
    goodByKey.set(keyOf(g.sku, g.warehouse), g.goodQty);
  }
  return lines.map((line) => {
    const good = goodByKey.get(keyOf(line.sku, line.warehouse)) ?? 0;
    const restockQty = Math.max(0, Math.min(good, line.qty));
    return { ...line, restockQty };
  });
}

/**
 * 返品の状態を遷移させる。
 *
 * - guard 違反時は no-op で元のオブジェクトをそのまま返す（参照同一性を保つ）
 * - 遷移成功時は新しい ReturnState を返す（イミュータブル）
 */
export function transitionReturn<T extends ReturnState>(
  ret: T,
  action: ReturnAction,
  options: TransitionOptions = {},
): T {
  const allowedFrom = TRANSITION_GUARDS[action];
  if (!allowedFrom.includes(ret.status)) {
    return ret;
  }

  switch (action) {
    case "approve":
      return { ...ret, status: "返品承認" };

    case "receiveItems":
      return { ...ret, status: "検品中" };

    case "completeInspection":
      return {
        ...ret,
        status: "返品完了",
        lines: applyInspection(ret.lines, options.inspectedGoodQty ?? []),
      };

    case "reject":
      return { ...ret, status: "却下" };
  }
}

/**
 * UI 表示用のバッジクラス。`src/app/returns/page.tsx` 等で再利用する。
 * Liquid Glass 規約に従いグラデーション禁止、色は単色 tint のみ。
 */
export const returnStatusBadge: Record<ReturnStatus, string> = {
  返品依頼: "bg-slate-500/15 text-slate-700",
  返品承認: "bg-blue-500/15 text-blue-700",
  検品中: "bg-amber-500/15 text-amber-700",
  返品完了: "bg-emerald-500/15 text-emerald-700",
  却下: "bg-red-500/15 text-red-700",
};
