/**
 * 配送除外地域設定 共有マスタストア
 *
 * 離島・遠隔地など通常配送できない地域ルールの CRUD を画面横断で共有する。
 * 永続化（domain: "excluded-areas"）の正規オーナーページは
 * src/app/settings/excluded-areas/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface AreaRule {
  id: string;
  prefecture: string;
  zipPattern: string;
  reason: string;
  carriers: string[];
  surcharge: number;
  cod: boolean;
  enabled: boolean;
  [extra: string]: unknown;
}

export const INITIAL_EXCLUDED_AREAS: AreaRule[] = [
  { id: "ar-1", prefecture: "北海道", zipPattern: "040-0000〜099-9999", reason: "離島・遠隔地", carriers: ["ヤマト", "佐川"], surcharge: 880, cod: false, enabled: true },
  { id: "ar-2", prefecture: "沖縄県", zipPattern: "900-0000〜907-9999", reason: "離島", carriers: ["ヤマト", "佐川", "ゆうパック"], surcharge: 1100, cod: false, enabled: true },
  { id: "ar-3", prefecture: "東京都", zipPattern: "100-0301〜100-0511", reason: "小笠原・伊豆諸島", carriers: ["ゆうパック"], surcharge: 1650, cod: false, enabled: true },
  { id: "ar-4", prefecture: "鹿児島県", zipPattern: "891-0000〜899-9999", reason: "奄美群島", carriers: ["ヤマト", "佐川"], surcharge: 880, cod: false, enabled: true },
  { id: "ar-5", prefecture: "島根県", zipPattern: "684-0000〜684-9999", reason: "隠岐諸島", carriers: ["ゆうパック"], surcharge: 770, cod: false, enabled: true },
  { id: "ar-6", prefecture: "新潟県", zipPattern: "952-0000〜952-9999", reason: "佐渡島", carriers: ["ヤマト"], surcharge: 550, cod: true, enabled: true },
  { id: "ar-7", prefecture: "長崎県", zipPattern: "817-0000〜819-9999", reason: "離島群（壱岐・対馬・五島）", carriers: ["ゆうパック"], surcharge: 1320, cod: false, enabled: true },
];

/** クライアントセッション内で共有される単一の ExcludedAreasStore インスタンス */
export const excludedAreasStore: MasterStore<AreaRule> =
  createMasterStore<AreaRule>(INITIAL_EXCLUDED_AREAS);
