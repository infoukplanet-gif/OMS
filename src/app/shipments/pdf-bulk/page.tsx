"use client";

import { DownloadWizard } from "@/components/download/download-wizard";

export default function ShipmentsPdfBulkPage() {
  return (
    <DownloadWizard
      title="納品書・出荷指示書PDF複数ダウンロード"
      description="期間内の納品書・出荷指示書・送り状ラベルをまとめてPDFで取得します。倉庫委託先への印刷依頼用ZIPも生成できます。"
      hint={"複数の受注を1ファイルに結合 or 受注番号別ZIPで出力できます。\n納品書テンプレート設定で帳票レイアウトを変更可能。"}
      formats={["納品書PDF（受注ごとに1ファイル）","納品書PDF（全受注を1冊に結合）","出荷指示書PDF（倉庫向け）","送り状ラベルPDF（A4 4面）","ZIP（一括）"]}
      filters={[
        { key: "mall", label: "取込元モール", options: ["すべて", "楽天市場", "Yahoo!ショッピング", "Amazon", "自社EC", "卸先EDI"] },
        { key: "carrier", label: "配送業者", options: ["すべて", "ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸"] },
        { key: "template", label: "帳票テンプレート", options: ["標準テンプレート", "ロゴあり (社内通常)", "ロゴあり (BtoB専用)", "簡易納品書"], hint: "帳票テンプレートは「納品書テンプレート」画面で編集できます。" },
        { key: "printed", label: "印刷状態", options: ["未印刷のみ", "印刷済みも含む", "すべて"] },
      ]}
      kpis={[
        { label: "本日の出力枚数", value: "412", unit: "枚" },
        { label: "未印刷待ち", value: "84", unit: "件" },
        { label: "今月の合計DL", value: "284", unit: "回" },
        { label: "平均生成時間", value: "3.2", unit: "秒" },
      ]}
      exampleColumns={["受注番号","顧客名","送付先住所","発送日","配送業者","追跡番号","金額","個口数"]}
      schedules={[
        { id: 1, name: "倉庫委託先向け 出荷指示書ZIP", schedule: "毎日 08:00", format: "ZIP（一括）", recipients: "warehouse@example.com", enabled: true },
        { id: 2, name: "BtoB卸先 納品書PDF", schedule: "毎週月曜 09:00", format: "納品書PDF（全受注を1冊に結合）", recipients: "wholesale-ops@example.com", enabled: true },
      ]}
      history={[
        { id: 1, at: "2026-04-25 08:00", by: "システム", range: "2026-04-25", filters: "標準テンプレート / 未印刷のみ", format: "ZIP（一括）", records: 184, status: "success" },
        { id: 2, at: "2026-04-25 09:42", by: "佐藤 健", range: "2026-04-24 - 04-25", filters: "ヤマト運輸 / 標準テンプレート", format: "送り状ラベルPDF（A4 4面）", records: 92, status: "success" },
        { id: 3, at: "2026-04-24 16:18", by: "鈴木 美咲", range: "2026-04-24", filters: "BtoB専用 / 卸先EDI", format: "納品書PDF（全受注を1冊に結合）", records: 38, status: "success" },
      ]}
    />
  );
}
