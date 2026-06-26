/**
 * 備考欄一括確認（orders/notes）の 受注備考＋確認状態 共有マスタストア。
 *
 * 受注ごとの備考と「確認済」フラグを id をキーに createMasterStore へ載せる。
 * 確認済/取消の操作をストアへ反映し、リロード後も確認状態を復元する。
 *
 * 永続化（domain: "order-notes-check"）の正規オーナーページは
 * src/app/orders/notes/page.tsx。
 *
 * 注: 備考変換設定（domain: "order-notes-conversion-settings"）とは別物。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface OrderNoteCheckRecord {
  id: string;
  customer: string;
  note: string;
  checked: boolean;
  [extra: string]: unknown;
}

export const INITIAL_ORDER_NOTE_CHECKS: OrderNoteCheckRecord[] = [
  { id: "ORD-2026-01102", customer: "株式会社サンプル", note: "ギフト包装希望。のし紙（内のし・御祝・佐藤様）でお願いします。12月23日までに先方へ到着するようにご手配ください。配送状況が分かり次第ご連絡お願いします。", checked: false },
  { id: "ORD-2026-01101", customer: "山田太郎", note: "午前中指定でお願いします", checked: false },
  { id: "ORD-2026-01098", customer: "田中一郎", note: "領収書同封希望（宛名：株式会社ABC）", checked: true },
  { id: "ORD-2026-01095", customer: "鈴木商事", note: "商品Aと商品Bは別梱包でお願いします。納期優先で発送してください。", checked: false },
  { id: "ORD-2026-01092", customer: "伊藤大輔", note: "不在時は置き配でも可", checked: false },
  { id: "ORD-2026-01088", customer: "小林修", note: "電話連絡必要", checked: true },
];

export const orderNotesCheckStore: MasterStore<OrderNoteCheckRecord> =
  createMasterStore<OrderNoteCheckRecord>(INITIAL_ORDER_NOTE_CHECKS);
