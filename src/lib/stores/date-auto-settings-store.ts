/**
 * 日付自動登録設定 共有マスタストア
 *
 * ルール一覧（rules[]）とグローバル設定（global）の両方を保持する
 * 「id 固定の1レコード配列」として createMasterStore に載せる。
 * 永続化（domain: "date-auto-settings"）の正規オーナーページは
 * src/app/settings/date-auto/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface DateAutoRule {
  id: string;
  field: string;
  trigger: string;
  basis: string;
  offsetDays: number;
  offsetUnit: "営業日" | "日";
  skipHolidays: boolean;
  carryWeekend: "next" | "previous" | "no";
  enabled: boolean;
}

export interface DateAutoGlobal {
  defaultUnit: "営業日" | "日";
  holidayCalendar: string;
  defaultCarryWeekend: "next" | "previous" | "no";
}

export interface DateAutoConfigRecord {
  id: string;
  rules: DateAutoRule[];
  global: DateAutoGlobal;
  [extra: string]: unknown;
}

const DEFAULT_DATE_AUTO_RULES: DateAutoRule[] = [
  { id: "r1", field: "発送予定日", trigger: "受注確定", basis: "受注日", offsetDays: 1, offsetUnit: "営業日", skipHolidays: true, carryWeekend: "next", enabled: true },
  { id: "r2", field: "入金期限", trigger: "受注確定", basis: "受注日", offsetDays: 7, offsetUnit: "日", skipHolidays: false, carryWeekend: "no", enabled: true },
  { id: "r3", field: "支払期日（卸先）", trigger: "売上計上", basis: "売上日", offsetDays: 30, offsetUnit: "日", skipHolidays: true, carryWeekend: "next", enabled: true },
  { id: "r4", field: "返品期限", trigger: "出荷完了", basis: "発送日", offsetDays: 14, offsetUnit: "日", skipHolidays: false, carryWeekend: "no", enabled: true },
  { id: "r5", field: "保証終了日", trigger: "出荷完了", basis: "発送日", offsetDays: 365, offsetUnit: "日", skipHolidays: false, carryWeekend: "no", enabled: true },
  { id: "r6", field: "再入金催促日", trigger: "入金未確認", basis: "入金期限", offsetDays: 3, offsetUnit: "営業日", skipHolidays: true, carryWeekend: "next", enabled: true },
  { id: "r7", field: "フォロー送信日", trigger: "出荷完了", basis: "発送日", offsetDays: 3, offsetUnit: "日", skipHolidays: false, carryWeekend: "no", enabled: false },
];

const DEFAULT_DATE_AUTO_GLOBAL: DateAutoGlobal = {
  defaultUnit: "営業日",
  holidayCalendar: "japan",
  defaultCarryWeekend: "next",
};

export const INITIAL_DATE_AUTO_SETTINGS: DateAutoConfigRecord[] = [
  {
    id: "config",
    rules: DEFAULT_DATE_AUTO_RULES,
    global: DEFAULT_DATE_AUTO_GLOBAL,
  },
];

export const dateAutoSettingsStore: MasterStore<DateAutoConfigRecord> =
  createMasterStore<DateAutoConfigRecord>(INITIAL_DATE_AUTO_SETTINGS);
