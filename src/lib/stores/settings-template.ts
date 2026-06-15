/**
 * 帳票テンプレート 共有マスタストア
 *
 * 納品書・出荷指示書・ピッキングリスト・送り状・請求書・見積書の
 * 印刷帳票テンプレートを画面横断で共有する。
 * 永続化（domain: "settings-templates"）の正規オーナーページは
 * src/app/settings/templates/page.tsx
 *
 * 注意: 発注書フォーマット（purchasing/order-template）が使う
 * document-template.ts とは別概念のため、本ストアを再利用しないこと。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type SettingsTemplateType =
  | "納品書"
  | "出荷指示書"
  | "ピッキングリスト"
  | "送り状"
  | "請求書"
  | "見積書";

export type SettingsTemplatePaperSize =
  | "A4縦"
  | "A4横"
  | "A5"
  | "A6"
  | "ハガキ"
  | "サーマル76mm"
  | "サーマル100mm";

export interface SettingsTemplate {
  id: string;
  name: string;
  type: SettingsTemplateType;
  paperSize: SettingsTemplatePaperSize;
  shop: string;
  isDefault: boolean;
  usage: number;
  lastUpdated: string;
  enabled: boolean;
  description: string;
  [extra: string]: unknown;
}

export const INITIAL_SETTINGS_TEMPLATES: SettingsTemplate[] = [
  { id: "t-001", name: "標準納品書（A4縦）", type: "納品書", paperSize: "A4縦", shop: "全店舗共通", isDefault: true, usage: 1245, lastUpdated: "2026/04/01", enabled: true, description: "通常の宅配伝票同梱用納品書" },
  { id: "t-002", name: "卸売向け納品書", type: "納品書", paperSize: "A4縦", shop: "本店", isDefault: false, usage: 56, lastUpdated: "2026/03/15", enabled: true, description: "卸先用、税抜表示・取引区分明記" },
  { id: "t-003", name: "ギフト用納品書（金額非表示）", type: "納品書", paperSize: "A5", shop: "全店舗共通", isDefault: false, usage: 320, lastUpdated: "2026/02/20", enabled: true, description: "ギフト発送時の金額レス納品書" },
  { id: "t-004", name: "出荷指示書A", type: "出荷指示書", paperSize: "A4横", shop: "全店舗共通", isDefault: true, usage: 890, lastUpdated: "2026/03/28", enabled: true, description: "標準フォーマット、QRコード付き" },
  { id: "t-005", name: "簡易出荷指示", type: "出荷指示書", paperSize: "A5", shop: "全店舗共通", isDefault: false, usage: 234, lastUpdated: "2026/03/10", enabled: true, description: "メール便用簡易版" },
  { id: "t-006", name: "ピッキングリスト（ロケーション順）", type: "ピッキングリスト", paperSize: "A4縦", shop: "全店舗共通", isDefault: true, usage: 720, lastUpdated: "2026/04/10", enabled: true, description: "倉庫ロケ順にソート、バーコード付き" },
  { id: "t-007", name: "ヤマト送り状（B2クラウド）", type: "送り状", paperSize: "A6", shop: "全店舗共通", isDefault: true, usage: 4520, lastUpdated: "2026/04/05", enabled: true, description: "ヤマトB2クラウド連携用" },
  { id: "t-008", name: "佐川e飛伝送り状", type: "送り状", paperSize: "A6", shop: "全店舗共通", isDefault: false, usage: 1240, lastUpdated: "2026/04/03", enabled: true, description: "佐川急便e飛伝専用フォーマット" },
  { id: "t-009", name: "請求書（インボイス対応）", type: "請求書", paperSize: "A4縦", shop: "本店", isDefault: true, usage: 124, lastUpdated: "2026/04/01", enabled: true, description: "適格請求書発行事業者番号入り" },
  { id: "t-010", name: "見積書（標準）", type: "見積書", paperSize: "A4縦", shop: "本店", isDefault: true, usage: 88, lastUpdated: "2026/03/20", enabled: true, description: "見積有効期限・条件入り" },
];

/** クライアントセッション内で共有される単一の SettingsTemplateStore インスタンス */
export const settingsTemplateStore: MasterStore<SettingsTemplate> =
  createMasterStore<SettingsTemplate>(INITIAL_SETTINGS_TEMPLATES);
