"use client";

import { DownloadWizard } from "@/components/download/download-wizard";

export default function PurchasingOrderDownloadPage() {
  return (
    <DownloadWizard
      title="発注書ダウンロード"
      description="期間内の発注書をPDF/Excelで一括取得します。仕入先別ZIP・経理用集計レポートにも対応しています。"
      hint={"発注書フォーマットは「発注書テンプレート設定」で編集可能。\n仕入先別ZIPで発注先ごとに整理されます。"}
      formats={["発注書PDF（仕入先別ZIP）", "発注書PDF（全件結合）", "Excel（経理用集計）", "汎用CSV"]}
      filters={[
        { key: "supplier", label: "仕入先", options: ["すべて", "株式会社ABC電子", "グローバルパーツ合同会社", "株式会社ケーブルワークス", "アジアサプライ株式会社"] },
        { key: "status", label: "発注ステータス", options: ["すべて", "発注中", "一部入荷", "入荷済", "キャンセル"] },
        { key: "template", label: "テンプレート", options: ["標準テンプレート", "ロゴ入り（A4）", "簡易版", "海外仕入先用（英語）"], hint: "発注書テンプレート設定で編集可能。" },
      ]}
      kpis={[
        { label: "今月の発行数", value: "84", unit: "件" },
        { label: "総発注額", value: "¥18,420,000" },
        { label: "今月の本日DL", value: "12", unit: "回" },
        { label: "未印刷", value: "6", unit: "件" },
      ]}
      exampleColumns={["発注番号","発注日","仕入先名","担当者","品目数","小計","税額","合計","入荷予定日","支払期日","備考"]}
      schedules={[
        { id: 1, name: "経理向け月次サマリー", schedule: "毎月1日 09:00", format: "Excel（経理用集計）", recipients: "accounting@example.com", enabled: true },
      ]}
      history={[
        { id: 1, at: "2026-04-25 10:24", by: "佐藤 健", range: "2026-04-25", filters: "ABC電子 / 発注中", format: "発注書PDF（仕入先別ZIP）", records: 3, status: "success" },
        { id: 2, at: "2026-04-22 14:08", by: "鈴木 美咲", range: "2026-04-01 - 04-22", filters: "全社", format: "Excel（経理用集計）", records: 84, status: "success" },
      ]}
    />
  );
}
