/**
 * 受注一括登録パターン 共有マスタストア
 *
 * CSV/TSV取込パターンの定義をセッション横断で保持する。
 * id は文字列（"IP-001" 形式）で管理する。
 *
 * - 永続化（domain: "import-patterns"）の正規オーナーページは
 *   src/app/orders/import-patterns/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface ImportPattern {
  id: string;
  name: string;
  source: string;
  columns: number;
  lastUsed: string;
  count: number;
  delimiter: string;
  encoding: string;
  hasHeader: boolean;
  [extra: string]: unknown;
}

export const INITIAL_IMPORT_PATTERNS: ImportPattern[] = [
  { id: "IP-001", name: "楽天市場標準", source: "楽天市場", columns: 24, lastUsed: "2024/04/11", count: 1245, delimiter: "カンマ(,)", encoding: "UTF-8", hasHeader: true },
  { id: "IP-002", name: "Amazon出荷通知", source: "Amazon", columns: 18, lastUsed: "2024/04/10", count: 890, delimiter: "タブ", encoding: "UTF-8", hasHeader: true },
  { id: "IP-003", name: "卸先A専用", source: "自社EC", columns: 12, lastUsed: "2024/04/08", count: 56, delimiter: "カンマ(,)", encoding: "Shift_JIS", hasHeader: false },
  { id: "IP-004", name: "Yahoo!ショッピング", source: "Yahoo!", columns: 20, lastUsed: "2024/04/09", count: 432, delimiter: "カンマ(,)", encoding: "UTF-8", hasHeader: true },
];

/** 次のIDを採番する（IP-XXX 形式） */
export function nextImportPatternId(items: readonly ImportPattern[]): string {
  const nums = items.map((p) => {
    const m = p.id.match(/^IP-(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `IP-${String(max + 1).padStart(3, "0")}`;
}

/** クライアントセッション内で共有される単一の ImportPatternsStore インスタンス */
export const importPatternsStore: MasterStore<ImportPattern> =
  createMasterStore<ImportPattern>(INITIAL_IMPORT_PATTERNS);
