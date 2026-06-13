"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";

const INITIAL_EVENTS = [
  { time: "2026/04/30 10:25", action: "出荷指示送信", direction: "OMS → Yahoo!ロジ", count: 56, status: "成功" },
  { time: "2026/04/30 10:00", action: "在庫数取得", direction: "Yahoo!ロジ → OMS", count: 4820, status: "成功" },
  { time: "2026/04/30 09:30", action: "出荷実績取込", direction: "Yahoo!ロジ → OMS", count: 48, status: "成功" },
  { time: "2026/04/30 06:00", action: "全件同期（夜間）", direction: "双方向", count: 12450, status: "成功" },
  { time: "2026/04/29 18:00", action: "出荷指示送信", direction: "OMS → Yahoo!ロジ", count: 88, status: "成功" },
];

type ConnStatus = "正常" | "確認中" | "エラー";

export default function YahooLogiPage() {
  const toast = useToast();
  const [storeId, setStoreId] = useState("oms-yshop");
  const [token, setToken] = useState("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
  const [partnerCode, setPartnerCode] = useState("YL-2026-00845");
  const [syncStock, setSyncStock] = useState(true);
  const [autoShip, setAutoShip] = useState(true);
  const [autoReturn, setAutoReturn] = useState(true);
  const [syncInterval, setSyncInterval] = useState("15分");
  const [shipTiming, setShipTiming] = useState("受注確定後即時");
  const [connStatus, setConnStatus] = useState<ConnStatus>("正常");
  const [lastChecked, setLastChecked] = useState("10:25");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [historyEvents, setHistoryEvents] = useState(INITIAL_EVENTS);
  const [refreshing, setRefreshing] = useState(false);

  function handleConnectionTest() {
    setConnStatus("確認中");
    setTimeout(() => {
      setConnStatus("正常");
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setLastChecked(ts);
      toast.show("接続テスト完了：Yahoo!ロジサーバー正常応答", "success");
    }, 1500);
  }

  function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      toast.show("Yahoo!ロジ連携を保存しました", "success");
      setTimeout(() => setSaved(false), 3000);
    }, 1200);
  }

  function handleHistoryRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      const now = new Date();
      const ts = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setHistoryEvents((prev) => [
        { time: ts, action: "在庫数取得", direction: "Yahoo!ロジ → OMS", count: 4820, status: "成功" },
        ...prev,
      ]);
      toast.show("履歴を再読込しました", "info");
    }, 1000);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">Yahoo!ロジ連携</h1>
            <HelpHint>Yahoo!ショッピング配送代行サービス（Yahoo!ロジ）との連携設定。Yahoo!店の出荷を自動委託します。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">Yahoo!ショッピング店の在庫・出荷をYahoo!ロジに委託し、自動連携。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={handleConnectionTest} disabled={connStatus === "確認中"}>
            {connStatus === "確認中" ? (
              <span className="inline-flex items-center gap-1.5"><Loader2 className="h-4 w-4 animate-spin" />確認中</span>
            ) : "接続テスト"}
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="inline-flex items-center gap-1.5"><Loader2 className="h-4 w-4 animate-spin" />保存中...</span>
            ) : saved ? (
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" />保存済</span>
            ) : "保存"}
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">接続状態</div>
            {connStatus === "正常" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            {connStatus === "確認中" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
            {connStatus === "エラー" && <XCircle className="h-4 w-4 text-red-600" />}
          </div>
          <div className={cn("text-2xl font-bold mt-1", connStatus === "正常" ? "text-emerald-600" : connStatus === "確認中" ? "text-blue-600" : "text-red-600")}>
            {connStatus}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">最終確認: {lastChecked}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">本日出荷指示</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">56</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">処理中（Yahoo!ロジ側）</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">12</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">委託在庫数</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">4,820</div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3 inline-flex items-center gap-2">
          接続情報 <HelpHint>Yahoo!ロジ加盟店IDと認証トークン。Yahoo!ショッピング管理画面で発行。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs text-gray-500">Yahoo!ショップID</span>
            <input value={storeId} onChange={(e) => setStoreId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">パートナーコード（Yahoo!ロジ加盟店番号）</span>
            <input value={partnerCode} onChange={(e) => setPartnerCode(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono" />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs text-gray-500">アクセストークン</span>
            <input value={token} onChange={(e) => setToken(e.target.value)} type="password" className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono text-xs" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">在庫同期間隔</span>
            <select value={syncInterval} onChange={(e) => setSyncInterval(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["5分", "15分", "30分", "60分"].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">出荷指示送信タイミング</span>
            <select value={shipTiming} onChange={(e) => setShipTiming(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["受注確定後即時", "15分間隔バッチ", "30分間隔バッチ", "1日1回（13:00）"].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">連携機能</h2>
        <div className="space-y-2">
          {[
            { label: "出荷指示送信（自動委託）", desc: "Yahoo!受注を自動でロジに委託", val: autoShip, setter: setAutoShip },
            { label: "在庫数同期", desc: "委託在庫の最新数をOMSに反映", val: syncStock, setter: setSyncStock },
            { label: "返品入荷取込", desc: "返品入荷の実績取込", val: autoReturn, setter: setAutoReturn },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors">
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
          <h2 className="text-sm font-semibold text-gray-800">同期履歴</h2>
          <SecondaryButton onClick={handleHistoryRefresh} disabled={refreshing}>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              {refreshing ? "読込中..." : "更新"}
            </span>
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
            {historyEvents.map((e, i) => (
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
