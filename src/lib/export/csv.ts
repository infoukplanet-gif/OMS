/**
 * CSV エクスポートユーティリティ
 *
 * 一覧画面の「CSV出力」を実機能化するための共通モジュール。
 * - toCsv:      ヘッダー + 行データ → RFC 4180 準拠の CSV 文字列（pure）
 * - downloadCsv: toCsv の結果を BOM 付き UTF-8 でブラウザにダウンロードさせる（DOM 依存）
 *
 * Excel で文字化けしないよう downloadCsv は UTF-8 BOM を付与する。
 */

export type CsvCell = string | number;

/** 値に区切り文字・改行・引用符が含まれる場合のみダブルクォートで囲む。 */
function escapeCell(value: CsvCell): string {
  const s = typeof value === "number" ? String(value) : value;
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export type CsvNewline = "\r\n" | "\n";

export interface CsvOptions {
  /** 改行コード。省略時は RFC 4180 準拠の CRLF。 */
  newline?: CsvNewline;
  /** UTF-8 BOM を付与するか。省略時は true（Excel の文字化け防止）。 */
  bom?: boolean;
}

/**
 * ヘッダーと行データを CSV 文字列へ変換する（既定は CRLF 区切り、RFC 4180 準拠）。
 * 行が空でもヘッダー行は出力する。
 */
export function toCsv(
  headers: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<CsvCell>>,
  newline: CsvNewline = "\r\n",
): string {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }
  return lines.join(newline);
}

/**
 * CSV を生成し、UTF-8 の Blob としてダウンロードさせる（既定は BOM 付き）。
 * ブラウザ環境専用（document が無ければ何もしない）。
 */
export function downloadCsv(
  filename: string,
  headers: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<CsvCell>>,
  options: CsvOptions = {},
): void {
  if (typeof document === "undefined") return;
  const csv = toCsv(headers, rows, options.newline ?? "\r\n");
  // UTF-8 BOM（﻿）で Excel の文字化けを防ぐ。
  const blob = new Blob([options.bom === false ? csv : `﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
