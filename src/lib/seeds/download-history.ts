/**
 * ダウンロード履歴ページの初期シード。
 *
 * 永続化（domain: "download-history"）の正規オーナーページは
 * src/app/settings/download-history/page.tsx。
 */

import type { DownloadJobRecord } from "../state-machines/download-job";

export const INITIAL_DOWNLOAD_JOBS: DownloadJobRecord[] = [
  { id: "DL-20260430-0042", category: "売上明細", filename: "sales_2026-04.xlsx", range: "2026/04/01-2026/04/30", user: "山田", format: "Excel (xlsx)", records: 8423, size: "3.2 MB", startedAt: "2026/04/30 10:32", duration: "12s", status: "success" },
  { id: "DL-20260430-0041", category: "受注情報", filename: "orders_2026-04-29.csv", range: "2026/04/29", user: "佐藤", format: "CSV", records: 245, size: "180 KB", startedAt: "2026/04/30 09:18", duration: "3s", status: "success" },
  { id: "DL-20260430-0040", category: "在庫推移", filename: "inventory_2026-04.csv", range: "2026/04/01-2026/04/30", user: "system", format: "CSV", records: 28430, size: "8.5 MB", startedAt: "2026/04/30 02:00", duration: "48s", status: "success" },
  { id: "DL-20260429-0418", category: "顧客別購入分析", filename: "customers_2026-Q1.xlsx", range: "2026/01/01-2026/03/31", user: "田中", format: "Excel (xlsx)", records: 4520, size: "2.1 MB", startedAt: "2026/04/29 18:00", duration: "8s", status: "success" },
  { id: "DL-20260429-0417", category: "ABC分析", filename: "abc_2026-Q1.xlsx", range: "2026/01/01-2026/03/31", user: "鈴木", format: "Excel (xlsx)", records: 320, size: "120 KB", startedAt: "2026/04/29 15:40", duration: "2s", status: "success" },
  { id: "DL-20260429-0416", category: "売上明細", filename: "sales_2026-04-15-29.csv", range: "2026/04/15-2026/04/29", user: "山田", format: "CSV", records: 1245, size: "640 KB", startedAt: "2026/04/29 11:22", duration: "—", status: "running" },
  { id: "DL-20260429-0415", category: "顧客別購入分析", filename: "customers_2026-04.csv", range: "2026/04/01-2026/04/29", user: "system", format: "CSV", records: 0, size: "—", startedAt: "2026/04/29 08:00", duration: "60s", status: "failed" },
  { id: "DL-20260420-0123", category: "返品集計", filename: "returns_2026-Q1.xlsx", range: "2026/01/01-2026/03/31", user: "高橋", format: "Excel (xlsx)", records: 88, size: "32 KB", startedAt: "2026/04/20 14:00", duration: "1s", status: "expired" },
];
