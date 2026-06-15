/**
 * 引当拠点パターン 共有マスタストア
 *
 * 倉庫引当パターンの一覧を画面横断で共有する。
 * 複数パターンの add / edit / duplicate / delete を持つ CRUD 型なので createMasterStore を利用。
 *
 * - クライアントセッション内で生存（リロードで初期シードに戻る）
 * - 永続化（domain: "allocation-patterns"）の正規オーナーページは
 *   src/app/products/inventory/allocation-pattern/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type AllocationStrategy = "priority" | "ratio" | "nearest";

export interface AllocationRule {
  warehouse: string;
  priority: number;
}

export interface AllocationPattern {
  id: string;
  name: string;
  description: string;
  rules: AllocationRule[];
  appliedShops: string[];
  strategy: AllocationStrategy;
  enabled: boolean;
  [extra: string]: unknown;
}

export const INITIAL_ALLOCATION_PATTERNS: AllocationPattern[] = [
  {
    id: "ap-1",
    name: "標準パターン",
    description: "本社 → 大阪 → 福岡の順で引当",
    rules: [
      { warehouse: "本社倉庫", priority: 1 },
      { warehouse: "大阪倉庫", priority: 2 },
      { warehouse: "福岡倉庫", priority: 3 },
    ],
    appliedShops: ["楽天市場店", "Yahoo!店", "自社Shopify"],
    strategy: "priority",
    enabled: true,
  },
  {
    id: "ap-2",
    name: "Amazon FBA専用",
    description: "FBA倉庫のみから引当",
    rules: [{ warehouse: "FBA倉庫", priority: 1 }],
    appliedShops: ["Amazon店"],
    strategy: "priority",
    enabled: true,
  },
  {
    id: "ap-3",
    name: "3PL優先パターン",
    description: "3PL東京を優先して自社倉庫を温存",
    rules: [
      { warehouse: "3PL東京", priority: 1 },
      { warehouse: "本社倉庫", priority: 2 },
    ],
    appliedShops: ["BASE店"],
    strategy: "priority",
    enabled: false,
  },
];

/** クライアントセッション内で共有される単一の AllocationPatternStore インスタンス */
export const allocationPatternStore: MasterStore<AllocationPattern> =
  createMasterStore<AllocationPattern>(INITIAL_ALLOCATION_PATTERNS);
