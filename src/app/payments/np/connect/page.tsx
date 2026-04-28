"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { Save, Key, Shield, RefreshCw, CheckCircle2 } from "lucide-react";

export default function NpConnectPage() {
  const toast = useToast();
  const [merchantId, setMerchantId] = useState("MID-12345");
  const [apiKey, setApiKey] = useState("***********");
  const [endpoint, setEndpoint] = useState("https://api.netprotections.com/v2");
  const [environment, setEnvironment] = useState<"production" | "sandbox">("production");
  const [autoCheckCredit, setAutoCheckCredit] = useState(true);
  const [autoNotifyMethod, setAutoNotifyMethod] = useState(true);
  const [autoSwitchOnNg, setAutoSwitchOnNg] = useState(false);
  const [creditLimit, setCreditLimit] = useState(55000);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">NPコネクト情報登録</h1>
            <HelpHint>
              NP後払い（NPコネクト）の API接続設定とビジネスルールを管理します。{"\n"}
              本番環境のキーは厳重に管理してください。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            最終接続テスト: <span className="font-semibold text-emerald-700">2026-04-25 09:24（成功）</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast.show("接続テストを実行しました（成功）", "success")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
            <RefreshCw className="h-4 w-4" />接続テスト
          </button>
          <PrimaryButton onClick={() => toast.show("NPコネクト設定を保存しました", "success")}>
            <Save className="h-4 w-4" />保存
          </PrimaryButton>
        </div>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">API接続情報</h2>
          <HelpHint>NP社から発行された接続情報を登録します。</HelpHint>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">マーチャントID <span className="text-red-500 text-xs">*必須</span></label>
            <input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className="w-full h-9 px-3 rounded-xl text-sm font-mono bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              APIキー <span className="text-red-500 text-xs">*必須</span>
              <HelpHint side="right">マスク表示しています。再生成はNP管理画面から行ってください。</HelpHint>
            </label>
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" className="w-full h-9 px-3 rounded-xl text-sm font-mono bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">エンドポイントURL</label>
            <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="w-full h-9 px-3 rounded-xl text-sm font-mono bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">環境</label>
            <select value={environment} onChange={(e) => setEnvironment(e.target.value as "production" | "sandbox")} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="production">本番（production）</option>
              <option value="sandbox">サンドボックス（テスト）</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              標準与信限度額
              <HelpHint side="right">NP標準は55,000円。これを超える受注は与信NGになる可能性があります。</HelpHint>
            </label>
            <div className="relative">
              <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(Number(e.target.value))} className="w-full h-9 px-3 pr-10 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">円</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">業務ルール</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Toggle label="受注確定時に自動で与信チェック" checked={autoCheckCredit} onChange={setAutoCheckCredit} hint="OFFの場合、出荷指示時にチェックします。" />
          <Toggle label="与信NG時に顧客へメール通知" checked={autoNotifyMethod} onChange={setAutoNotifyMethod} />
          <Toggle label="与信NG時に支払方法を自動切替（次の手段）" checked={autoSwitchOnNg} onChange={setAutoSwitchOnNg} hint="クレカ・銀行振込の順で再リクエストします。" />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <h2 className="text-base font-semibold text-gray-800">設定で連動する処理</h2>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          {[
            "受注時の与信チェックAPI呼び出し",
            "請求書送付（NP社経由）",
            "請求結果のステータス取込（毎時）",
            "未払い発生時の催促ワークフロー",
            "返金時のキャンセルAPI呼び出し",
          ].map((s) => (
            <li key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50">
              <Shield className="h-3.5 w-3.5 text-blue-500 shrink-0" />{s}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
      <span className="flex items-center gap-1.5">
        {label}
        {hint && <HelpHint side="right">{hint}</HelpHint>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-blue-500 w-4 h-4" />
    </label>
  );
}
