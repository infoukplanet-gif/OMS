"use client";

import { DownloadWizard } from "@/components/download/download-wizard";

export default function ShipmentsNotificationDownloadPage() {
  return (
    <DownloadWizard
      title="出荷通知ダウンロード"
      description="モールへ送信する出荷通知データ（楽天RMS・Yahoo!ストア・Amazon SP-API・自社EC）を出力します。アップロード前の最終確認や手動連携にご利用ください。"
      hint={"モールごとに必要なフォーマットが異なります。\n出力形式で各モール仕様を選んでください。"}
      formats={["楽天RMS取込形式", "Yahoo!ストア出荷通知形式", "Amazon SP-API形式", "Shopify Fulfillment形式", "汎用CSV"]}
      filters={[
        { key: "mall", label: "取込元モール", options: ["すべて", "楽天市場", "Yahoo!ショッピング", "Amazon", "自社EC（Shopify）"], hint: "モールを指定すると、そのモールのフォーマットで出力されます。" },
        { key: "shipped", label: "出荷状態", options: ["出荷済みのみ", "出荷指示済みも含む", "すべて"] },
        { key: "notified", label: "通知状態", options: ["未通知のみ", "通知済みも含む", "すべて"], hint: "未通知のみを選ぶと、まだモールへ通知していない受注のみ抽出します。" },
      ]}
      kpis={[
        { label: "本日通知済み", value: "184", unit: "件" },
        { label: "未通知残", value: "12", unit: "件" },
        { label: "通知失敗", value: "0", unit: "件" },
        { label: "今月合計", value: "8,420", unit: "件" },
      ]}
      exampleColumns={["モール受注番号","店舗内受注番号","出荷日","配送業者","追跡番号","送付先氏名","個口数","備考","ステータス"]}
      schedules={[
        { id: 1, name: "楽天 出荷通知バッチ (1日2回)", schedule: "毎日 12:00 / 18:00", format: "楽天RMS取込形式", recipients: "RMS API 自動送信", enabled: true },
        { id: 2, name: "Amazon SP-API 連携 (毎時)", schedule: "毎時0分", format: "Amazon SP-API形式", recipients: "SP-API 自動送信", enabled: true },
        { id: 3, name: "Yahoo! 出荷通知 (毎日 17:00)", schedule: "毎日 17:00", format: "Yahoo!ストア出荷通知形式", recipients: "ストア管理画面 (FTP)", enabled: true },
      ]}
      history={[
        { id: 1, at: "2026-04-25 12:00", by: "システム", range: "2026-04-25", filters: "楽天 / 出荷済み / 未通知", format: "楽天RMS取込形式", records: 84, status: "success" },
        { id: 2, at: "2026-04-25 11:00", by: "システム", range: "2026-04-25", filters: "Amazon / 出荷済み", format: "Amazon SP-API形式", records: 24, status: "success" },
        { id: 3, at: "2026-04-25 09:42", by: "鈴木 美咲", range: "2026-04-25", filters: "Yahoo! / 出荷済み", format: "Yahoo!ストア出荷通知形式", records: 38, status: "success" },
        { id: 4, at: "2026-04-24 18:00", by: "システム", range: "2026-04-24", filters: "楽天 / 出荷済み", format: "楽天RMS取込形式", records: 142, status: "success" },
        { id: 5, at: "2026-04-24 12:00", by: "システム", range: "2026-04-24", filters: "Amazon / 出荷済み", format: "Amazon SP-API形式", records: 68, status: "success" },
      ]}
    />
  );
}
