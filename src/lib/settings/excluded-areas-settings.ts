/**
 * 配送除外地域設定のモジュール内シングルトン。
 *
 * - `settings/excluded-areas` ページが書き換える
 * - v1 はブラウザ module スコープでの保持（リロードで初期化）
 */

export interface AreaRule {
  id: string;
  prefecture: string;
  zipPattern: string;
  reason: string;
  carriers: string[];
  surcharge: number;
  cod: boolean;
  enabled: boolean;
}

export const DEFAULT_AREA_RULES: AreaRule[] = [
  { id: "ar-1", prefecture: "北海道", zipPattern: "040-0000〜099-9999", reason: "離島・遠隔地", carriers: ["ヤマト", "佐川"], surcharge: 880, cod: false, enabled: true },
  { id: "ar-2", prefecture: "沖縄県", zipPattern: "900-0000〜907-9999", reason: "離島", carriers: ["ヤマト", "佐川", "ゆうパック"], surcharge: 1100, cod: false, enabled: true },
  { id: "ar-3", prefecture: "東京都", zipPattern: "100-0301〜100-0511", reason: "小笠原・伊豆諸島", carriers: ["ゆうパック"], surcharge: 1650, cod: false, enabled: true },
  { id: "ar-4", prefecture: "鹿児島県", zipPattern: "891-0000〜899-9999", reason: "奄美群島", carriers: ["ヤマト", "佐川"], surcharge: 880, cod: false, enabled: true },
  { id: "ar-5", prefecture: "島根県", zipPattern: "684-0000〜684-9999", reason: "隠岐諸島", carriers: ["ゆうパック"], surcharge: 770, cod: false, enabled: true },
  { id: "ar-6", prefecture: "新潟県", zipPattern: "952-0000〜952-9999", reason: "佐渡島", carriers: ["ヤマト"], surcharge: 550, cod: true, enabled: true },
  { id: "ar-7", prefecture: "長崎県", zipPattern: "817-0000〜819-9999", reason: "離島群（壱岐・対馬・五島）", carriers: ["ゆうパック"], surcharge: 1320, cod: false, enabled: true },
];

let rules: AreaRule[] = DEFAULT_AREA_RULES.map((r) => ({ ...r, carriers: [...r.carriers] }));

export function getAreaRules(): AreaRule[] {
  return rules.map((r) => ({ ...r, carriers: [...r.carriers] }));
}

export function setAreaRules(items: AreaRule[]): void {
  rules = items.map((r) => ({ ...r, carriers: [...r.carriers] }));
}

export function upsertAreaRule(rule: AreaRule): void {
  const idx = rules.findIndex((r) => r.id === rule.id);
  if (idx >= 0) {
    rules = rules.map((r) => (r.id === rule.id ? { ...rule, carriers: [...rule.carriers] } : r));
  } else {
    rules = [...rules, { ...rule, carriers: [...rule.carriers] }];
  }
}

export function removeAreaRule(id: string): void {
  rules = rules.filter((r) => r.id !== id);
}

export function resetAreaRules(): void {
  rules = DEFAULT_AREA_RULES.map((r) => ({ ...r, carriers: [...r.carriers] }));
}
