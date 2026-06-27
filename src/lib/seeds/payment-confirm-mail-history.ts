/**
 * 入金確認メール 一括送信バッチ履歴のシード。
 *
 * payments/email-confirm ページの「送信履歴」テーブルの初期表示に使う。
 * 1 レコード = 1 回の一括送信バッチ（送信日時・対象件数・テンプレート・結果）。
 */

/** 1 回の入金確認メール一括送信バッチ。 */
export interface PaymentConfirmMailBatch {
  id: string;
  /** 送信日時（YYYY-MM-DD HH:MM）。 */
  at: string;
  /** 表示用の対象件数ラベル（例: "84件"）。 */
  target: string;
  /** enqueue できた件数。 */
  count: number;
  /** 使用テンプレート名。 */
  template: string;
  /** 結果。success=全件enqueue / partial=重複等で一部スキップ。 */
  status: "success" | "partial";
  /** 重複（同一受注へ当該セッションで送信済み）でスキップした件数。 */
  duplicateSkipped: number;
  /** createMasterStore の MasterRecord 制約（id 以外の任意項目）を満たすための索引シグネチャ。 */
  [extra: string]: unknown;
}

export const INITIAL_PAYMENT_CONFIRM_MAIL_HISTORY: PaymentConfirmMailBatch[] = [
  { id: "MAILB-20260425-1042", at: "2026-04-25 10:42", target: "84件", count: 84, template: "入金確認メール（標準）", status: "success", duplicateSkipped: 0 },
  { id: "MAILB-20260424-1618", at: "2026-04-24 16:18", target: "92件", count: 92, template: "入金確認メール（標準）", status: "success", duplicateSkipped: 0 },
  { id: "MAILB-20260423-1432", at: "2026-04-23 14:32", target: "8件", count: 8, template: "入金確認メール（VIP用）", status: "success", duplicateSkipped: 0 },
];
