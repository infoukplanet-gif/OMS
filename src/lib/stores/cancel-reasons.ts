/**
 * キャンセル区分 共有マスタストア
 *
 * 受注キャンセル区分の登録を画面横断で共有する。
 * 永続化（domain: "cancel-reasons"）の正規オーナーページは
 * src/app/orders/categories/cancel/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface CancelReason {
  id: string;
  code: string;
  name: string;
  reason: string;
  enabled: boolean;
  [extra: string]: unknown;
}

export const INITIAL_CANCEL_REASONS: CancelReason[] = [
  { id: "CR-1", code: "CNL01", name: "在庫切れ", reason: "商品在庫が確保できずキャンセル", enabled: true },
  { id: "CR-2", code: "CNL02", name: "顧客都合", reason: "顧客からのキャンセル依頼", enabled: true },
  { id: "CR-3", code: "CNL03", name: "決済エラー", reason: "与信・決済承認が取れなかった", enabled: true },
  { id: "CR-4", code: "CNL04", name: "住所不備", reason: "配送不可または住所不正", enabled: true },
  { id: "CR-5", code: "CNL05", name: "重複注文", reason: "同一顧客からの重複受注", enabled: false },
];

/** クライアントセッション内で共有される単一の CancelReasonsStore インスタンス */
export const cancelReasonsStore: MasterStore<CancelReason> =
  createMasterStore<CancelReason>(INITIAL_CANCEL_REASONS);
