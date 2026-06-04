/**
 * 卸先マスタの共有ストア（クライアントセッション内シングルトン）。
 *
 * 卸先一覧・卸先登録フォームが同一インスタンスを読み書きし、
 * 登録した卸先が即座に一覧に反映される。
 * id = 取引先コード（WS-XXX）を一意キーとする。
 */

import { createMasterStore } from "@/lib/stores/create-master-store";

export interface WholesaleRecord {
  /** 取引先コード（一意キー）。 */
  id: string;
  code: string;
  name: string;
  kana: string;
  contact: string;
  terms: string;
  creditLimit: number;
  creditUsed: number;
  group: "S" | "A" | "B" | "C";
  status: "通常" | "重点" | "新規" | "停止";
  monthSales: number;
  ytdSales: number;
  delays: number;
  prefecture: string;
  startedAt: string;
  [extra: string]: unknown;
}

export const INITIAL_WHOLESALE: WholesaleRecord[] = [
  { id: "WS-001", code: "WS-001", name: "株式会社ABC商事", kana: "エービーシーショウジ", contact: "山本部長", terms: "月末締翌月末払", creditLimit: 500000, creditUsed: 384000, group: "A", status: "通常", monthSales: 248000, ytdSales: 3120000, delays: 0, prefecture: "東京都", startedAt: "2022-04-15" },
  { id: "WS-002", code: "WS-002", name: "グローバルトレード合同会社", kana: "グローバルトレード", contact: "李マネージャー", terms: "月末締翌々月末払", creditLimit: 1000000, creditUsed: 920000, group: "S", status: "重点", monthSales: 1284000, ytdSales: 18420500, delays: 0, prefecture: "大阪府", startedAt: "2020-09-01" },
  { id: "WS-003", code: "WS-003", name: "北海道物産株式会社", kana: "ホッカイドウブッサン", contact: "鈴木課長", terms: "月末締翌月末払", creditLimit: 300000, creditUsed: 184000, group: "B", status: "通常", monthSales: 142000, ytdSales: 1820000, delays: 0, prefecture: "北海道", startedAt: "2023-06-12" },
  { id: "WS-004", code: "WS-004", name: "九州フードサービス", kana: "キュウシュウフード", contact: "田中支店長", terms: "20日締翌月10日払", creditLimit: 800000, creditUsed: 640000, group: "A", status: "重点", monthSales: 720000, ytdSales: 8920000, delays: 1, prefecture: "福岡県", startedAt: "2021-11-20" },
  { id: "WS-005", code: "WS-005", name: "東海卸センター株式会社", kana: "トウカイオロシ", contact: "佐藤主任", terms: "月末締翌月20日払", creditLimit: 600000, creditUsed: 240000, group: "B", status: "通常", monthSales: 320000, ytdSales: 4480000, delays: 0, prefecture: "愛知県", startedAt: "2022-02-08" },
  { id: "WS-006", code: "WS-006", name: "関西商事 株式会社", kana: "カンサイショウジ", contact: "村田専務", terms: "月末締翌月末払", creditLimit: 1200000, creditUsed: 1180000, group: "S", status: "重点", monthSales: 1480000, ytdSales: 21340000, delays: 0, prefecture: "京都府", startedAt: "2018-04-01" },
  { id: "WS-007", code: "WS-007", name: "信越流通", kana: "シンエツリュウツウ", contact: "高橋係長", terms: "10日締翌月末払", creditLimit: 200000, creditUsed: 0, group: "C", status: "新規", monthSales: 0, ytdSales: 84000, delays: 0, prefecture: "長野県", startedAt: "2026-04-01" },
  { id: "WS-008", code: "WS-008", name: "南九州ロジスティクス", kana: "ミナミキュウシュウ", contact: "前田室長", terms: "月末締翌々月末払", creditLimit: 400000, creditUsed: 412000, group: "B", status: "通常", monthSales: 224000, ytdSales: 2480000, delays: 2, prefecture: "鹿児島県", startedAt: "2023-08-10" },
  { id: "WS-009", code: "WS-009", name: "東北物流ネットワーク", kana: "トウホクブツリュウ", contact: "渡辺所長", terms: "月末締翌月末払", creditLimit: 0, creditUsed: 18000, group: "C", status: "停止", monthSales: 0, ytdSales: 18000, delays: 4, prefecture: "宮城県", startedAt: "2021-01-15" },
  { id: "WS-010", code: "WS-010", name: "首都圏卸売市場 株式会社", kana: "シュトケンオロシ", contact: "中村部長", terms: "月末締翌月15日払", creditLimit: 950000, creditUsed: 412000, group: "A", status: "通常", monthSales: 384000, ytdSales: 6248000, delays: 0, prefecture: "東京都", startedAt: "2019-07-22" },
];

/** クライアントセッション内で共有される卸先マスタシングルトン。 */
export const wholesaleStore = createMasterStore<WholesaleRecord>(INITIAL_WHOLESALE);
