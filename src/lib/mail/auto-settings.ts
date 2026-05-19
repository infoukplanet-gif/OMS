/**
 * 自動メール送信トリガーの ON/OFF 設定（モジュール内シングルトン）。
 *
 * 仕様: docs/prd/mail-trigger-v1.md §3 Q4
 *
 * - `mail/auto` ページのトグルがここを書き換える
 * - `mailQueue.enqueueAll` の第2引数として渡すことで、無効化トリガーは queue 投入前にスキップされる
 * - v1 はブラウザ module スコープでの保持（リロードで初期化）。永続化は v2 で server action + DB
 *
 * テストは reset → 操作 → 検証の順で書く（singleton なので beforeEach での明示 reset 必須）。
 */

import type { AutoMailEnabled, MailTriggerType } from "./queue";

export const DEFAULT_AUTO_MAIL_ENABLED: AutoMailEnabled = {
  thanks: true,
  "ship-notify": true,
  "payment-confirmed": true,
  "payment-reminder-3d": true,
  "payment-final-call-7d": true,
};

let enabled: Record<MailTriggerType, boolean> = { ...DEFAULT_AUTO_MAIL_ENABLED };

/** 現在の enabled マップのコピーを返す（呼び出し元の mutation で内部状態が壊れないように） */
export function getAutoMailEnabled(): AutoMailEnabled {
  return { ...enabled };
}

/** 部分的に上書き。指定しなかった key は維持。 */
export function setAutoMailEnabled(patch: Partial<Record<MailTriggerType, boolean>>): void {
  enabled = { ...enabled, ...patch };
}

/** デフォルト（全 ON）に戻す。テスト用 + 「初期値に戻す」ボタン用。 */
export function resetAutoMailEnabled(): void {
  enabled = { ...DEFAULT_AUTO_MAIL_ENABLED };
}
