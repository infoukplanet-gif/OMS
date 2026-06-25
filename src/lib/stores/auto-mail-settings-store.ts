/**
 * 自動送信メール設定 共有マスタストア（single-config 1-record パターン）。
 *
 * mail/auto ページの「グローバル設定（送信時間帯・時間外キュー）」と
 * 「トリガー詳細（テンプレート/タイミング/リトライ/CC・BCC/有効フラグ）」を
 * id 固定の 1 レコードとして createMasterStore に載せ、リロード後も復元する。
 *
 * 永続化（domain: "auto-mail-settings"）の正規オーナーページは
 * src/app/mail/auto/page.tsx。
 *
 * なお runtime の送信スキップ判定（mailQueue.enqueueAll の第2引数）は
 * 従来どおり src/lib/mail/auto-settings.ts のシングルトン（setAutoMailEnabled）が担う。
 * このストアは「画面状態の永続化」を担当し、オーナーページが hydrate / save 時に
 * deriveEnabledPatch() の結果をシングルトンへ橋渡しする（テスト済みの同期 API は不変）。
 */

import type { MailTriggerType } from "@/lib/mail/queue";
import { createMasterStore, type MasterStore } from "./create-master-store";

/** 各トリガーの可変状態（永続化対象）。 */
export interface AutoMailTriggerState {
  enabled: boolean;
  template: string;
  delay: string;
  retryMax: number;
  cc?: string;
  bcc?: string;
}

/** トリガーの静的定義（表示メタ。永続化しない）。 */
export interface AutoMailTriggerDef {
  id: string;
  name: string;
  desc: string;
  /** v1 mail queue にマップされるトリガー種別（未設定なら queue とは無関係）。 */
  queueTrigger?: MailTriggerType;
}

interface AutoMailTriggerCatalogEntry extends AutoMailTriggerDef, AutoMailTriggerState {}

/** トリガーの初期カタログ（静的メタ + 既定状態の単一ソース）。 */
const CATALOG: AutoMailTriggerCatalogEntry[] = [
  { id: "thanks", queueTrigger: "thanks", name: "受注確認（サンクスメール）", desc: "受注ステータスが「受付完了」になった直後に自動送信", enabled: true, template: "サンクスメール（自動）", delay: "受注確認後 即時", retryMax: 3, bcc: "log@example.com" },
  { id: "ship", queueTrigger: "ship-notify", name: "出荷完了通知", desc: "出荷ステータスが「出荷済」になった直後に自動送信", enabled: true, template: "出荷通知メール（自動）", delay: "出荷登録後 即時", retryMax: 3 },
  { id: "payment-confirmed", queueTrigger: "payment-confirmed", name: "入金確認メール", desc: "入金が確認できた直後に「ご入金ありがとうございます」を送信", enabled: true, template: "入金確認メール（自動）", delay: "入金記録後 即時", retryMax: 3 },
  { id: "payment3", name: "入金催促（3日経過）", desc: "代引き／銀振の入金待ちが3日経過した受注へ自動送信", enabled: true, template: "入金確認メール（自動）", delay: "入金待ち3日後 09:00", retryMax: 2 },
  { id: "payment7", name: "入金催促（7日経過・最終通告）", desc: "入金待ちが7日経過した受注へ送信。送信後は要オペレーター確認", enabled: false, template: "入金催促（最終通告）", delay: "入金待ち7日後 09:00", retryMax: 2, cc: "ops@example.com" },
  { id: "follow", queueTrigger: "follow-up", name: "フォローアップ（配達完了）", desc: "出荷ステータスが「配達完了」になった直後に商品到着確認・レビュー誘導を送信", enabled: true, template: "フォローアップメール", delay: "配達完了後 即時", retryMax: 1 },
  { id: "rebill", queueTrigger: "rebill-mismatch", name: "再請求（差額不足）", desc: "金額不整合確認で不足案件に「再請求メール」を実行した際に送信", enabled: true, template: "入金催促（最終通告）", delay: "再請求操作後 即時", retryMax: 2 },
  { id: "stockout", name: "在庫切れ連絡", desc: "受注に対し在庫不足が発生した場合に送信", enabled: false, template: "在庫切れご連絡", delay: "在庫不足検知後 即時", retryMax: 2 },
  { id: "reship", name: "再発送のお知らせ", desc: "返送・配送ミス対応で再発送した際に送信", enabled: true, template: "再発送のお知らせ", delay: "再発送登録後 即時", retryMax: 2 },
  { id: "review", name: "レビュー依頼（発送後7日）", desc: "発送から7日後にレビュー依頼メールを送信", enabled: false, template: "レビュー依頼", delay: "発送後7日後 19:00", retryMax: 1 },
];

/** トリガーの静的定義一覧（表示用）。 */
export const AUTO_MAIL_TRIGGER_DEFS: AutoMailTriggerDef[] = CATALOG.map(
  ({ id, name, desc, queueTrigger }) => ({ id, name, desc, queueTrigger }),
);

/** id -> 既定可変状態のマップ。 */
function buildDefaultTriggers(): Record<string, AutoMailTriggerState> {
  const map: Record<string, AutoMailTriggerState> = {};
  for (const e of CATALOG) {
    map[e.id] = { enabled: e.enabled, template: e.template, delay: e.delay, retryMax: e.retryMax, cc: e.cc, bcc: e.bcc };
  }
  return map;
}

export interface AutoMailSettingsFields {
  /** id -> 可変状態。 */
  triggers: Record<string, AutoMailTriggerState>;
  sendStart: string;
  sendEnd: string;
  afterHours: string;
}

export interface AutoMailSettingsRecord extends AutoMailSettingsFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_AUTO_MAIL_SETTINGS: AutoMailSettingsFields = {
  triggers: buildDefaultTriggers(),
  sendStart: "09:00",
  sendEnd: "20:00",
  afterHours: "翌営業日の開始時刻に送信",
};

export const INITIAL_AUTO_MAIL_SETTINGS: AutoMailSettingsRecord[] = [
  { id: "config", ...DEFAULT_AUTO_MAIL_SETTINGS },
];

export const autoMailSettingsStore: MasterStore<AutoMailSettingsRecord> =
  createMasterStore<AutoMailSettingsRecord>(INITIAL_AUTO_MAIL_SETTINGS);

/**
 * トリガー可変状態から、runtime シングルトン（auto-settings）へ渡す enabled パッチを導出する。
 * queueTrigger を持つトリガーだけが対象。
 */
export function deriveAutoMailEnabledPatch(
  triggers: Record<string, AutoMailTriggerState>,
): Partial<Record<MailTriggerType, boolean>> {
  const patch: Partial<Record<MailTriggerType, boolean>> = {};
  for (const def of AUTO_MAIL_TRIGGER_DEFS) {
    if (def.queueTrigger) patch[def.queueTrigger] = triggers[def.id]?.enabled ?? false;
  }
  return patch;
}
