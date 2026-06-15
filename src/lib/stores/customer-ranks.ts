/**
 * 購入回数・顧客ランク設定 共有マスタストア
 *
 * 「ランク閾値テーブル + カウント基準設定」を1レコード（id:"config"）にまとめて管理。
 * ランク設定ページのフォームが保存した内容をセッション横断で保持する。
 *
 * - 永続化（domain: "customer-ranks"）の正規オーナーページは
 *   src/app/customers/purchase-count/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type Rank = {
  id: string;
  label: string;
  minCount: number;
  minAmount: number;
  color: string;
  benefits: string;
  active: boolean;
};

export interface CustomerRanksConfig {
  id: string;
  // ランク閾値リスト
  ranks: Rank[];
  // カウント基準
  cancelCount: "exclude" | "include";
  returnCount: "exclude" | "include";
  holdCount: "exclude" | "include";
  minAmount: number;
  duplicateWindow: number;
  duplicateMode: "merge" | "count_each";
  // 集計範囲
  periodMode: "all" | "ytd" | "rolling12" | "rolling24";
  calendarBase: "calendar" | "fiscal";
  fiscalStart: string;
  // 自動再計算
  autoRecalc: boolean;
  recalcCron: string;
  demoteEnabled: boolean;
  demoteGrace: number;
  // 通知
  notifyRankUp: boolean;
  notifyMilestone: boolean;
  milestones: string;
  [extra: string]: unknown;
}

const DEFAULT_RANKS: Rank[] = [
  { id: "regular", label: "一般", minCount: 0, minAmount: 0, color: "bg-gray-500/15 text-gray-700", benefits: "通常価格", active: true },
  { id: "silver", label: "シルバー", minCount: 5, minAmount: 30000, color: "bg-slate-400/15 text-slate-700", benefits: "ポイント1.5倍・送料無料月1回", active: true },
  { id: "gold", label: "ゴールド", minCount: 15, minAmount: 100000, color: "bg-amber-500/15 text-amber-700", benefits: "ポイント2倍・送料無料・優先サポート", active: true },
  { id: "platinum", label: "プラチナ", minCount: 30, minAmount: 300000, color: "bg-purple-500/15 text-purple-700", benefits: "ポイント3倍・送料無料・専任担当", active: true },
  { id: "vip", label: "VIP", minCount: 50, minAmount: 1000000, color: "bg-pink-500/15 text-pink-700", benefits: "ポイント5倍・限定商品・誕生日ギフト", active: false },
];

export const INITIAL_CUSTOMER_RANKS: CustomerRanksConfig[] = [
  {
    id: "config",
    ranks: DEFAULT_RANKS,
    cancelCount: "exclude",
    returnCount: "exclude",
    holdCount: "exclude",
    minAmount: 0,
    duplicateWindow: 30,
    duplicateMode: "merge",
    periodMode: "rolling12",
    calendarBase: "fiscal",
    fiscalStart: "4",
    autoRecalc: true,
    recalcCron: "daily",
    demoteEnabled: true,
    demoteGrace: 60,
    notifyRankUp: true,
    notifyMilestone: true,
    milestones: "10,30,50,100",
  },
];

/** クライアントセッション内で共有される単一の CustomerRanksStore インスタンス */
export const customerRanksStore: MasterStore<CustomerRanksConfig> =
  createMasterStore<CustomerRanksConfig>(INITIAL_CUSTOMER_RANKS);
