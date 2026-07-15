/**
 * 宣言的フィールドレジストリを使った自動マッピングエンジン（純粋関数・Date-free）。
 *
 * 外部CSVの列名を正規化し、レジストリ（field-registry.ts）の別名と多段で突き合わせて
 * 「どのシステム項目に対応するか」を推定する。ワンクリック自動マッピングの中核。
 */

import type { ImportFieldDef } from "./field-registry";

/** 画面の1マッピング行（既存 ImportMappingStep の MappingRow と互換）。 */
export interface MappingRow {
  /** 外部CSVの列名。 */
  csv: string;
  /** サンプル値（先頭行など）。 */
  sample: string;
  /** 割り当てたシステム項目キー（未設定は空文字）。 */
  system: string;
  /** 自動マッチしたか。 */
  matched: boolean;
  /** 変換ヒント（税抜計算など）。 */
  transform?: string;
}

/** autoMapColumns のオプション。 */
export interface AutoMapOptions {
  /** 列名→サンプル値の対応表。 */
  samples?: Record<string, string>;
  /** 既に他で使用済みで割り当て対象外にするシステム項目キー。 */
  reservedKeys?: string[];
}

const STRIP_RE =
  /[\s()（）[\]{}「」【】〈〉<>_.,、。・:;'"!?#*/\\|~＝=+\-‐–—]/g;

/**
 * 列名を比較用に正規化する。
 * NFKC で全角→半角を統一 → 小文字化 → 空白・括弧・記号を除去。
 */
export function normalizeHeader(raw: string): string {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .replace(STRIP_RE, "")
    .trim();
}

/** フィールド1件の正規化済みトークン（キー＋別名）を返す。 */
function fieldTokens(field: ImportFieldDef): string[] {
  return [field.key, ...field.aliases].map(normalizeHeader).filter(Boolean);
}

/**
 * 列名の配列をシステム項目へ自動割り当てし、MappingRow[] を返す。
 *
 * 多段マッチ:
 *  1) 完全一致（正規化したキー/別名と列名が一致）
 *  2) 部分一致（どちらかがどちらかを包含。長さ2以上のトークンのみ）
 * 同一システム項目を複数列に重複割り当てしない（used ガード）。
 */
export function autoMapColumns(
  columns: string[],
  fields: ImportFieldDef[],
  options: AutoMapOptions = {},
): MappingRow[] {
  const samples = options.samples ?? {};
  const used = new Set<string>(options.reservedKeys ?? []);

  const normColumns = columns.map((c) => normalizeHeader(c));
  const tokensByField = fields.map((f) => ({ field: f, tokens: fieldTokens(f) }));

  const rows: MappingRow[] = columns.map((csv) => ({
    csv,
    sample: samples[csv] ?? "",
    system: "",
    matched: false,
  }));

  const assign = (index: number, field: ImportFieldDef): void => {
    rows[index].system = field.key;
    rows[index].matched = true;
    if (field.transform) rows[index].transform = field.transform;
    used.add(field.key);
  };

  // パス1: 完全一致
  normColumns.forEach((normCol, i) => {
    if (!normCol || rows[i].matched) return;
    const hit = tokensByField.find(
      ({ field, tokens }) => !used.has(field.key) && tokens.includes(normCol),
    );
    if (hit) assign(i, hit.field);
  });

  // パス2: 部分一致（包含）
  normColumns.forEach((normCol, i) => {
    if (!normCol || rows[i].matched) return;
    const hit = tokensByField.find(
      ({ field, tokens }) =>
        !used.has(field.key) &&
        tokens.some(
          (t) => t.length >= 2 && (normCol.includes(t) || t.includes(normCol)),
        ),
    );
    if (hit) assign(i, hit.field);
  });

  return rows;
}

/**
 * 必須項目のうち、まだどの列にも割り当てられていないキーの一覧を返す。
 */
export function missingRequiredKeys(
  fields: ImportFieldDef[],
  rows: Pick<MappingRow, "system">[],
): string[] {
  const assigned = new Set(rows.map((r) => r.system).filter(Boolean));
  return fields
    .filter((f) => f.required && !assigned.has(f.key))
    .map((f) => f.key);
}
