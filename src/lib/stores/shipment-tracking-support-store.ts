/**
 * 配送番号サポート 共有マスタストア（collection パターン）。
 *
 * shipments/tracking-support ページの問合せ一覧（未到着遅延・誤配送疑い等）を
 * id をキーにした複数レコードとして createMasterStore に載せ、リロード後も復元する。
 *
 * - 新規登録 / ステータス更新 / 返信・調査による lastUpdate 更新 → upsert
 * - INITIAL_TRACKING_SUPPORT_ISSUES を既存サンプルからシードする
 *
 * 永続化（domain: "shipment-tracking-support-settings"）の正規オーナーページは
 * src/app/shipments/tracking-support/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type TrackingSupportStatus = "新規" | "対応中" | "保留" | "解決済";
export type TrackingSupportIssueType =
  | "未到着遅延"
  | "誤配送疑い"
  | "破損連絡"
  | "番号無効"
  | "再配達依頼";

export interface TrackingSupportRecord {
  id: string;
  order: string;
  customer: string;
  carrier: string;
  trackingNo: string;
  issue: TrackingSupportIssueType;
  daysOpen: number;
  status: TrackingSupportStatus;
  assignee: string;
  lastUpdate: string;
  [extra: string]: unknown;
}

export const INITIAL_TRACKING_SUPPORT_ISSUES: TrackingSupportRecord[] = [
  { id: "TS-001", order: "ORD-2026-00824", customer: "山田 太郎", carrier: "ヤマト運輸", trackingNo: "1234-5678-9012", issue: "未到着遅延", daysOpen: 5, status: "対応中", assignee: "佐藤 健", lastUpdate: "2026-04-25 09:24" },
  { id: "TS-002", order: "ORD-2026-00811", customer: "佐藤 花子", carrier: "佐川急便", trackingNo: "9876-5432-1098", issue: "誤配送疑い", daysOpen: 3, status: "対応中", assignee: "鈴木 美咲", lastUpdate: "2026-04-25 11:42" },
  { id: "TS-003", order: "ORD-2026-00798", customer: "田中 一郎", carrier: "日本郵便", trackingNo: "5555-4444-3333", issue: "破損連絡", daysOpen: 1, status: "新規", assignee: "—", lastUpdate: "2026-04-24 17:18" },
  { id: "TS-004", order: "ORD-2026-00775", customer: "鈴木 美咲", carrier: "ヤマト運輸", trackingNo: "INVALID-NUMBER", issue: "番号無効", daysOpen: 7, status: "保留", assignee: "田中 花子", lastUpdate: "2026-04-22 14:08" },
  { id: "TS-005", order: "ORD-2026-00762", customer: "高橋 健", carrier: "佐川急便", trackingNo: "1111-2222-3333", issue: "再配達依頼", daysOpen: 0, status: "解決済", assignee: "佐藤 健", lastUpdate: "2026-04-25 10:00" },
  { id: "TS-006", order: "ORD-2026-00754", customer: "渡辺 京子", carrier: "ヤマト運輸", trackingNo: "8888-9999-0000", issue: "未到着遅延", daysOpen: 4, status: "対応中", assignee: "高橋 翔", lastUpdate: "2026-04-25 08:42" },
];

export const trackingSupportStore: MasterStore<TrackingSupportRecord> =
  createMasterStore<TrackingSupportRecord>(INITIAL_TRACKING_SUPPORT_ISSUES);
