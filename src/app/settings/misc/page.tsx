"use client";
import { GlassCard } from "@/components/ui/glass-card";

export default function MiscSettingsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">その他設定</h1>
          <p className="text-sm text-gray-500 mt-1">
            上記カテゴリに収まらないシステム全般の設定をまとめて管理します。
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm">
          変更を保存
        </button>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">システム動作</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4" />
            セッションタイムアウトを有効化（30分）
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4" />
            操作ログを記録する
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" className="accent-blue-500 w-4 h-4" />
            メンテナンスモードを有効化
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4" />
            処理完了時にデスクトップ通知
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">表示設定</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="1ページあたりの表示件数" value="50" />
          <Field label="デフォルトソート順" value="受注日降順" />
          <Field label="金額表示区切り" value="3桁カンマ区切り" />
          <Field label="日付表示形式" value="YYYY-MM-DD HH:mm" />
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">バックアップ・アーカイブ</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="自動バックアップ時刻" value="毎日 03:00" />
          <Field label="受注データ保持期間" value="5年" />
          <Field label="ログ保持期間" value="1年" />
          <Field label="削除データの完全消去日数" value="30日" />
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">サポート連絡先</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="システム管理者メール" value="admin@example.com" />
          <Field label="サポート電話番号" value="03-0000-0000" />
          <Field label="緊急連絡先" value="emergency@example.com" />
          <Field label="会社コード" value="OMS-COMPANY-001" />
        </div>
      </GlassCard>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        defaultValue={value}
        className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
      />
    </div>
  );
}
