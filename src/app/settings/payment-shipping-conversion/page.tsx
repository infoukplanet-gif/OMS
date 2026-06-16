"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { ArrowRight, Plus, Search, Trash2 } from "lucide-react";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  paymentShippingConversionStore,
  INITIAL_CONVERSIONS,
  type Conv,
  type ConvType,
} from "@/lib/stores/payment-shipping-conversion-store";
import { downloadCsv } from "@/lib/export/csv";

const sources = ["楽天RMS", "Yahoo!", "Amazon SP-API", "au PAY マーケット", "Qoo10", "FAX手入力"];
const paymentTargets = ["クレジットカード", "代金引換", "銀行振込（前払い）", "コンビニ決済（後払い）", "Amazon Pay", "PayPay", "NP後払い"];
const shippingTargets = ["ヤマト運輸", "ヤマト運輸（翌日）", "佐川急便", "ゆうパック", "ゆうパケット", "西濃運輸", "福通"];

export default function PaymentShippingConversionPage() {
  const toast = useToast();

  // 永続化オーナー（このページのみ呼ぶ）
  usePersistentStore({
    store: paymentShippingConversionStore,
    domain: "payment-shipping-conversion-settings",
    seed: INITIAL_CONVERSIONS,
  });

  // 共有ストアを購読（編集は即ストアへ反映＝保存ボタンは確認用）
  const items = useSyncExternalStore(
    paymentShippingConversionStore.subscribe,
    paymentShippingConversionStore.getState,
    paymentShippingConversionStore.getState,
  );

  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ConvType>("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items
      .filter((i) => {
        if (k && !`${i.sourceValue} ${i.target}`.toLowerCase().includes(k)) return false;
        if (typeFilter !== "all" && i.type !== typeFilter) return false;
        if (sourceFilter !== "all" && i.source !== sourceFilter) return false;
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
  }, [items, keyword, typeFilter, sourceFilter]);

  const update = (id: string, patch: Partial<Conv>) => {
    const current = paymentShippingConversionStore.findById(id);
    if (!current) return;
    paymentShippingConversionStore.upsert({ ...current, ...patch });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">支払・配送変換設定</h1>
            <HelpHint>外部モールから取り込んだ支払方法・配送方法をOMS内部の標準値に変換するルール。優先度順に最初に一致したルールが適用されます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">楽天・Yahoo!等の支払/配送コードをOMSの標準値に正規化します。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => {
            downloadCsv(
              "支払配送変換設定.csv",
              ["優先度", "種別", "取込元", "ソース値", "変換後", "有効"],
              items.map((i) => [i.priority, i.type === "payment" ? "支払" : "配送", i.source, i.sourceValue, i.target, i.enabled ? "有効" : "無効"]),
            );
            toast.show(`${items.length} 件のマッピング設定をエクスポートしました`, "success");
          }}>エクスポート</SecondaryButton>
          <PrimaryButton onClick={() => toast.show("変換設定を保存しました", "success")}>保存</PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">支払変換ルール</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{items.filter((i) => i.type === "payment").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">配送変換ルール</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">{items.filter((i) => i.type === "shipping").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">有効ルール</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.filter((i) => i.enabled).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">取込元数</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{new Set(items.map((i) => i.source)).size}</div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="ソース値・ターゲット名"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">種別: すべて</option>
            <option value="payment">支払方法</option>
            <option value="shipping">配送方法</option>
          </select>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">取込元: すべて</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setTypeFilter("all"); setSourceFilter("all"); }}>クリア</SecondaryButton>
          <SecondaryButton onClick={() => {
            const newConv: Conv = { id: `c-${Date.now()}`, type: "payment", source: "楽天RMS", sourceValue: "", target: "クレジットカード", enabled: true, priority: 99 };
            paymentShippingConversionStore.upsert(newConv);
          }}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />追加</span>
          </SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {items.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">優先度</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">種別</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">取込元</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ソース値</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">→</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">変換後（OMS標準）</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">有効</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className={cn("border-t border-white/30 hover:bg-white/40", !i.enabled && "opacity-60")}>
                <td className="px-3 py-2.5 text-center">
                  <input type="number" value={i.priority} onChange={(e) => update(i.id, { priority: Number(e.target.value) })} className="w-12 px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs text-center" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", i.type === "payment" ? "bg-blue-500/15 text-blue-700" : "bg-violet-500/15 text-violet-700")}>
                    {i.type === "payment" ? "支払" : "配送"}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <select value={i.source} onChange={(e) => update(i.id, { source: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <input value={i.sourceValue} onChange={(e) => update(i.id, { sourceValue: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs font-mono w-40" />
                </td>
                <td className="px-3 py-2.5 text-center text-gray-400"><ArrowRight className="h-3.5 w-3.5 inline" /></td>
                <td className="px-3 py-2.5">
                  <select value={i.target} onChange={(e) => update(i.id, { target: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    {(i.type === "payment" ? paymentTargets : shippingTargets).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={i.enabled} onChange={(e) => update(i.id, { enabled: e.target.checked })} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button onClick={() => { paymentShippingConversionStore.remove(i.id); toast.show("ルールを削除しました", "info"); }} className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
