"use client";

import { DownloadWizard } from "@/components/download/download-wizard";

export default function ShipmentsStatusDownloadPage() {
  return (
    <DownloadWizard
      title="配送ステータス変更ダウンロード"
      description="出荷状況の現在ステータスをスナップショットで取得します。日次の業務締めや、倉庫委託先への進捗共有に利用してください。"
      hint={"出力時点の最新ステータスをスナップショットします。\n夜間バッチ前のチェックや、出荷遅延の対象抽出に使えます。"}
      formats={["CSV", "Excel (xlsx)", "PDF（一覧）"]}
      filters={[
        { key: "status", label: "ステータス", options: ["すべて", "新規受付", "確認待ち", "出荷指示済み", "出荷済み", "配達中", "配達完了", "保留中"], hint: "「保留中」を選ぶと与信NG・在庫不足などで止まっている受注のみを抽出。" },
        { key: "delay", label: "出荷遅延フラグ", options: ["すべて", "遅延中のみ", "順調な受注のみ"] },
        { key: "warehouse", label: "出荷倉庫", options: ["すべて", "東京本社倉庫", "大阪倉庫", "九州物流センター", "楽天スーパーロジ"] },
      ]}
      kpis={[
        { label: "出荷指示待ち", value: "23", unit: "件" },
        { label: "出荷済み (本日)", value: "184", unit: "件" },
        { label: "保留中", value: "8", unit: "件" },
        { label: "遅延中", value: "3", unit: "件" },
      ]}
      exampleColumns={["受注番号","現ステータス","ステータス更新日時","受注日","出荷予定日","顧客名","倉庫","配送業者","追跡番号","遅延日数","保留理由"]}
      schedules={[
        { id: 1, name: "倉庫委託先向け 朝報", schedule: "毎日 08:00", format: "Excel (xlsx)", recipients: "warehouse@example.com", enabled: true },
        { id: 2, name: "出荷遅延ウォッチ", schedule: "毎日 14:00", format: "CSV", recipients: "ops@example.com", enabled: true },
      ]}
      history={[
        { id: 1, at: "2026-04-25 08:00", by: "システム", range: "スナップショット", filters: "すべて / 倉庫別", format: "Excel (xlsx)", records: 248, status: "success" },
        { id: 2, at: "2026-04-25 07:42", by: "佐藤 健", range: "スナップショット", filters: "保留中のみ", format: "CSV", records: 8, status: "success" },
        { id: 3, at: "2026-04-24 14:00", by: "システム", range: "スナップショット", filters: "遅延中のみ", format: "CSV", records: 5, status: "success" },
      ]}
    />
  );
}
