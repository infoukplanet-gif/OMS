/**
 * 入荷時の自動再引当 設定（モジュール内シングルトン）。
 *
 * 仕様: src/lib/cascades/reallocate-on-receipt.ts のヘッダ参照。
 *
 * - enabled=true（既定）のとき、各入荷ページの applyReceive 後に reallocateOnReceipt を発火する
 * - OFF にすると入荷では再引当せず、従来通り「引当自動実行」ページの手動バッチに委ねる
 * - 在庫設定ページ（products/inventory）等のトグルがここを書き換える想定
 * - v1 はブラウザ module スコープでの保持（リロードで初期化）。永続化は将来 server action + DB
 *
 * テストは reset → 操作 → 検証の順で書く（singleton なので beforeEach での明示 reset 必須）。
 */

export interface AutoReallocateSettings {
  /** 入荷で在庫が増えたとき、欠品受注を自動再引当するか。 */
  enabled: boolean;
}

export const DEFAULT_AUTO_REALLOCATE_SETTINGS: AutoReallocateSettings = {
  enabled: true,
};

let settings: AutoReallocateSettings = { ...DEFAULT_AUTO_REALLOCATE_SETTINGS };

/** 現在の設定のコピーを返す（呼び出し元の mutation で内部状態が壊れないように）。 */
export function getAutoReallocateSettings(): AutoReallocateSettings {
  return { ...settings };
}

/** 部分的に上書き。指定しなかった key は維持。 */
export function setAutoReallocateSettings(patch: Partial<AutoReallocateSettings>): void {
  settings = { ...settings, ...patch };
}

/** デフォルトに戻す（テスト用 + 「初期値に戻す」用）。 */
export function resetAutoReallocateSettings(): void {
  settings = { ...DEFAULT_AUTO_REALLOCATE_SETTINGS };
}
