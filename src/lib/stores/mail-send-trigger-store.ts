/**
 * メール送信処理（mail/send）の 自動送信トリガー 共有マスタストア。
 *
 * 受注ステータス変化に応じて起動する自動送信トリガーの一覧と、その有効/停止状態を
 * トリガー名（name）を id にして createMasterStore へ載せる。
 * トグル操作（停止/有効化）をストアへ反映し、リロード後も有効状態を復元する。
 *
 * 永続化（domain: "mail-send-triggers"）の正規オーナーページは
 * src/app/mail/send/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface MailSendTriggerRecord {
  /** トリガー名（一意キー）。 */
  id: string;
  /** 送信に使うテンプレート名。 */
  template: string;
  /** 自動送信が有効か。 */
  autoSend: boolean;
  /** 送信タイミングの説明。 */
  delay: string;
  /** 本日の対象件数。 */
  target: number;
  [extra: string]: unknown;
}

export const INITIAL_MAIL_SEND_TRIGGERS: MailSendTriggerRecord[] = [
  { id: "受注確認", template: "サンクスメール", autoSend: true, delay: "受注後即時", target: 12 },
  { id: "発送完了", template: "出荷通知", autoSend: true, delay: "出荷登録後即時", target: 45 },
  { id: "入金確認", template: "入金確認", autoSend: true, delay: "入金待ち3日後", target: 7 },
  { id: "フォローアップ", template: "フォロー", autoSend: false, delay: "発送後3日後", target: 23 },
  { id: "再発送通知", template: "再発送のお知らせ", autoSend: false, delay: "手動", target: 3 },
];

export const mailSendTriggerStore: MasterStore<MailSendTriggerRecord> =
  createMasterStore<MailSendTriggerRecord>(INITIAL_MAIL_SEND_TRIGGERS);
