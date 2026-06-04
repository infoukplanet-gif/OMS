/**
 * セット商品マスタの共有ストア（クライアントセッション内シングルトン）。
 *
 * セット商品一覧/登録ページがここに書き込む。id が一意キー。
 */

import { createMasterStore, type MasterRecord } from "./create-master-store";

export interface SetProductRecord extends MasterRecord {
  id: string;
  /** セット商品コード */
  code: string;
  name: string;
  category: string;
  status: "販売中" | "停止中" | "予約販売" | "廃番";
  /** セット販売価格（税込） */
  setPrice: number;
  /** 構成品原価合計 */
  totalCost: number;
  /** 構成品点数 */
  componentCount: number;
  updated: string;
}

export const INITIAL_SET_PRODUCTS: SetProductRecord[] = [
  {
    id: "SP001",
    code: "SET-001",
    name: "ワイヤレスイヤホン スターターパック",
    category: "セット・福袋",
    status: "販売中",
    setPrice: 13_800,
    totalCost: 5_020,
    componentCount: 3,
    updated: "2026/04/28",
  },
  {
    id: "SP002",
    code: "SET-002",
    name: "ホームオフィス快適セット",
    category: "ギフトセット",
    status: "販売中",
    setPrice: 28_000,
    totalCost: 10_500,
    componentCount: 5,
    updated: "2026/04/20",
  },
  {
    id: "SP003",
    code: "SET-003",
    name: "新生活応援パック",
    category: "お試しセット",
    status: "予約販売",
    setPrice: 9_800,
    totalCost: 3_200,
    componentCount: 4,
    updated: "2026/04/15",
  },
  {
    id: "SP004",
    code: "SET-004",
    name: "定期便 ケアセット 月1回",
    category: "定期便",
    status: "販売中",
    setPrice: 6_500,
    totalCost: 2_100,
    componentCount: 3,
    updated: "2026/03/30",
  },
  {
    id: "SP005",
    code: "SET-005",
    name: "アウトドア フルギアセット",
    category: "ギフトセット",
    status: "停止中",
    setPrice: 45_000,
    totalCost: 18_000,
    componentCount: 8,
    updated: "2026/02/14",
  },
];

export const setProductStore = createMasterStore<SetProductRecord>(INITIAL_SET_PRODUCTS);
