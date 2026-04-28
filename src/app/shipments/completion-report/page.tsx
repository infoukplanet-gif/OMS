"use client";

import { DownloadWizard } from "@/components/download/download-wizard";

export default function ShipmentsCompletionReportPage() {
  return (
    <DownloadWizard
      title="発送完了報告ダウンロード"
      description="期間内の発送完了レポートを取得します。荷主・物流委託先・経理向けの月次レポートとして利用してください。"
      hint={"発送業務の実績を集計したレポート。\n配送業者別・倉庫別・モール別の集計サマリーも出力できます。"}
      formats={["CSV", "Excel (xlsx)", "PDF（1ページ集約）"]}
      filters={[
        { key: "groupBy", label: "集計単位", options: ["日別", "週別", "月別", "配送業者別", "倉庫別", "モール別"], hint: "集計の粒度。月次レポートなら「月別」、ピッキング負荷分析なら「日別」が適しています。" },
        { key: "warehouse", label: "対象倉庫", options: ["すべて", "東京本社倉庫", "大阪倉庫", "九州物流センター", "楽天スーパーロジ"] },
        { key: "mall", label: "取込元モール", options: ["すべて", "楽天市場", "Yahoo!ショッピング", "Amazon", "自社EC", "卸先EDI"] },
      ]}
      kpis={[
        { label: "今月の発送件数", value: "8,420", unit: "件" },
        { label: "平均リードタイム", value: "1.4", unit: "日" },
        { label: "完了率", value: "99.6", unit: "%" },
        { label: "差し戻し件数", value: "12", unit: "件" },
      ]}
      exampleColumns={["発送日","受注番号","配送業者","倉庫","モール","顧客名","金額","送料","代引金額","完了時刻","リードタイム","備考"]}
      schedules={[
        { id: 1, name: "月次経理レポート", schedule: "毎月1日 09:00", format: "Excel (xlsx)", recipients: "accounting@example.com", enabled: true },
        { id: 2, name: "倉庫委託先向け週次", schedule: "毎週月曜 10:00", format: "PDF（1ページ集約）", recipients: "warehouse@example.com", enabled: true },
      ]}
      history={[
        { id: 1, at: "2026-04-25 09:00", by: "システム", range: "2026-04-01 - 04-25", filters: "月別 / すべて", format: "Excel (xlsx)", records: 8420, status: "success" },
        { id: 2, at: "2026-04-22 10:00", by: "システム", range: "2026-04-15 - 04-21", filters: "週別 / すべて", format: "PDF（1ページ集約）", records: 1820, status: "success" },
        { id: 3, at: "2026-04-20 14:32", by: "佐藤 健", range: "2026-04-01 - 04-20", filters: "倉庫別 / 東京本社", format: "CSV", records: 4280, status: "success" },
      ]}
    />
  );
}
