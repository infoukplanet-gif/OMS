/**
 * 拠点・倉庫マスタの設定（モジュール内シングルトン）。
 *
 * - `settings/warehouses` ページが書き換える
 * - 出荷フロー・引当ルールで拠点一覧・既定拠点を参照する
 * - v1 はブラウザ module スコープでの保持（リロードで初期化）。永続化は v2 で server action + DB
 */

export interface WarehouseRecord {
  code: string;
  name: string;
  type: "自社倉庫" | "外部倉庫" | "ドロップシッピング";
  address: string;
  zipCode: string;
  phone: string;
  manager: string;
  capacity: number;
  occupancy: number;
  shopAssignment: string[];
  carrierAssignment: string;
  isDefault: boolean;
  enabled: boolean;
  cutoffTime: string;
  notes: string;
}

const INITIAL_WAREHOUSES: WarehouseRecord[] = [
  { code: "WH-001", name: "東京本社倉庫", type: "自社倉庫", address: "東京都品川区東品川4-12-7", zipCode: "140-0002", phone: "03-1234-5678", manager: "山田 太郎", capacity: 12000, occupancy: 8420, shopAssignment: ["本店", "楽天店", "Amazon店"], carrierAssignment: "ヤマト運輸", isDefault: true, enabled: true, cutoffTime: "15:00", notes: "メイン拠点、即日出荷対応" },
  { code: "WH-002", name: "大阪倉庫", type: "自社倉庫", address: "大阪府大阪市住之江区南港北2-1-1", zipCode: "559-0034", phone: "06-1234-5678", manager: "佐藤 花子", capacity: 8000, occupancy: 5240, shopAssignment: ["本店", "Yahoo!店"], carrierAssignment: "佐川急便", isDefault: false, enabled: true, cutoffTime: "14:00", notes: "西日本配送拠点" },
  { code: "WH-003", name: "福岡倉庫", type: "自社倉庫", address: "福岡県福岡市東区箱崎ふ頭5-3-1", zipCode: "812-0051", phone: "092-123-4567", manager: "田中 健司", capacity: 4000, occupancy: 1820, shopAssignment: ["本店"], carrierAssignment: "佐川急便", isDefault: false, enabled: true, cutoffTime: "13:00", notes: "九州・沖縄配送" },
  { code: "WH-004", name: "楽天スーパーロジ（千葉）", type: "外部倉庫", address: "千葉県市川市塩浜2-15-1", zipCode: "272-0127", phone: "047-123-4567", manager: "RSL運営", capacity: 50000, occupancy: 22130, shopAssignment: ["楽天店"], carrierAssignment: "楽天指定", isDefault: false, enabled: true, cutoffTime: "12:00", notes: "RSL連携、楽天24時間出荷" },
  { code: "WH-005", name: "Amazon FBA（小田原）", type: "外部倉庫", address: "神奈川県小田原市鬼柳200", zipCode: "250-0875", phone: "0120-999-373", manager: "Amazon運営", capacity: 0, occupancy: 0, shopAssignment: ["Amazon店"], carrierAssignment: "Amazon", isDefault: false, enabled: true, cutoffTime: "—", notes: "FBA、自社直送のみ管理" },
  { code: "WH-006", name: "ドロップシップ（メーカーA）", type: "ドロップシッピング", address: "—", zipCode: "—", phone: "0120-555-444", manager: "メーカーA連携", capacity: 0, occupancy: 0, shopAssignment: ["本店", "楽天店"], carrierAssignment: "メーカー指定", isDefault: false, enabled: true, cutoffTime: "11:00", notes: "メーカー直送、当日12時締" },
  { code: "WH-007", name: "旧仙台倉庫（休止中）", type: "自社倉庫", address: "宮城県仙台市宮城野区港3-1-1", zipCode: "983-0001", phone: "022-999-9999", manager: "—", capacity: 2000, occupancy: 0, shopAssignment: [], carrierAssignment: "—", isDefault: false, enabled: false, cutoffTime: "—", notes: "2025年12月より休止中" },
];

let warehouses: WarehouseRecord[] = INITIAL_WAREHOUSES.map((w) => ({
  ...w,
  shopAssignment: [...w.shopAssignment],
}));

/** 倉庫一覧のコピーを返す */
export function getWarehouses(): WarehouseRecord[] {
  return warehouses.map((w) => ({ ...w, shopAssignment: [...w.shopAssignment] }));
}

/** 既定拠点を変更（1件のみ） */
export function setDefaultWarehouse(code: string): void {
  warehouses = warehouses.map((w) => ({ ...w, isDefault: w.code === code }));
}

/** upsert（code が一致すれば更新、なければ追加） */
export function upsertWarehouse(record: WarehouseRecord): void {
  const idx = warehouses.findIndex((w) => w.code === record.code);
  if (idx >= 0) {
    warehouses = warehouses.map((w) => (w.code === record.code ? { ...record, shopAssignment: [...record.shopAssignment] } : w));
  } else {
    warehouses = [...warehouses, { ...record, shopAssignment: [...record.shopAssignment] }];
  }
}

/** 削除（既定拠点は削除不可 — 呼び出し側でガードすること） */
export function removeWarehouse(code: string): void {
  warehouses = warehouses.filter((w) => w.code !== code);
}

/** デフォルトに戻す */
export function resetWarehouses(): void {
  warehouses = INITIAL_WAREHOUSES.map((w) => ({ ...w, shopAssignment: [...w.shopAssignment] }));
}
