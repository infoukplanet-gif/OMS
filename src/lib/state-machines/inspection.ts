/**
 * バーコード検品のライフサイクル状態機械 + スキャン解決ロジック。
 *
 * 受注単位の検品セッション（対象SKUごとの必要数/スキャン済み数）を管理する。
 * 全SKUが必要数に達した時のみ「検品完了」へ遷移できる。
 *
 * 操作:
 * - complete: 検品中 → 検品完了（全SKUがスキャン済みの時のみ。未達なら no-op）
 *
 * ページ側で `{ ...record, status }` のように status を直書きしない。必ず
 * transitionInspection(record, action) を経由する。スキャン1件の反映も
 * resolveScan(record, code) を経由して新レコードを得る（scanned を直接 ++ しない）。
 */

export type InspectionStatus = "検品中" | "検品完了";

export type InspectionAction = "complete";

export type ScanResult = "ok" | "ng" | "duplicate";

export interface InspectionItem {
  sku: string;
  name: string;
  /** 受注上の必要数 */
  required: number;
  /** スキャン済み数 */
  scanned: number;
}

export interface InspectionRecord {
  /** 受注番号をキーにする */
  id: string;
  items: InspectionItem[];
  status: InspectionStatus;
  /** createMasterStore（MasterRecord）互換のためのインデックスシグネチャ。 */
  [extra: string]: unknown;
}

const TRANSITIONS: Record<
  InspectionStatus,
  Partial<Record<InspectionAction, InspectionStatus>>
> = {
  検品中: { complete: "検品完了" },
  検品完了: {},
};

export function nextInspectionStatus(
  status: InspectionStatus,
  action: InspectionAction,
): InspectionStatus | null {
  return TRANSITIONS[status][action] ?? null;
}

export function canTransitionInspection(
  status: InspectionStatus,
  action: InspectionAction,
): boolean {
  return nextInspectionStatus(status, action) !== null;
}

/** 全SKUが必要数に達しているか（アイテム空は未完了扱い）。 */
export function isInspectionComplete(record: InspectionRecord): boolean {
  return (
    record.items.length > 0 &&
    record.items.every((i) => i.scanned >= i.required)
  );
}

/**
 * 遷移を適用した新レコードを返す。
 * 不正遷移、または complete ガード（全SKU未スキャン）不成立の場合は
 * 同一参照をそのまま返す（no-op）。
 */
export function transitionInspection(
  record: InspectionRecord,
  action: InspectionAction,
): InspectionRecord {
  const target = nextInspectionStatus(record.status, action);
  if (target === null) return record;
  if (action === "complete" && !isInspectionComplete(record)) return record;
  return { ...record, status: target };
}

export interface ScanResolution {
  result: ScanResult;
  /** ok の時は scanned を1増やした新レコード、それ以外は同一参照。 */
  record: InspectionRecord;
  /** ok の時のスキャン対象商品名。 */
  itemName?: string;
  /** ng / duplicate の補足。 */
  detail?: string;
}

/**
 * バーコード1件を検品レコードに反映する純粋関数。
 * - 受注外SKU → ng（同一参照）
 * - 既定数超過 → duplicate（同一参照）
 * - 受注内かつ未達 → ok（scanned を1増やした新レコード）
 */
export function resolveScan(
  record: InspectionRecord,
  rawCode: string,
): ScanResolution {
  const code = rawCode.trim().toUpperCase();
  const target = record.items.find((i) => i.sku === code);
  if (!target) return { result: "ng", record, detail: "受注外SKU" };
  if (target.scanned >= target.required) {
    return { result: "duplicate", record, detail: "既定数を超過" };
  }
  const items = record.items.map((i) =>
    i.sku === code ? { ...i, scanned: i.scanned + 1 } : i,
  );
  return { result: "ok", record: { ...record, items }, itemName: target.name };
}
