/**
 * カテゴリ変換設定 共有マスタストア
 *
 * 外部モール（楽天・Yahoo!・Amazon 等）のカテゴリ表記を OMS 標準カテゴリへ
 * 正規化するルールの CRUD を画面横断で共有する。永続化
 * （domain: "category-conversion-settings"）の正規オーナーページは
 * src/app/settings/category-conversion/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type CategoryMatchType = "完全一致" | "前方一致" | "正規表現";

export interface CategoryRule {
  id: string;
  from: string;
  fromSource: string;
  to: string;
  matchType: CategoryMatchType;
  priority: number;
  hits: number;
  enabled: boolean;
  [extra: string]: unknown;
}

export const INITIAL_CATEGORY_RULES: CategoryRule[] = [
  { id: "c-1", from: "レディース > トップス > Tシャツ", fromSource: "楽天", to: "アパレル/トップス/Tシャツ", matchType: "完全一致", priority: 1, hits: 1245, enabled: true },
  { id: "c-2", from: "Women > Tops > Tee", fromSource: "Amazon", to: "アパレル/トップス/Tシャツ", matchType: "完全一致", priority: 1, hits: 580, enabled: true },
  { id: "c-3", from: "ファッション > シャツ", fromSource: "Yahoo!", to: "アパレル/トップス/シャツ", matchType: "完全一致", priority: 1, hits: 420, enabled: true },
  { id: "c-4", from: "家電 > 生活家電 > 掃除機", fromSource: "楽天", to: "家電/生活家電/掃除機", matchType: "完全一致", priority: 1, hits: 98, enabled: true },
  { id: "c-5", from: "雑貨 > キッチン > 食器", fromSource: "自社EC", to: "ライフ/キッチン/食器", matchType: "完全一致", priority: 1, hits: 312, enabled: true },
  { id: "c-6", from: "ファッション > レディース.*", fromSource: "Yahoo!", to: "アパレル/レディース", matchType: "正規表現", priority: 5, hits: 88, enabled: true },
  { id: "c-7", from: "メンズ > ", fromSource: "楽天", to: "アパレル/メンズ", matchType: "前方一致", priority: 5, hits: 244, enabled: true },
  { id: "c-8", from: "Beauty > Skincare", fromSource: "Amazon", to: "コスメ/スキンケア", matchType: "完全一致", priority: 1, hits: 156, enabled: true },
  { id: "c-9", from: "ホーム&キッチン", fromSource: "Amazon", to: "ライフ/キッチン", matchType: "前方一致", priority: 5, hits: 78, enabled: true },
  { id: "c-10", from: "未分類", fromSource: "FAX手入力", to: "その他", matchType: "完全一致", priority: 9, hits: 32, enabled: false },
];

/** クライアントセッション内で共有される単一の CategoryConversionStore インスタンス */
export const categoryConversionStore: MasterStore<CategoryRule> =
  createMasterStore<CategoryRule>(INITIAL_CATEGORY_RULES);
