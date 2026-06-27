"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { ArrowRight, Box, CheckCircle2, ClipboardList, Inbox, Loader2, RefreshCw, Truck, Undo2, XCircle } from "lucide-react";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import { rslSyncLogStore, type RslSyncLog } from "@/lib/stores/rsl-sync-log-store";
import { INITIAL_RSL_SYNC_LOGS } from "@/lib/seeds/rsl-sync-log";

const subPages = [
  { href: "/warehouse-integration/rakuten-super-logi/setup", title: "初期登録", desc: "店舗情報・連携キー・契約倉庫の登録", icon: ClipboardList, color: "text-blue-600" },
  { href: "/warehouse-integration/rakuten-super-logi/all-stock", title: "在庫一覧", desc: "RSL倉庫の現在在庫を一覧確認", icon: Box, color: "text-emerald-600" },
  { href: "/warehouse-integration/rakuten-super-logi/inbound", title: "入荷指示", desc: "RSLへの入荷予定登録・実績確認", icon: Inbox, color: "text-violet-600" },
  { href: "/warehouse-integration/rakuten-super-logi/outbound", title: "出荷指示", desc: "RSLへの出荷指示登録・実績確認", icon: Truck, color: "text-orange-600" },
  { href: "/warehouse-integration/rakuten-super-logi/process-status", title: "処理状況", desc: "RSL内の処理ステータスをリアルタイム確認", icon: RefreshCw, color: "text-cyan-600" },
  { href: "/warehouse-integration/rakuten-super-logi/return", title: "返品処理", desc: "返品入荷・検品・在庫戻し", icon: Undo2, color: "text-rose-600" },
];

type ConnStatus = "正常" | "確認中" | "エラー";

export default function RsrLogiHomePage() {
  const toast = useToast();
  const [connStatus, setConnStatus] = useState<ConnStatus>("正常");
  const [lastSync, setLastSync] = useState("10:30");
  const [syncing, setSyncing] = useState(false);
  usePersistentStore({ store: rslSyncLogStore, domain: "rsl-sync-log", seed: INITIAL_RSL_SYNC_LOGS });
  const syncLogs = useSyncExternalStore(
    (cb) => rslSyncLogStore.subscribe(cb),
    () => rslSyncLogStore.getState(),
    () => INITIAL_RSL_SYNC_LOGS as readonly RslSyncLog[],
  );
  const events = [...syncLogs].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10);

  function handleConnectionTest() {
    setConnStatus("確認中");
    setTimeout(() => {
      setConnStatus("正常");
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setLastSync(timeStr);
      toast.show("接続テスト完了：RSLサーバー正常応答", "success");
    }, 1500);
  }

  function handleFullSync() {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const p = (v: number) => String(v).padStart(2, "0");
      const dateStr = `${now.getFullYear()}/${p(now.getMonth() + 1)}/${p(now.getDate())} ${timeStr}`;
      const logId = `RSL-SYNC-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
      setLastSync(timeStr);
      rslSyncLogStore.upsert({ id: logId, time: dateStr, action: "全件同期", count: 22130, result: "成功" });
      toast.show("全データの同期が完了しました", "success");
    }, 2000);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">楽天スーパーロジスティクス（RSL）連携</h1>
            <HelpHint>楽天市場の物流代行サービス（RSL）連携トップ。初期登録・在庫・入出荷・返品の各機能をここから遷移できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">楽天店の在庫・出荷・入荷・返品をRSLに完全委託。OMSと自動同期します。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={handleConnectionTest} disabled={connStatus === "確認中"}>
            {connStatus === "確認中" ? (
              <span className="inline-flex items-center gap-1.5"><Loader2 className="h-4 w-4 animate-spin" />確認中</span>
            ) : "接続テスト"}
          </SecondaryButton>
          <PrimaryButton onClick={handleFullSync} disabled={syncing}>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
              {syncing ? "同期中..." : "全件同期"}
            </span>
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
          <div className="text-xs text-gray-500 mt-0.5">最終同期 {lastSync}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">RSL在庫数</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">22,130</div>
          <div className="text-xs text-gray-500 mt-0.5">SKU 845種類</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">本日出荷</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">145</div>
          <div className="text-xs text-gray-500 mt-0.5">処理中 13</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">入荷予定</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">8</div>
          <div className="text-xs text-gray-500 mt-0.5">本日到着予定</div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">RSL連携メニュー</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {subPages.map((p) => (
            <Link key={p.href} href={p.href} className="p-4 rounded-xl bg-white/50 border border-white/60 hover:bg-white/70 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all group">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn("p-2 rounded-xl bg-blue-500/10", p.color)}>
                  <p.icon className="h-4 w-4" />
                </div>
                <h3 className="font-medium text-gray-800">{p.title}</h3>
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-xs text-gray-500">{p.desc}</p>
            </Link>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-sm font-semibold text-gray-800">
          最近の同期履歴
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">時刻</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">操作</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">件数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">結果</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 text-xs text-gray-500">{e.time}</td>
                <td className="px-3 py-2.5 text-gray-800">{e.action}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{e.count.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">{e.result}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
