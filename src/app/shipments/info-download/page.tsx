"use client";

import { DownloadWizard } from "@/components/download/download-wizard";

export default function ShipmentsInfoDownloadPage() {
  return (
    <DownloadWizard
      title="配送情報ダウンロード"
      description="出荷指示済み・出荷済みの配送情報（送付先・配送方法・追跡番号等）を期間指定で出力します。倉庫委託・配送業者連携のラベル発行素材として利用できます。"
      hint={"出荷ステータス・配送業者・モール・倉庫で絞り込み可能。\nラベルプリント連携用のフォーマットも選べます。"}
      formats={["CSV", "Excel (xlsx)", "ヤマトB2取込形式", "佐川e飛伝II形式", "ゆうプリR形式"]}
      filters={[
        { key: "status", label: "出荷ステータス", options: ["すべて", "出荷指示済み", "出荷済み", "配達中", "配達完了"], hint: "ステータスで絞り込みます。" },
        { key: "carrier", label: "配送業者", options: ["すべて", "ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運"] },
        { key: "mall", label: "取込元モール", options: ["すべて", "楽天市場", "Yahoo!ショッピング", "Amazon", "自社EC", "卸先EDI"] },
        { key: "warehouse", label: "出荷倉庫", options: ["すべて", "東京本社倉庫", "大阪倉庫", "九州物流センター", "楽天スーパーロジ"] },
      ]}
      kpis={[
        { label: "本日のダウンロード", value: "12", unit: "件" },
        { label: "今月の合計件数", value: "284", unit: "回" },
        { label: "総出力レコード", value: "84,200", unit: "行" },
        { label: "最終DL日時", value: "10:24" },
      ]}
      exampleColumns={["受注番号","出荷日","送付先氏名","送付先郵便番号","送付先住所","送付先電話","配送業者","配送方法","追跡番号","代引金額","送料","個口数","重量","サイズ","倉庫コード","出荷指示者","備考"]}
      schedules={[
        { id: 1, name: "ヤマト B2 連携用 (毎日 16:00)", schedule: "毎日 16:00", format: "ヤマトB2取込形式", recipients: "shipping@example.com / FTP", enabled: true },
        { id: 2, name: "倉庫委託先向け 月次サマリー", schedule: "毎月1日 09:00", format: "Excel", recipients: "warehouse@example.com", enabled: true },
        { id: 3, name: "佐川 e飛伝II 連携用", schedule: "毎日 17:30", format: "佐川e飛伝II形式", recipients: "FTP", enabled: false },
      ]}
      history={[
        { id: 1, at: "2026-04-25 10:24", by: "佐藤 健", range: "2026-04-25", filters: "ヤマト運輸 / 出荷済み", format: "ヤマトB2取込形式", records: 48, status: "success" },
        { id: 2, at: "2026-04-25 09:18", by: "鈴木 美咲", range: "2026-04-24 - 04-25", filters: "すべて", format: "CSV", records: 184, status: "success" },
        { id: 3, at: "2026-04-24 16:00", by: "システム", range: "2026-04-24", filters: "ヤマト運輸", format: "ヤマトB2取込形式", records: 92, status: "success" },
        { id: 4, at: "2026-04-24 11:42", by: "田中 花子", range: "2026-04-23 - 04-24", filters: "Amazon / 出荷指示済み", format: "Excel", records: 38, status: "success" },
        { id: 5, at: "2026-04-23 14:20", by: "高橋 翔", range: "2026-04-23", filters: "佐川急便", format: "佐川e飛伝II形式", records: 0, status: "failed" },
      ]}
    />
  );
}
