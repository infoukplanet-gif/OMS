/**
 * ブラックリスト 共有マスタストア v1
 *
 * 悪質顧客・トラブル顧客の登録を画面横断で共有する。
 * 「登録 → 一覧に出る」という単純な CRUD なので createMasterStore を利用。
 *
 * - クライアントセッション内で生存（リロードで初期シードに戻る）
 * - 永続化（domain: "blacklist"）の正規オーナーページは
 *   src/app/customers/blacklist/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type Reason =
  | "代金未払い"
  | "受取拒否"
  | "不正カード"
  | "なりすまし"
  | "悪質クレーム"
  | "脅迫・暴言"
  | "規約違反"
  | "その他";

export type BlockTarget = "order" | "shipping" | "contact" | "payment";

export type Severity = "観察" | "注意" | "警告" | "完全ブロック";

export type BlacklistStatus = "active" | "released" | "expired";

export interface BlacklistEntry {
  id: string;
  code: string;
  name: string;
  kana: string;
  email: string;
  phone: string;
  reason: Reason;
  detail: string;
  severity: Severity;
  blocks: BlockTarget[];
  registeredAt: string;
  registeredBy: string;
  expiresAt: string | null;
  status: BlacklistStatus;
  evidenceCount: number;
  [extra: string]: unknown;
}

export const SEVERITY_LADDER: Severity[] = ["観察", "注意", "警告", "完全ブロック"];

export const INITIAL_BLACKLIST: BlacklistEntry[] = [
  {
    id: "BL-001",
    code: "CUS-0099",
    name: "悪質太郎",
    kana: "アクシツタロウ",
    email: "akushitsu@example.com",
    phone: "090-9999-0001",
    reason: "代金未払い",
    detail: "代金引換での受取拒否が3回連続。配送料が累計¥4,800の損害。",
    severity: "完全ブロック",
    blocks: ["order", "shipping", "payment"],
    registeredAt: "2026-03-15",
    registeredBy: "佐藤 健（管理者）",
    expiresAt: null,
    status: "active",
    evidenceCount: 5,
  },
  {
    id: "BL-002",
    code: "CUS-0145",
    name: "迷惑花子",
    kana: "メイワクハナコ",
    email: "meiwaku@example.com",
    phone: "080-9999-0002",
    reason: "不正カード",
    detail: "他人名義クレジットカード使用の疑い。カード会社からチャージバック発生。",
    severity: "完全ブロック",
    blocks: ["order", "payment"],
    registeredAt: "2026-02-28",
    registeredBy: "鈴木 美咲",
    expiresAt: null,
    status: "active",
    evidenceCount: 3,
  },
  {
    id: "BL-003",
    code: "CUS-0201",
    name: "クレーム一郎",
    kana: "クレームイチロウ",
    email: "claim@example.com",
    phone: "070-9999-0003",
    reason: "脅迫・暴言",
    detail: "電話・メールにおける脅迫的な言動を録音/保存済み。法務確認済。",
    severity: "完全ブロック",
    blocks: ["order", "contact", "shipping"],
    registeredAt: "2026-01-10",
    registeredBy: "田中 花子",
    expiresAt: null,
    status: "active",
    evidenceCount: 8,
  },
  {
    id: "BL-004",
    code: "CUS-0312",
    name: "返品濫用 次郎",
    kana: "ヘンピンランヨウ",
    email: "henpin@example.com",
    phone: "090-9999-0004",
    reason: "規約違反",
    detail: "12ヶ月で返品率82%。利用規約第5条に基づき期限付きブロック。",
    severity: "警告",
    blocks: ["order"],
    registeredAt: "2026-04-05",
    registeredBy: "高橋 翔",
    expiresAt: "2026-10-05",
    status: "active",
    evidenceCount: 2,
  },
  {
    id: "BL-005",
    code: "CUS-0420",
    name: "なりすまし 三郎",
    kana: "ナリスマシ",
    email: "narisumashi@example.com",
    phone: "080-9999-0005",
    reason: "なりすまし",
    detail: "別顧客の住所・電話番号で会員登録。本人確認の結果、第三者であることが判明。",
    severity: "完全ブロック",
    blocks: ["order", "payment", "contact"],
    registeredAt: "2025-11-20",
    registeredBy: "佐藤 健（管理者）",
    expiresAt: null,
    status: "active",
    evidenceCount: 4,
  },
  {
    id: "BL-006",
    code: "CUS-0488",
    name: "観察対象 四郎",
    kana: "カンサツタイショウ",
    email: "kansatu@example.com",
    phone: "090-9999-0006",
    reason: "受取拒否",
    detail: "代金引換の受取拒否が2回。3回目で完全ブロック移行を予定。",
    severity: "注意",
    blocks: [],
    registeredAt: "2026-04-12",
    registeredBy: "鈴木 美咲",
    expiresAt: "2026-07-12",
    status: "active",
    evidenceCount: 1,
  },
  {
    id: "BL-007",
    code: "CUS-0510",
    name: "改心 五郎",
    kana: "カイシンゴロウ",
    email: "kaishin@example.com",
    phone: "070-9999-0007",
    reason: "悪質クレーム",
    detail: "本人より謝罪の連絡があり、社内協議の結果、解除済み。",
    severity: "観察",
    blocks: [],
    registeredAt: "2025-08-15",
    registeredBy: "田中 花子",
    expiresAt: null,
    status: "released",
    evidenceCount: 0,
  },
];

/** クライアントセッション内で共有される単一の BlacklistStore インスタンス */
export const blacklistStore: MasterStore<BlacklistEntry> =
  createMasterStore<BlacklistEntry>(INITIAL_BLACKLIST);
