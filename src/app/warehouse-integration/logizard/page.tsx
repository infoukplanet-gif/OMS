"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { CheckCircle2, RefreshCw } from "lucide-react";

const events = [
  { time: "2026/04/30 10:32", action: "在庫同期", direction: "ロジザード → OMS", count: 8423, status: "成功" },
  { time: "2026/04/30 10:00", action: "出荷指示送信", direction: "OMS → ロジザード", count: 245, status: "成功" },
  { time: "2026/04/30 09:30", action: "出荷実績取得", direction: "ロジザード → OMS", count: 188, status: "成功" },
  { time: "2026/04/30 09:00", action: "入荷登録", direction: "OMS → ロジザード", count: 12, status: "成功" },
  { time: "2026/04/30 06:00", action: "全件同期（夜間）", direction: "双方向", count: 28430, status: "成功" },
  { time: "2026/04/29 18:30", action: "出荷指示送信", direction: "OMS → ロジザード", count: 312, status: "失敗" },
];

export default function LogizardPage() {
  const toast = useToast();
  const [host, setHost] = useState("https://api.logizard-zero.com");
  const [companyCode, setCompanyCode] = useState("OMS-CORP-0001");
  const [centerCode, setCenterCode] = useState("CENTER-TKY-001");
  const [apiKey, setApiKey] = useState("lzd_xxxx_yyyyyyyyyyyyyyyy");
  const [syncInterval, setSyncInterval] = useState("15分");
  const [autoShip, setAutoShip] = useState(true);
  const [autoStock, setAutoStock] = useState(true);
  const [autoInbound, setAutoInbound] = useState(true);
  const [autoReturn, setAutoReturn] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">ロジザード ZERO 連携</h1>
            <HelpHint>クラウド倉庫管理システム ロジザードZERO との連携設定。在庫・出荷指示・出荷実績・入荷を双方向同期します。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">在庫同期・出荷指示連動・実績取込を自動化し、3PL運用を効率化。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => toast.show("接続テストを開始しました", "info")}>接続テスト</SecondaryButton>
          <PrimaryButton onClick={() => toast.show("ロジザード連携を保存しました", "success")}>保存</PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">接続状態</div>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">正常</div>
          <div className="text-xs text-gray-500 mt-0.5">最終確認: 10:32</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">本日同期件数</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{events.reduce((s, e) => s + e.count, 0).toLocaleString()}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">本日出荷指示</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">245</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">エラー件数（24h）</div>
          <div className="text-2xl font-bold text-red-600 mt-1">1</div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3 inline-flex items-center gap-2">
          接続情報 <HelpHint>ロジザードZEROのAPI接続情報。会社コード・センターコードはロジザード管理画面より取得。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs text-gray-500">APIホスト</span>
            <input value={host} onChange={(e) => setHost(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono text-xs" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">APIキー</span>
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono text-xs" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">会社コード</span>
            <input value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">センターコード</span>
            <input value={centerCode} onChange={(e) => setCenterCode(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">同期間隔</span>
            <select value={syncInterval} onChange={(e) => setSyncInterval(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["5分", "15分", "30分", "60分", "Webhookのみ"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">通知メール（エラー時）</span>
            <input type="email" defaultValue="ops@example.com" className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3 inline-flex items-center gap-2">
          連携機能 <HelpHint>各機能のON/OFFと方向。OFFにすると該当データの自動連携が停止します。</HelpHint>
        </h2>
        <div className="space-y-2">
          {[
            { key: "ship", label: "出荷指示送信（OMS → ロジザード）", desc: "受注確定後にピッキング指示を送信", val: autoShip, setter: setAutoShip },
            { key: "stock", label: "在庫数取得（ロジザード → OMS）", desc: "リアルタイム在庫数をOMSに反映", val: autoStock, setter: setAutoStock },
            { key: "inbound", label: "入荷登録（OMS → ロジザード）", desc: "発注書の入荷予定をロジザードに登録", val: autoInbound, setter: setAutoInbound },
            { key: "return", label: "返品入荷取込（ロジザード → OMS）", desc: "返品商品の入荷実績を自動取込", val: autoReturn, setter: setAutoReturn },
          ].map((f) => (
            <div key={f.key} className="flex items-center justify-between p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-800">{f.label}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={f.val} onChange={(e) => f.setter(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">同期履歴（直近24時間）</h2>
          <SecondaryButton onClick={() => toast.show("同期履歴を再読込しました", "info")}>
            <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-4 w-4" />更新</span>
          </SecondaryButton>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">実行時刻</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">操作</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">方向</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">件数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">結果</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 text-xs text-gray-500">{e.time}</td>
                <td className="px-3 py-2.5 text-gray-800">{e.action}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{e.direction}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{e.count.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", e.status === "成功" ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700")}>
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
