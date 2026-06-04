/**
 * 店舗マスタの共有ストア（クライアントセッション内シングルトン）。
 *
 * 店舗一覧/登録ページがここに書き込み、フォームの store 選択候補として参照される。
 * id が一意キー。v1 はブラウザ module スコープ保持（リロードで初期化）。
 */

import { createMasterStore, type MasterRecord } from "./create-master-store";

export interface ShopRecord extends MasterRecord {
  id: string;
  name: string;
  code: string;
  mall: string;
  color: string;
  status: "連携中" | "エラー" | "停止中" | "未設定";
  lastSync: string;
  lastSyncAt: string;
  apiAuthType: "OAuth" | "APIキー" | "Basic" | "—";
  monthlySales: number;
  monthlyOrders: number;
  defaultWarehouse: string;
  fromAddress: string;
  notes: string;
}

export const INITIAL_SHOPS: ShopRecord[] = [
  { id: "S001", name: "楽天市場 サンプルショップ", code: "rakuten-main", mall: "楽天市場", color: "bg-red-500", status: "連携中", lastSync: "2分前", lastSyncAt: "2026/04/30 10:28", apiAuthType: "OAuth", monthlySales: 18_450_000, monthlyOrders: 1245, defaultWarehouse: "東京本社倉庫", fromAddress: "rakuten@example.com", notes: "メイン店舗、24時間自動同期" },
  { id: "S002", name: "Amazon 公式ストア", code: "amazon-main", mall: "Amazon", color: "bg-orange-400", status: "連携中", lastSync: "5分前", lastSyncAt: "2026/04/30 10:25", apiAuthType: "OAuth", monthlySales: 9_820_000, monthlyOrders: 580, defaultWarehouse: "FBA（Amazon）", fromAddress: "amazon@example.com", notes: "FBA連携、SP-API利用" },
  { id: "S003", name: "Shopify 自社EC", code: "shopify-main", mall: "Shopify", color: "bg-green-500", status: "連携中", lastSync: "1分前", lastSyncAt: "2026/04/30 10:29", apiAuthType: "APIキー", monthlySales: 12_300_000, monthlyOrders: 980, defaultWarehouse: "東京本社倉庫", fromAddress: "info@example.com", notes: "プライマリECサイト" },
  { id: "S004", name: "Yahoo!ショッピング店", code: "yahoo-main", mall: "Yahoo!ショッピング", color: "bg-purple-500", status: "エラー", lastSync: "3時間前", lastSyncAt: "2026/04/30 07:30", apiAuthType: "OAuth", monthlySales: 6_140_000, monthlyOrders: 420, defaultWarehouse: "大阪倉庫", fromAddress: "yahoo@example.com", notes: "認証期限切れ、要再認証" },
  { id: "S005", name: "卸売チャネル", code: "wholesale", mall: "卸売", color: "bg-amber-500", status: "停止中", lastSync: "—", lastSyncAt: "—", apiAuthType: "—", monthlySales: 4_200_000, monthlyOrders: 32, defaultWarehouse: "東京本社倉庫", fromAddress: "wholesale@example.com", notes: "FAX/メール受注のみ" },
  { id: "S006", name: "au PAY マーケット店", code: "aupay-main", mall: "au PAY マーケット", color: "bg-cyan-500", status: "連携中", lastSync: "8分前", lastSyncAt: "2026/04/30 10:22", apiAuthType: "APIキー", monthlySales: 2_180_000, monthlyOrders: 145, defaultWarehouse: "東京本社倉庫", fromAddress: "aupay@example.com", notes: "" },
  { id: "S007", name: "Qoo10ショップ", code: "qoo10-main", mall: "Qoo10", color: "bg-pink-500", status: "未設定", lastSync: "—", lastSyncAt: "—", apiAuthType: "—", monthlySales: 0, monthlyOrders: 0, defaultWarehouse: "—", fromAddress: "—", notes: "API登録予定" },
];

export const shopStore = createMasterStore<ShopRecord>(INITIAL_SHOPS);
