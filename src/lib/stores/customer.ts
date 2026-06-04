/**
 * 顧客マスタの共有ストア（クライアントセッション内シングルトン）。
 *
 * 顧客一覧・顧客登録フォームが同一インスタンスを読み書きし、
 * 登録した顧客が即座に一覧に反映される。
 * id = 顧客コード（CUS-XXXX）を一意キーとする。
 */

import { createMasterStore } from "@/lib/stores/create-master-store";

export interface CustomerRecord {
  /** 顧客コード（一意キー）。 */
  id: string;
  code: string;
  name: string;
  kana: string;
  email: string;
  phone: string;
  prefecture: string;
  purchases: number;
  total: number;
  lastPurchase: string;
  registered: string;
  rank: "通常" | "シルバー" | "ゴールド" | "プラチナ" | "VIP";
  vip: boolean;
  kind: "general" | "wholesale" | "blacklist";
  [extra: string]: unknown;
}

export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  { id: "C001", code: "CUS-0001", name: "山田太郎", kana: "ヤマダタロウ", email: "yamada@example.com", phone: "090-1234-5678", prefecture: "東京都", purchases: 24, total: 384200, lastPurchase: "2026-04-11", registered: "2023-01-15", rank: "ゴールド", vip: true, kind: "general" },
  { id: "C002", code: "CUS-0002", name: "佐藤花子", kana: "サトウハナコ", email: "sato@example.com", phone: "080-2345-6789", prefecture: "大阪府", purchases: 8, total: 52400, lastPurchase: "2026-04-10", registered: "2023-05-22", rank: "シルバー", vip: false, kind: "general" },
  { id: "C003", code: "CUS-0003", name: "田中一郎", kana: "タナカイチロウ", email: "tanaka@example.com", phone: "070-3456-7890", prefecture: "愛知県", purchases: 31, total: 1245000, lastPurchase: "2026-04-11", registered: "2022-11-03", rank: "VIP", vip: true, kind: "general" },
  { id: "C004", code: "CUS-0004", name: "鈴木美咲", kana: "スズキミサキ", email: "suzuki@example.com", phone: "090-4567-8901", prefecture: "神奈川県", purchases: 3, total: 15600, lastPurchase: "2026-04-09", registered: "2024-02-10", rank: "通常", vip: false, kind: "general" },
  { id: "C005", code: "CUS-0005", name: "高橋健", kana: "タカハシケン", email: "takahashi@example.com", phone: "080-5678-9012", prefecture: "福岡県", purchases: 15, total: 198500, lastPurchase: "2026-04-08", registered: "2023-03-28", rank: "ゴールド", vip: true, kind: "general" },
  { id: "C006", code: "CUS-0006", name: "渡辺京子", kana: "ワタナベキョウコ", email: "watanabe@example.com", phone: "070-6789-0123", prefecture: "京都府", purchases: 5, total: 67800, lastPurchase: "2026-04-07", registered: "2023-08-14", rank: "シルバー", vip: false, kind: "general" },
  { id: "C007", code: "CUS-0007", name: "伊藤大輔", kana: "イトウダイスケ", email: "ito@example.com", phone: "090-7890-1234", prefecture: "宮城県", purchases: 2, total: 22400, lastPurchase: "2026-04-05", registered: "2024-01-20", rank: "通常", vip: false, kind: "general" },
  { id: "C008", code: "CUS-0008", name: "中村あかり", kana: "ナカムラアカリ", email: "nakamura@example.com", phone: "080-8901-2345", prefecture: "東京都", purchases: 19, total: 256300, lastPurchase: "2026-04-11", registered: "2022-09-07", rank: "プラチナ", vip: true, kind: "general" },
  { id: "C009", code: "CUS-0009", name: "小林さくら", kana: "コバヤシサクラ", email: "kobayashi@example.com", phone: "090-1112-2233", prefecture: "北海道", purchases: 12, total: 142000, lastPurchase: "2026-04-06", registered: "2023-12-01", rank: "ゴールド", vip: false, kind: "general" },
  { id: "C010", code: "CUS-0010", name: "加藤翔", kana: "カトウショウ", email: "kato@example.com", phone: "070-2233-4455", prefecture: "兵庫県", purchases: 7, total: 84200, lastPurchase: "2026-04-03", registered: "2024-03-15", rank: "シルバー", vip: false, kind: "general" },
];

/** クライアントセッション内で共有される顧客マスタシングルトン。 */
export const customerStore = createMasterStore<CustomerRecord>(INITIAL_CUSTOMERS);
