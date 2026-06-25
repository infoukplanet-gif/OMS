/**
 * メール送信スケジュール設定 共有マスタストア（single-config 1-record パターン）。
 *
 * mail/schedule ページの「基本送信ウィンドウ（開始/終了/休業日扱い）」と
 * 「トリガー別ルール一覧」「休業日カレンダー」を id 固定の 1 レコードとして
 * createMasterStore に載せ、リロード後も復元する。保存ボタンが store.upsert で永続化する。
 *
 * 永続化（domain: "mail-schedule-settings"）の正規オーナーページは
 * src/app/mail/schedule/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type ScheduleOutsideAction = "next-business-day" | "send-immediately" | "hold";

export interface ScheduleRule {
  id: string;
  trigger: string;
  windowStart: string;
  windowEnd: string;
  daysOfWeek: number[];
  blackoutMessage: string;
  outsideAction: ScheduleOutsideAction;
  enabled: boolean;
}

export interface ScheduleHoliday {
  date: string;
  name: string;
}

export interface MailScheduleFields {
  defaultStart: string;
  defaultEnd: string;
  holidayMode: string;
  rules: ScheduleRule[];
  holidays: ScheduleHoliday[];
}

export interface MailScheduleRecord extends MailScheduleFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_SCHEDULE_RULES: ScheduleRule[] = [
  { id: "rule-thanks", trigger: "受注確認", windowStart: "08:00", windowEnd: "21:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6], blackoutMessage: "通常通り送信", outsideAction: "send-immediately", enabled: true },
  { id: "rule-ship", trigger: "出荷通知", windowStart: "09:00", windowEnd: "20:00", daysOfWeek: [0, 1, 2, 3, 4, 5], blackoutMessage: "翌営業日朝", outsideAction: "next-business-day", enabled: true },
  { id: "rule-payment", trigger: "入金催促", windowStart: "10:00", windowEnd: "18:00", daysOfWeek: [0, 1, 2, 3, 4], blackoutMessage: "翌営業日朝", outsideAction: "next-business-day", enabled: true },
  { id: "rule-follow", trigger: "フォローアップ", windowStart: "11:00", windowEnd: "19:00", daysOfWeek: [1, 2, 3, 4, 5], blackoutMessage: "保留", outsideAction: "hold", enabled: true },
  { id: "rule-review", trigger: "レビュー依頼", windowStart: "18:00", windowEnd: "21:00", daysOfWeek: [4, 5, 6], blackoutMessage: "保留", outsideAction: "hold", enabled: false },
];

export const DEFAULT_SCHEDULE_HOLIDAYS: ScheduleHoliday[] = [
  { date: "2026/05/03", name: "憲法記念日" },
  { date: "2026/05/04", name: "みどりの日" },
  { date: "2026/05/05", name: "こどもの日" },
  { date: "2026/07/20", name: "海の日" },
  { date: "2026/08/11", name: "山の日" },
  { date: "2026/09/21", name: "敬老の日" },
];

export const DEFAULT_MAIL_SCHEDULE: MailScheduleFields = {
  defaultStart: "09:00",
  defaultEnd: "20:00",
  holidayMode: "skip",
  rules: DEFAULT_SCHEDULE_RULES,
  holidays: DEFAULT_SCHEDULE_HOLIDAYS,
};

export const INITIAL_MAIL_SCHEDULE: MailScheduleRecord[] = [
  { id: "config", ...DEFAULT_MAIL_SCHEDULE },
];

export const mailScheduleStore: MasterStore<MailScheduleRecord> =
  createMasterStore<MailScheduleRecord>(INITIAL_MAIL_SCHEDULE);
