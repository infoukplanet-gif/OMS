"use client";
import { useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Package, Shield, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  channelAllocationStore,
  INITIAL_CHANNEL_ALLOCATION,
  type ChannelAlloc,
  type ChannelAllocationConfig,
} from "@/lib/stores/channel-allocation";

const CONFIG_ID = "config";

export default function StockAllocationPage() {
  const toast = useToast();

  // 永続化オーナー（このページがストアの正規オーナー）
  usePersistentStore({
    store: channelAllocationStore,
    domain: "channel-allocation",
    seed: INITIAL_CHANNEL_ALLOCATION,
  });

  // ストアを購読し、1レコード設定を取り出す
  const allItems = useSyncExternalStore(
    channelAllocationStore.subscribe,
    channelAllocationStore.getState,
    channelAllocationStore.getState,
  );

  const savedConfig: ChannelAllocationConfig =
    allItems.find((c) => c.id === CONFIG_ID) ?? INITIAL_CHANNEL_ALLOCATION[0];

  // 編集用ローカルドラフト（保存ボタンまでストアに反映しない）
  const [channels, setChannels] = useState<ChannelAlloc[]>(() => [...savedConfig.channels]);
  const [syncInterval, setSyncInterval] = useState(() => savedConfig.syncInterval);
  const [applyScope, setApplyScope] = useState(() => savedConfig.applyScope);
  const [lowStockAction, setLowStockAction] = useState(() => savedConfig.lowStockAction);
  const [lowStockThreshold, setLowStockThreshold] = useState(() => savedConfig.lowStockThreshold);
  const [autoRedistribute, setAutoRedistribute] = useState(() => savedConfig.autoRedistribute);
  const [priorityOnShortage, setPriorityOnShortage] = useState(() => savedConfig.priorityOnShortage);

  const total = channels.filter((c) => c.enabled).reduce((s, c) => s + c.ratio, 0);
  const totalValid = total === 100;

  function update<K extends keyof ChannelAlloc>(key: string, field: K, value: ChannelAlloc[K]) {
    setChannels((prev) => prev.map((c) => (c.key === key ? { ...c, [field]: value } : c)));
  }

  function equalize() {
    const enabled = channels.filter((c) => c.enabled);
    if (enabled.length === 0) return;
    const base = Math.floor(100 / enabled.length);
    const remainder = 100 - base * enabled.length;
    setChannels((prev) =>
      prev.map((c) => {
        if (!c.enabled) return { ...c, ratio: 0 };
        const idx = enabled.findIndex((e) => e.key === c.key);
        return { ...c, ratio: base + (idx < remainder ? 1 : 0) };
      })
    );
    toast.show("有効チャネルに均等配分しました");
  }

  function handleSave() {
    if (!totalValid) return toast.show(`合計が${total}%です。100%になるよう調整してください`, "error");
    channelAllocationStore.upsert({
      id: CONFIG_ID,
      channels,
      syncInterval,
      applyScope,
      lowStockAction,
      lowStockThreshold,
      autoRedistribute,
      priorityOnShortage,
    });
    toast.show("在庫振り分け設定を保存しました");
  }

  function handleDiscard() {
    const current = channelAllocationStore.findById(CONFIG_ID) ?? INITIAL_CHANNEL_ALLOCATION[0];
    setChannels([...current.channels]);
    setSyncInterval(current.syncInterval);
    setApplyScope(current.applyScope);
    setLowStockAction(current.lowStockAction);
    setLowStockThreshold(current.lowStockThreshold);
    setAutoRedistribute(current.autoRedistribute);
    setPriorityOnShortage(current.priorityOnShortage);
    toast.show("変更を破棄しました");
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">在庫振り分け設定</h1>

      <GlassCard>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            チャネルごとの在庫配分比率、安全在庫数、欠品時の挙動を設定します。
            設定はすべての商品、または指定カテゴリに一括適用できます。
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">適用対象</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">適用範囲</label>
            <select
              value={applyScope}
              onChange={(e) => setApplyScope(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
            >
              <option value="all">すべての商品に適用</option>
              <option value="category">指定カテゴリのみ</option>
              <option value="brand">指定ブランドのみ</option>
              <option value="sku">個別SKUのみ</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">在庫同期間隔</label>
            <select
              value={syncInterval}
              onChange={(e) => setSyncInterval(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
            >
              <option value="realtime">リアルタイム（推奨）</option>
              <option value="1">1分ごと</option>
              <option value="5">5分ごと</option>
              <option value="15">15分ごと</option>
              <option value="60">1時間ごと</option>
              <option value="manual">手動同期のみ</option>
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            チャネル別 配分比率
          </h2>
          <button type="button" onClick={equalize} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />均等配分
          </button>
        </div>
        <div className="space-y-2">
          {channels.map((c) => (
            <div
              key={c.key}
              className={cn(
                "grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-white/50 border border-white/60",
                !c.enabled && "opacity-50"
              )}
            >
              <div className="col-span-3 flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={c.enabled}
                    onChange={(e) => update(c.key, "enabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
                <span className="text-sm font-medium text-gray-800">{c.label}</span>
              </div>
              <div className="col-span-5">
                <div className="flex items-center gap-2">
                  <input
                    type="range" min={0} max={100} value={c.ratio}
                    onChange={(e) => update(c.key, "ratio", Number(e.target.value))}
                    disabled={!c.enabled}
                    className="flex-1"
                  />
                  <input
                    type="number" min={0} max={100} value={c.ratio}
                    onChange={(e) => update(c.key, "ratio", Number(e.target.value))}
                    disabled={!c.enabled}
                    className="w-16 h-7 px-2 rounded-lg text-xs text-right bg-white border border-white/60"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-gray-400" />
                  <input
                    type="number" min={0} value={c.reservedUnits}
                    onChange={(e) => update(c.key, "reservedUnits", Number(e.target.value))}
                    disabled={!c.enabled}
                    className="w-16 h-7 px-2 rounded-lg text-xs text-right bg-white border border-white/60"
                  />
                  <span className="text-xs text-gray-500">個予約</span>
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={c.overSellAllowed}
                    onChange={(e) => update(c.key, "overSellAllowed", e.target.checked)}
                    disabled={!c.enabled}
                    className="rounded"
                  />
                  <span className="text-gray-600">オーバーセル可</span>
                </label>
              </div>
            </div>
          ))}
        </div>
        <div
          className={cn(
            "mt-4 p-3 rounded-xl border flex items-center justify-between",
            totalValid ? "bg-emerald-500/10 border-emerald-400/40" : "bg-amber-500/10 border-amber-400/40"
          )}
        >
          <span className="text-sm text-gray-700">有効チャネルの合計配分</span>
          <span className={cn("text-lg font-bold", totalValid ? "text-emerald-700" : "text-amber-700")}>
            {total}%
            {!totalValid && <span className="text-xs ml-2">（100%になるよう調整してください）</span>}
          </span>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">欠品時の動作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">欠品閾値（残り）</label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-24 h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
              />
              <span className="text-sm text-gray-500">個以下</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">欠品時の動作</label>
            <select
              value={lowStockAction}
              onChange={(e) => setLowStockAction(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
            >
              <option value="pause">販売停止</option>
              <option value="notify">通知のみ</option>
              <option value="redistribute">他チャネルへ再配分</option>
              <option value="preorder">予約販売に切替</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">優先チャネル</label>
            <select
              value={priorityOnShortage}
              onChange={(e) => setPriorityOnShortage(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
            >
              {channels.map((c) => (
                <option key={c.key} value={c.label}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 mt-4 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={autoRedistribute}
            onChange={(e) => setAutoRedistribute(e.target.checked)}
            className="rounded"
          />
          <span className="text-gray-700">欠品発生時に余剰在庫を自動再配分する</span>
        </label>
      </GlassCard>

      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={handleDiscard}>変更を破棄</SecondaryButton>
        <PrimaryButton onClick={handleSave}>設定を保存</PrimaryButton>
      </div>
    </div>
  );
}
