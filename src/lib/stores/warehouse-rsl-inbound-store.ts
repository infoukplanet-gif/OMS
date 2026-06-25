/**
 * RSL 入荷処理 共有マスタストア（collection パターン）。
 *
 * warehouse-integration/rakuten-super-logi/inbound ページの入荷予定一覧を
 * id をキーにした複数レコードとして createMasterStore に載せ、リロード後も復元する。
 * 新規入荷予定の登録は upsert で行う。
 *
 * 永続化（domain: "warehouse-rsl-inbound-settings"）の正規オーナーページは
 * src/app/warehouse-integration/rakuten-super-logi/inbound/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type RslInboundStatus =
  | "予定"
  | "輸送中"
  | "RSL受入中"
  | "検品中"
  | "完了"
  | "差異あり";

export interface RslInboundRecord {
  id: string;
  poNo: string;
  supplier: string;
  items: number;
  qty: number;
  scheduled: string;
  arrived: string;
  carrier: string;
  trackingNo: string;
  status: RslInboundStatus;
  diff: number;
  [extra: string]: unknown;
}

export const INITIAL_RSL_INBOUND: RslInboundRecord[] = [
  { id: "RSL-IN-20260430-005", poNo: "PO-2026-0042", supplier: "メーカーA", items: 8, qty: 1200, scheduled: "2026/04/30", arrived: "2026/04/30 09:30", carrier: "佐川急便", trackingNo: "1234-5678-9012", status: "検品中", diff: 0 },
  { id: "RSL-IN-20260430-004", poNo: "PO-2026-0041", supplier: "メーカーB", items: 5, qty: 800, scheduled: "2026/04/30", arrived: "2026/04/30 08:00", carrier: "ヤマト運輸", trackingNo: "2345-6789-0123", status: "RSL受入中", diff: 0 },
  { id: "RSL-IN-20260430-003", poNo: "PO-2026-0040", supplier: "問屋C", items: 12, qty: 600, scheduled: "2026/04/30", arrived: "—", carrier: "ヤマト運輸", trackingNo: "3456-7890-1234", status: "輸送中", diff: 0 },
  { id: "RSL-IN-20260429-018", poNo: "PO-2026-0039", supplier: "メーカーA", items: 4, qty: 450, scheduled: "2026/04/29", arrived: "2026/04/29 14:00", carrier: "佐川急便", trackingNo: "4567-8901-2345", status: "完了", diff: 0 },
  { id: "RSL-IN-20260429-017", poNo: "PO-2026-0038", supplier: "輸入商社D", items: 8, qty: 1800, scheduled: "2026/04/29", arrived: "2026/04/29 11:30", carrier: "西濃運輸", trackingNo: "5678-9012-3456", status: "差異あり", diff: -8 },
  { id: "RSL-IN-20260501-001", poNo: "PO-2026-0043", supplier: "メーカーA", items: 6, qty: 980, scheduled: "2026/05/01", arrived: "—", carrier: "—", trackingNo: "—", status: "予定", diff: 0 },
];

export const rslInboundStore: MasterStore<RslInboundRecord> =
  createMasterStore<RslInboundRecord>(INITIAL_RSL_INBOUND);
