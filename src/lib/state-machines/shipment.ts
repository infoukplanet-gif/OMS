/**
 * 出荷ドメイン状態機械
 *
 * 仕様: docs/prd/shipment-state-machine.md
 *
 * 8状態 + 遷移マトリクスを集約。Order とは独立したエンティティとして扱い、
 * 1 Shipment が複数 Order をまとめ得る将来の分納に備えて orderIds は配列で保持する（v1 は要素数1）。
 * 全遷移はイミュータブル更新（新しい Shipment を返す）かつ冪等（guard 違反時は no-op）。
 */

export type ShipmentStatus =
  | "出荷指示作成"
  | "ピッキング待ち"
  | "検品待ち"
  | "出荷待ち"
  | "出荷済み"
  | "配送中"
  | "配達完了"
  | "キャンセル";

export const SHIPMENT_STATUSES: readonly ShipmentStatus[] = [
  "出荷指示作成",
  "ピッキング待ち",
  "検品待ち",
  "出荷待ち",
  "出荷済み",
  "配送中",
  "配達完了",
  "キャンセル",
] as const;

/**
 * Shipment に対して実行可能なアクション。
 * auto / manual / external（CSV取込・WMS API）の区別は呼び出し元の責務。
 */
export type ShipmentAction =
  | "startPicking" // 出荷指示作成 → ピッキング待ち（auto: 倉庫キュー投入）
  | "completePicking" // ピッキング待ち → 検品待ち（manual: 倉庫スタッフ）
  | "passInspection" // 検品待ち → 出荷待ち（manual: バーコード検品OK）
  | "failInspection" // 検品待ち → ピッキング待ち（manual: 検品NG、再ピッキング）
  | "confirmShipment" // 出荷待ち → 出荷済み（manual: 伝票番号入力）
  | "markInTransit" // 出荷済み → 配送中（external: 業者集荷スキャン or CSV）
  | "markDelivered" // 配送中 → 配達完了（external: 業者APIまたはCSV）
  | "cancel"; // 出荷済み到達前のいずれか → キャンセル（manual）

/**
 * 出荷伝票エンティティの状態機械が扱う最小フィールド集合。
 * 実エンティティには発送方法・伝票番号・配送業者・住所等が乗るが、
 * 遷移ロジックはこのインターフェースだけに依存する。
 */
export interface ShipmentState {
  status: ShipmentStatus;
  /** 紐付く受注番号。v1 は要素数1で固定、将来の分納で複数になる。 */
  orderIds: string[];
  /** 出荷確定時に確定する伝票番号。出荷待ち以前は undefined。 */
  trackingNumber?: string;
}

/**
 * キャンセル可能な状態セット。出荷済み到達後は返品処理（別フロー）に回す。
 */
const CANCELLABLE_STATUSES: ReadonlySet<ShipmentStatus> = new Set<ShipmentStatus>([
  "出荷指示作成",
  "ピッキング待ち",
  "検品待ち",
  "出荷待ち",
]);

export function isShipmentCancellable(status: ShipmentStatus): boolean {
  return CANCELLABLE_STATUSES.has(status);
}

/**
 * Order が「引当待ち」に到達した時の自動連鎖から呼ばれる Shipment 生成関数。
 * v1 では 1 Order : 1 Shipment 固定だが、orderIds は将来の分納に備えて配列で保持。
 */
export function createShipmentForOrder(orderId: string): ShipmentState {
  return {
    status: "出荷指示作成",
    orderIds: [orderId],
  };
}

/**
 * アクションに対応する期待 from 状態。複数許容される場合は配列で表現する。
 * guard 違反時は transitionShipment が no-op で元の shipment を返す（throw しない＝冪等）。
 */
const TRANSITION_GUARDS: Record<ShipmentAction, ReadonlyArray<ShipmentStatus>> = {
  startPicking: ["出荷指示作成"],
  completePicking: ["ピッキング待ち"],
  passInspection: ["検品待ち"],
  failInspection: ["検品待ち"],
  confirmShipment: ["出荷待ち"],
  markInTransit: ["出荷済み"],
  markDelivered: ["配送中"],
  cancel: ["出荷指示作成", "ピッキング待ち", "検品待ち", "出荷待ち"],
};

interface TransitionOptions {
  /** confirmShipment のときに渡す伝票番号 */
  trackingNumber?: string;
}

/**
 * 出荷の状態を遷移させる。
 *
 * - guard 違反時は no-op で元のオブジェクトをそのまま返す（参照同一性を保つ）
 * - 遷移成功時は新しい ShipmentState オブジェクトを返す（イミュータブル）
 *
 * @example
 *   const next = transitionShipment(shipment, "passInspection");
 *   if (next === shipment) {
 *     // 二重スキャン等。再試行不要。
 *   }
 */
export function transitionShipment<T extends ShipmentState>(
  shipment: T,
  action: ShipmentAction,
  options: TransitionOptions = {},
): T {
  const allowedFrom = TRANSITION_GUARDS[action];
  if (!allowedFrom.includes(shipment.status)) {
    return shipment;
  }

  switch (action) {
    case "startPicking":
      return { ...shipment, status: "ピッキング待ち" };

    case "completePicking":
      return { ...shipment, status: "検品待ち" };

    case "passInspection":
      return { ...shipment, status: "出荷待ち" };

    case "failInspection":
      return { ...shipment, status: "ピッキング待ち" };

    case "confirmShipment":
      return { ...shipment, status: "出荷済み", trackingNumber: options.trackingNumber };

    case "markInTransit":
      return { ...shipment, status: "配送中" };

    case "markDelivered":
      return { ...shipment, status: "配達完了" };

    case "cancel":
      return { ...shipment, status: "キャンセル" };
  }
}

/**
 * UI 表示用のバッジクラス。`src/app/shipments/page.tsx` 等で再利用する。
 * Liquid Glass 規約に従いグラデーション禁止、色は単色 tint のみ。
 */
export const shipmentStatusBadge: Record<ShipmentStatus, string> = {
  出荷指示作成: "bg-slate-500/15 text-slate-700",
  ピッキング待ち: "bg-amber-500/15 text-amber-700",
  検品待ち: "bg-yellow-500/15 text-yellow-700",
  出荷待ち: "bg-orange-500/15 text-orange-700",
  出荷済み: "bg-blue-500/15 text-blue-700",
  配送中: "bg-purple-500/15 text-purple-700",
  配達完了: "bg-emerald-500/15 text-emerald-700",
  キャンセル: "bg-red-500/15 text-red-700",
};
