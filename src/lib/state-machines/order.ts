/**
 * 受注ドメイン状態機械
 *
 * 仕様: docs/prd/order-state-machine.md
 *
 * 9状態 + 遷移マトリクスを集約し、ページ層から直接 status を書き換えることを禁止する。
 * 全遷移はイミュータブル更新（新しい Order を返す）かつ冪等（guard 違反時は no-op）。
 */

export type OrderStatus =
  | "新規受付"
  | "確認待ち"
  | "発売日時待ち"
  | "入金待ち"
  | "引当待ち"
  | "印刷待ち"
  | "印刷済み"
  | "出荷済み"
  | "キャンセル";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "新規受付",
  "確認待ち",
  "発売日時待ち",
  "入金待ち",
  "引当待ち",
  "印刷待ち",
  "印刷済み",
  "出荷済み",
  "キャンセル",
] as const;

/**
 * 受注に対して実行可能なアクション。
 * 各アクションは1本の遷移パスに対応する（auto / manual / scheduled の区別は呼び出し元が責務を持つ）。
 */
export type OrderAction =
  | "validate" // 新規受付 → 確認待ち（auto: 取り込みバリデーション通過）
  | "holdForReleaseDate" // 新規受付/確認待ち → 発売日時待ち（auto）
  | "releaseFromHold" // 発売日時待ち → 確認待ち（scheduled: 発売日時刻到達）
  | "requestPayment" // 確認待ち → 入金待ち（auto）
  | "confirmPayment" // 入金待ち → 引当待ち（manual）
  | "allocateInventory" // 引当待ち → 印刷待ち（auto: 引当成功）
  | "markInventoryShortage" // 引当待ち（errorBadge を立てる）。状態は変えない
  | "retryAllocation" // 引当待ち（errorBadge）→ 引当待ち（再試行）
  | "markPrinted" // 印刷待ち → 印刷済み（manual）
  | "registerShipment" // 印刷済み → 出荷済み（manual）
  | "cancel"; // 任意の状態（出荷済み除く）→ キャンセル（manual）

/**
 * 受注エンティティの状態機械が扱う最小フィールド集合。
 * 実エンティティ（DBレコード）には他にも金額・顧客・商品等が乗るが、
 * 状態遷移ロジックはこのインターフェースだけに依存する。
 */
export interface OrderState {
  status: OrderStatus;
  /** 在庫不足エラー表示用バッジ。引当待ちでのみ true になりうる。 */
  inventoryShortage?: boolean;
  /** 発売日時待ち中の解放予定時刻（ISO 8601）。発売日時待ち以外では undefined。 */
  releaseAt?: string;
}

/**
 * キャンセル可能な状態セット。出荷済みは返品処理（別フロー）に回す。
 */
const CANCELLABLE_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "新規受付",
  "確認待ち",
  "発売日時待ち",
  "入金待ち",
  "引当待ち",
  "印刷待ち",
  "印刷済み",
]);

export function isCancellable(status: OrderStatus): boolean {
  return CANCELLABLE_STATUSES.has(status);
}

/**
 * アクションに対応する期待 from 状態。複数許容される場合は配列で表現する。
 * guard 違反時は transitionOrder が no-op で元の order を返す（throw しない＝冪等）。
 */
const TRANSITION_GUARDS: Record<OrderAction, ReadonlyArray<OrderStatus>> = {
  validate: ["新規受付"],
  holdForReleaseDate: ["新規受付", "確認待ち"],
  releaseFromHold: ["発売日時待ち"],
  requestPayment: ["確認待ち"],
  confirmPayment: ["入金待ち"],
  allocateInventory: ["引当待ち"],
  markInventoryShortage: ["引当待ち"],
  retryAllocation: ["引当待ち"],
  markPrinted: ["印刷待ち"],
  registerShipment: ["印刷済み"],
  cancel: [
    "新規受付",
    "確認待ち",
    "発売日時待ち",
    "入金待ち",
    "引当待ち",
    "印刷待ち",
    "印刷済み",
  ],
};

interface TransitionOptions {
  /** holdForReleaseDate のときに渡す解放予定時刻 */
  releaseAt?: string;
}

/**
 * 受注の状態を遷移させる。
 *
 * - guard 違反時は no-op で元のオブジェクトをそのまま返す（参照同一性を保つ）
 * - 遷移成功時は新しい OrderState オブジェクトを返す（イミュータブル）
 *
 * @example
 *   const next = transitionOrder(order, "confirmPayment");
 *   if (next === order) {
 *     // ガード違反、すでに進んでいた等。再試行不要。
 *   }
 */
export function transitionOrder<T extends OrderState>(
  order: T,
  action: OrderAction,
  options: TransitionOptions = {},
): T {
  const allowedFrom = TRANSITION_GUARDS[action];
  if (!allowedFrom.includes(order.status)) {
    return order;
  }

  switch (action) {
    case "validate":
      return { ...order, status: "確認待ち", inventoryShortage: undefined, releaseAt: undefined };

    case "holdForReleaseDate":
      return { ...order, status: "発売日時待ち", releaseAt: options.releaseAt };

    case "releaseFromHold":
      return { ...order, status: "確認待ち", releaseAt: undefined };

    case "requestPayment":
      return { ...order, status: "入金待ち" };

    case "confirmPayment":
      return { ...order, status: "引当待ち", inventoryShortage: false };

    case "allocateInventory":
      return { ...order, status: "印刷待ち", inventoryShortage: false };

    case "markInventoryShortage":
      // 状態は引当待ちのまま、エラーバッジだけ立てる
      return { ...order, inventoryShortage: true };

    case "retryAllocation":
      // バッジを下ろして、外部の引当ハンドラの再試行を待つ
      return { ...order, inventoryShortage: false };

    case "markPrinted":
      return { ...order, status: "印刷済み" };

    case "registerShipment":
      return { ...order, status: "出荷済み" };

    case "cancel":
      return { ...order, status: "キャンセル", inventoryShortage: false };
  }
}

/**
 * UI 表示用のバッジクラス。`src/app/orders/page.tsx` 等で再利用する。
 * Liquid Glass 規約に従いグラデーション禁止、色は単色 tint のみ。
 */
export const orderStatusBadge: Record<OrderStatus, string> = {
  新規受付: "bg-blue-500/15 text-blue-700",
  確認待ち: "bg-yellow-500/15 text-yellow-700",
  発売日時待ち: "bg-violet-500/15 text-violet-700",
  入金待ち: "bg-amber-500/15 text-amber-700",
  引当待ち: "bg-orange-500/15 text-orange-700",
  印刷待ち: "bg-cyan-500/15 text-cyan-700",
  印刷済み: "bg-teal-500/15 text-teal-700",
  出荷済み: "bg-emerald-500/15 text-emerald-700",
  キャンセル: "bg-red-500/15 text-red-700",
};
