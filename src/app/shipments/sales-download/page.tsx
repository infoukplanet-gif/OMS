"use client";

import { DownloadWizard } from "@/components/download/download-wizard";

export default function ShipmentsSalesDownloadPage() {
  return (
    <DownloadWizard
      title="出荷実績ダウンロード"
      description="出荷確定ベースの売上データを抽出します。会計・税理士連携・社内KPI集計に利用してください。"
      hint={"出荷確定をもって売上計上する運用に対応しています。\n税抜・税込・送料込みなどの計算ルールはシステム設定で変更できます。"}
      formats={["CSV", "Excel (xlsx)", "freee連携形式", "MFクラウド形式", "弥生販売形式"]}
      filters={[
        { key: "scope", label: "売上区分", options: ["全売上", "通常売上", "返品差引後", "キャンセル除く"], hint: "返品差引後を選ぶと、対象期間の返品額を控除した純売上を出力します。" },
        { key: "tax", label: "税区分", options: ["税抜・税額別出力", "税込のみ", "税抜のみ"] },
        { key: "groupBy", label: "集計単位", options: ["明細単位", "受注単位", "日別合計", "モール別合計", "商品別合計"] },
        { key: "mall", label: "対象モール", options: ["すべて", "楽天市場", "Yahoo!ショッピング", "Amazon", "自社EC", "卸先EDI"] },
      ]}
      kpis={[
        { label: "今月売上 (税抜)", value: "¥38,420,000" },
        { label: "今月返品額", value: "¥482,000" },
        { label: "純売上", value: "¥37,938,000" },
        { label: "売上計上件数", value: "8,420", unit: "件" },
      ]}
      exampleColumns={["売上計上日","受注番号","受注日","発送日","顧客コード","顧客名","モール","商品コード","商品名","数量","税抜金額","税額","税込金額","送料","手数料","値引額","支払方法"]}
      schedules={[
        { id: 1, name: "freee連携バッチ", schedule: "毎日 23:30", format: "freee連携形式", recipients: "freee API 自動送信", enabled: true },
        { id: 2, name: "経理向け月次", schedule: "毎月1日 09:00", format: "Excel (xlsx)", recipients: "accounting@example.com", enabled: true },
        { id: 3, name: "税理士先生向け週次", schedule: "毎週月曜 10:00", format: "MFクラウド形式", recipients: "zeirishi@example.com", enabled: false },
      ]}
      history={[
        { id: 1, at: "2026-04-24 23:30", by: "システム", range: "2026-04-24", filters: "freee連携用 / 全売上", format: "freee連携形式", records: 384, status: "success" },
        { id: 2, at: "2026-04-22 11:42", by: "佐藤 健", range: "2026-04-01 - 04-22", filters: "明細単位 / 楽天", format: "CSV", records: 1820, status: "success" },
        { id: 3, at: "2026-04-19 14:08", by: "鈴木 美咲", range: "2026-03-01 - 03-31", filters: "月別合計", format: "Excel (xlsx)", records: 31, status: "success" },
      ]}
    />
  );
}
