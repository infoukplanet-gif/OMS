"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";

type Toggle = { key: string; label: string; hint?: string; enabled: boolean };

const initialToggles: Toggle[] = [
  { key: "session", label: "セッションタイムアウトを有効化（30分）", hint: "未操作30分で自動ログアウト", enabled: true },
  { key: "audit", label: "操作ログを記録する", hint: "全画面遷移・更新操作を監査ログに保存", enabled: true },
  { key: "maintenance", label: "メンテナンスモードを有効化", hint: "管理者以外のアクセスを遮断", enabled: false },
  { key: "desktop", label: "処理完了時にデスクトップ通知", hint: "出荷バッチ・取込完了をブラウザ通知", enabled: true },
  { key: "twoFactor", label: "二段階認証を必須にする", hint: "全ユーザーで2FA必須化", enabled: false },
  { key: "ipRestrict", label: "IPアドレス制限を有効化", hint: "ホワイトリストIPのみ許可", enabled: false },
  { key: "darkmode", label: "夜間モードに対応する", hint: "操作時刻に応じてUIを暗色化", enabled: true },
  { key: "anaytics", label: "利用統計を匿名で送信する", hint: "改善のための匿名利用データ送信", enabled: true },
];

export default function MiscSettingsPage() {
  const toast = useToast();
  const [toggles, setToggles] = useState(initialToggles);
  const setToggle = (key: string, val: boolean) =>
    setToggles((prev) => prev.map((t) => (t.key === key ? { ...t, enabled: val } : t)));

  const [pageSize, setPageSize] = useState("50");
  const [sort, setSort] = useState("受注日降順");
  const [thousands, setThousands] = useState("3桁カンマ区切り");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD HH:mm");
  const [timezone, setTimezone] = useState("Asia/Tokyo (JST)");
  const [language, setLanguage] = useState("日本語");
  const [currency, setCurrency] = useState("JPY (¥)");
  const [theme, setTheme] = useState("Liquid Glass（標準）");

  const [backupTime, setBackupTime] = useState("03:00");
  const [orderRetention, setOrderRetention] = useState("5");
  const [logRetention, setLogRetention] = useState("1");
  const [purgeDays, setPurgeDays] = useState("30");
  const [backupTarget, setBackupTarget] = useState("AWS S3 (s3://oms-backup/daily)");

  const [adminEmail, setAdminEmail] = useState("admin@example.com");
  const [supportTel, setSupportTel] = useState("03-0000-0000");
  const [emergency, setEmergency] = useState("emergency@example.com");
  const [companyCode, setCompanyCode] = useState("OMS-COMPANY-001");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">その他のシステム設定</h1>
            <HelpHint>セッション・表示・バックアップ・サポート連絡先など、上記カテゴリに含まれない全般設定。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">システム動作・表示形式・バックアップ・連絡先を一元管理します。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => toast.show("設定をエクスポートしました", "success")}>エクスポート</SecondaryButton>
          <PrimaryButton onClick={() => toast.show("システム設定を保存しました", "success")}>変更を保存</PrimaryButton>
        </div>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">
          システム動作 <HelpHint>セッション・監査ログ・通知などの全体動作設定。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {toggles.map((t) => (
            <label key={t.key} className={cn("flex items-center justify-between gap-3 p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors cursor-pointer", t.enabled && "ring-1 ring-blue-500/20")}>
              <div>
                <div className="text-sm text-gray-800 font-medium">{t.label}</div>
                {t.hint && <div className="text-xs text-gray-500 mt-0.5">{t.hint}</div>}
              </div>
              <div className="relative inline-flex items-center">
                <input type="checkbox" checked={t.enabled} onChange={(e) => setToggle(t.key, e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </div>
            </label>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">表示設定</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">1ページあたりの表示件数</span>
            <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["20", "50", "100", "200"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">デフォルトソート順</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["受注日降順", "受注日昇順", "金額降順", "顧客名順"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">金額表示区切り</span>
            <select value={thousands} onChange={(e) => setThousands(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["3桁カンマ区切り", "区切りなし", "4桁カンマ区切り（万単位）"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">日付表示形式</span>
            <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["YYYY-MM-DD HH:mm", "YYYY/MM/DD HH:mm", "YYYY年MM月DD日 HH:mm", "MM/DD HH:mm"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">タイムゾーン</span>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["Asia/Tokyo (JST)", "Asia/Seoul (KST)", "Asia/Shanghai (CST)", "UTC"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">表示言語</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["日本語", "English", "한국어", "中文（簡体）"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">通貨</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["JPY (¥)", "USD ($)", "EUR (€)", "CNY (¥)"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">UIテーマ</span>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["Liquid Glass（標準）", "Liquid Glass Dark", "ハイコントラスト", "業務システム標準"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">
          バックアップ・アーカイブ <HelpHint>定期バックアップ・データ保持期間・削除待ちデータの完全消去日数を設定。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">自動バックアップ時刻</span>
            <input type="time" value={backupTime} onChange={(e) => setBackupTime(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">バックアップ保管先</span>
            <input value={backupTarget} onChange={(e) => setBackupTarget(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono text-xs" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">受注データ保持期間（年）</span>
            <input type="number" value={orderRetention} onChange={(e) => setOrderRetention(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">監査ログ保持期間（年）</span>
            <input type="number" value={logRetention} onChange={(e) => setLogRetention(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">削除データの完全消去日数</span>
            <input type="number" value={purgeDays} onChange={(e) => setPurgeDays(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <div className="flex items-end">
            <SecondaryButton onClick={() => toast.show("バックアップを今すぐ実行しました", "success")}>今すぐバックアップ</SecondaryButton>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">サポート連絡先 / 識別情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">システム管理者メール</span>
            <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">サポート電話番号</span>
            <input type="tel" value={supportTel} onChange={(e) => setSupportTel(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">緊急連絡先</span>
            <input type="email" value={emergency} onChange={(e) => setEmergency(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">会社コード</span>
            <input value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono" />
          </label>
        </div>
      </GlassCard>
    </div>
  );
}
