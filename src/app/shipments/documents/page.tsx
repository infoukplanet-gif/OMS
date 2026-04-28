"use client";

import { DownloadWizard } from "@/components/download/download-wizard";

export default function ShipmentsDocumentsPage() {
  return (
    <DownloadWizard
      title="納品書・出荷指示書ダウンロード"
      description="納品書・領収書・受領書・請求書など、出荷に関連する各種書類を期間指定でまとめてダウンロードします。"
      hint={"発行済み書類の再ダウンロード、または未発行書類の生成が可能。\nインボイス番号付きでの出力にも対応しています。"}
      formats={["PDF（書類別フォルダ ZIP）", "PDF（全書類を1冊に結合）", "Excel ワークブック"]}
      filters={[
        { key: "docType", label: "書類種別", options: ["すべて", "納品書", "領収書", "受領書", "請求書", "送り状控え", "明細書"] },
        { key: "invoice", label: "インボイス対応", options: ["すべて", "インボイス番号付きのみ", "インボイス番号なしのみ"], hint: "適格請求書発行事業者として番号付きで出力します。" },
        { key: "issued", label: "発行状態", options: ["未発行のみ", "発行済みも含む", "すべて"] },
        { key: "customer", label: "顧客区分", options: ["すべて", "個人顧客", "卸先（法人）", "VIP顧客"] },
      ]}
      kpis={[
        { label: "本日の発行枚数", value: "284", unit: "枚" },
        { label: "未発行残", value: "42", unit: "件" },
        { label: "今月の発行合計", value: "8,420", unit: "枚" },
        { label: "再発行率", value: "0.8", unit: "%" },
      ]}
      exampleColumns={["受注番号","書類種別","発行日","顧客名","宛名","金額","税額","インボイス番号","発行者","ファイル名"]}
      schedules={[
        { id: 1, name: "卸先 月次請求書バッチ", schedule: "毎月1日 09:00", format: "PDF（書類別フォルダ ZIP）", recipients: "billing@example.com", enabled: true },
        { id: 2, name: "領収書 自動発行", schedule: "毎日 22:00", format: "PDF（書類別フォルダ ZIP）", recipients: "FTP", enabled: true },
      ]}
      history={[
        { id: 1, at: "2026-04-25 10:24", by: "佐藤 健", range: "2026-04-24 - 04-25", filters: "納品書 / インボイス番号付き", format: "PDF（書類別フォルダ ZIP）", records: 184, status: "success" },
        { id: 2, at: "2026-04-24 22:00", by: "システム", range: "2026-04-24", filters: "領収書 / 未発行", format: "PDF（書類別フォルダ ZIP）", records: 248, status: "success" },
        { id: 3, at: "2026-04-22 14:18", by: "鈴木 美咲", range: "2026-04-01 - 04-22", filters: "請求書 / 卸先のみ", format: "PDF（全書類を1冊に結合）", records: 28, status: "success" },
      ]}
    />
  );
}
