/**
 * RSL 返品処理 共有マスタストア（collection パターン）。
 *
 * warehouse-integration/rakuten-super-logi/return ページの返品一覧を
 * id をキーにした複数レコードとして createMasterStore に載せ、リロード後も復元する。
 * 新規返品受付の登録は upsert で行う。
 *
 * 永続化（domain: "warehouse-rsl-return-settings"）の正規オーナーページは
 * src/app/warehouse-integration/rakuten-super-logi/return/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type RslReturnResult = "再販可" | "不良在庫" | "廃棄" | "—";

export type RslReturnStatus =
  | "受付"
  | "返送中"
  | "RSL受領"
  | "検品中"
  | "在庫戻し済"
  | "廃棄処理済";

export interface RslReturnRecord {
  id: string;
  orderNo: string;
  customer: string;
  product: string;
  qty: number;
  reason: string;
  receivedAt: string;
  inspectedAt: string;
  result: RslReturnResult;
  refund: number;
  status: RslReturnStatus;
  trackingNo: string;
  [extra: string]: unknown;
}

export const INITIAL_RSL_RETURN: RslReturnRecord[] = [
  { id: "RSL-RET-20260430-008", orderNo: "ORD-2026-08350", customer: "田中 太郎", product: "コットンTシャツ ホワイト M", qty: 1, reason: "サイズ違い", receivedAt: "2026/04/30 09:00", inspectedAt: "2026/04/30 11:00", result: "再販可", refund: 1980, status: "在庫戻し済", trackingNo: "1234-5678-9012" },
  { id: "RSL-RET-20260430-007", orderNo: "ORD-2026-08348", customer: "山田 花子", product: "デニムジャケット M", qty: 1, reason: "イメージ違い", receivedAt: "2026/04/30 09:30", inspectedAt: "—", result: "—", refund: 14_800, status: "検品中", trackingNo: "2345-6789-0123" },
  { id: "RSL-RET-20260430-006", orderNo: "ORD-2026-08345", customer: "佐藤 一郎", product: "ステンレスタンブラー 350ml", qty: 2, reason: "破損", receivedAt: "2026/04/30 10:00", inspectedAt: "2026/04/30 11:30", result: "廃棄", refund: 4400, status: "廃棄処理済", trackingNo: "3456-7890-1234" },
  { id: "RSL-RET-20260429-018", orderNo: "ORD-2026-08340", customer: "渡辺 美咲", product: "オーガニックコーヒー豆", qty: 3, reason: "誤発送", receivedAt: "—", inspectedAt: "—", result: "—", refund: 6000, status: "返送中", trackingNo: "4567-8901-2345" },
  { id: "RSL-RET-20260429-017", orderNo: "ORD-2026-08338", customer: "木村 健", product: "ナチュラルコスメセット", qty: 1, reason: "肌に合わない", receivedAt: "2026/04/29 14:00", inspectedAt: "2026/04/29 15:00", result: "不良在庫", refund: 6000, status: "在庫戻し済", trackingNo: "5678-9012-3456" },
  { id: "RSL-RET-20260430-009", orderNo: "ORD-2026-08355", customer: "伊藤 さくら", product: "ワイヤレスイヤホン", qty: 1, reason: "初期不良", receivedAt: "—", inspectedAt: "—", result: "—", refund: 15_000, status: "受付", trackingNo: "—" },
];

export const rslReturnStore: MasterStore<RslReturnRecord> =
  createMasterStore<RslReturnRecord>(INITIAL_RSL_RETURN);
