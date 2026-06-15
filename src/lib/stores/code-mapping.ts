/**
 * 商品コード紐づけ 共有マスタストア
 *
 * 各モール（楽天 / Amazon / Yahoo! / Shopify）の商品コードと自社コードの
 * 紐付けを画面横断で共有する。連携状態（status）は raw フィールドから
 * 算出する派生値のため保存せず、画面描画時に都度再計算する。
 *
 * 永続化（domain: "code-mapping"）の正規オーナーページは
 * src/app/products/code-mapping/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface CodeMapping {
  id: string;
  code: string;
  name: string;
  rakutenNumber: string;
  rakutenSku: string;
  amazonSku: string;
  yahooCode: string;
  yahooSubcode: string;
  shopifySku: string;
  [extra: string]: unknown;
}

export const INITIAL_CODE_MAPPINGS: CodeMapping[] = [
  {
    id: "1",
    code: "WEP-001",
    name: "ワイヤレスイヤホン Pro",
    rakutenNumber: "wep-001-r",
    rakutenSku: "",
    amazonSku: "B0WEP001",
    yahooCode: "wep001y",
    yahooSubcode: "",
    shopifySku: "wep-001",
  },
  {
    id: "2",
    code: "WEP-001-BK",
    name: "ワイヤレスイヤホン Pro / ブラック",
    rakutenNumber: "wep-001-r",
    rakutenSku: "wep-001-bk",
    amazonSku: "B0WEP001BK",
    yahooCode: "wep001y",
    yahooSubcode: "bk",
    shopifySku: "wep-001-bk",
  },
  {
    id: "3",
    code: "UCB-002",
    name: "USB-Cケーブル 2m",
    rakutenNumber: "ucb-002-r",
    rakutenSku: "",
    amazonSku: "B0UCB002",
    yahooCode: "ucb002y",
    yahooSubcode: "",
    shopifySku: "ucb-002",
  },
  {
    id: "4",
    code: "MBT-004",
    name: "モバイルバッテリー 20000mAh",
    rakutenNumber: "mbt-004-r",
    rakutenSku: "",
    amazonSku: "B0MBT004",
    yahooCode: "",
    yahooSubcode: "",
    shopifySku: "mbt-004",
  },
  {
    id: "5",
    code: "CHG-007",
    name: "急速充電器 65W",
    rakutenNumber: "chg-007-r",
    rakutenSku: "",
    amazonSku: "",
    yahooCode: "chg007y",
    yahooSubcode: "",
    shopifySku: "chg-007",
  },
];

/** クライアントセッション内で共有される単一の CodeMappingStore インスタンス */
export const codeMappingStore: MasterStore<CodeMapping> =
  createMasterStore<CodeMapping>(INITIAL_CODE_MAPPINGS);
