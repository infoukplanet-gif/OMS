/**
 * 備考欄変換設定 共有マスタストア（collection パターン）。
 *
 * orders/notes/conversion ページの変換ルール（元テキスト→変換後テキスト）を
 * id をキーにした複数レコードで保持し、リロード後も復元する。
 * 追加=upsert / 削除=remove / 編集=upsert。
 *
 * 永続化（domain: "order-notes-conversion-settings"）の正規オーナーページは
 * src/app/orders/notes/conversion/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface NotesConversionRecord {
  id: string;
  from: string;
  to: string;
  contains: boolean;
  enabled: boolean;
  [extra: string]: unknown;
}

export const INITIAL_NOTES_CONVERSION: NotesConversionRecord[] = [
  { id: "1", from: "午前中", to: "配達希望: 午前中", contains: true, enabled: true },
  { id: "2", from: "のし", to: "のし対応必要", contains: true, enabled: true },
  { id: "3", from: "領収書", to: "領収書同封希望", contains: true, enabled: true },
  { id: "4", from: "ギフト", to: "ギフト包装希望", contains: true, enabled: true },
  { id: "5", from: "不在時", to: "不在時は置き配でも可", contains: true, enabled: false },
];

export const orderNotesConversionStore: MasterStore<NotesConversionRecord> =
  createMasterStore<NotesConversionRecord>(INITIAL_NOTES_CONVERSION);
