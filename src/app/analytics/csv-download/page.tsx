"use client";

import { DownloadWizard } from "@/components/download/download-wizard";

export default function AnalyticsCsvDownloadPage() {
  return (
    <DownloadWizard
      title="分析CSVダウンロード"
      description="売上・顧客・商品の分析データを期間と粒度を指定して書き出します。BIツールへの取込やレポート作成にご利用ください。"
      hint="基幹データから集計したスナップショットをCSV/Excel形式でダウンロードします。差分エクスポート・スケジュール配信に対応。"
      formats={["CSV", "Excel (xlsx)", "TSV", "JSON"]}
      kpis={[
        { label: "本日DL件数", value: "12", unit: "件" },
        { label: "今月DL件数", value: "284", unit: "件" },
        { label: "登録スケジュール", value: "5", unit: "件" },
        { label: "失敗（再送可）", value: "1", unit: "件" },
      ]}
      filters={[
        {
          key: "dataset",
          label: "出力データセット",
          hint: "売上・顧客・商品・在庫推移など、書き出す元データセットを選択",
          options: ["売上明細", "売上日次サマリ", "顧客別購入分析", "商品別売上", "在庫推移", "リピート率推移", "ABC分析", "決済方法別集計"],
        },
        {
          key: "granularity",
          label: "集計粒度",
          hint: "日次・週次・月次など集計のロールアップ粒度",
          options: ["日次", "週次", "月次", "四半期", "年次"],
        },
        {
          key: "shop",
          label: "対象店舗",
          options: ["全店舗合算", "本店", "楽天店", "Yahoo!店", "Amazon店", "au PAY マーケット店"],
        },
        {
          key: "channel",
          label: "販売チャネル",
          options: ["すべて", "オンライン", "電話", "FAX", "卸売"],
        },
        {
          key: "category",
          label: "商品カテゴリ",
          options: ["すべて", "アパレル", "雑貨", "食品", "コスメ", "家電"],
        },
      ]}
      exampleColumns={[
        "日付", "店舗", "チャネル", "商品コード", "商品名", "カテゴリ",
        "数量", "売上金額", "原価", "粗利", "粗利率", "返品数", "決済方法", "顧客区分",
      ]}
      schedules={[
        { id: 1, name: "毎月1日 売上日次サマリ", schedule: "毎月1日 02:00", format: "Excel (xlsx)", recipients: "ops@example.com, finance@example.com", enabled: true },
        { id: 2, name: "毎週月曜 商品別売上", schedule: "毎週月曜 06:00", format: "CSV", recipients: "merchandiser@example.com", enabled: true },
        { id: 3, name: "毎日 在庫推移", schedule: "毎日 23:30", format: "CSV", recipients: "warehouse@example.com", enabled: true },
        { id: 4, name: "四半期 ABC分析", schedule: "四半期初日 03:00", format: "Excel (xlsx)", recipients: "ceo@example.com", enabled: true },
        { id: 5, name: "毎月15日 顧客別購入分析", schedule: "毎月15日 04:00", format: "CSV", recipients: "marketing@example.com", enabled: false },
      ]}
      history={[
        { id: 1, at: "2026/04/30 09:32", by: "山田", range: "2026/04/01-2026/04/29", filters: "売上明細・日次・全店舗", format: "Excel (xlsx)", records: 8423, status: "success" },
        { id: 2, at: "2026/04/30 08:15", by: "佐藤", range: "2026/04/15-2026/04/29", filters: "商品別売上・週次・本店", format: "CSV", records: 1245, status: "success" },
        { id: 3, at: "2026/04/29 22:00", by: "system", range: "2026/04/01-2026/04/29", filters: "在庫推移・日次", format: "CSV", records: 28430, status: "success" },
        { id: 4, at: "2026/04/29 15:40", by: "田中", range: "2026/01/01-2026/03/31", filters: "ABC分析・四半期", format: "Excel (xlsx)", records: 320, status: "success" },
        { id: 5, at: "2026/04/29 11:22", by: "鈴木", range: "2026/04/01-2026/04/28", filters: "リピート率・月次", format: "CSV", records: 1820, status: "running" },
        { id: 6, at: "2026/04/28 18:00", by: "system", range: "2026/04/01-2026/04/28", filters: "顧客別購入・月次", format: "CSV", records: 0, status: "failed" },
      ]}
    />
  );
}
