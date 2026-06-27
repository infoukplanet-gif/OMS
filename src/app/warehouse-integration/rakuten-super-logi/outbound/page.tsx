"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Loader2, RefreshCw, Search, Send, Truck } from "lucide-react";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import { rslOutboundStore, type RslOutbound } from "@/lib/stores/rsl-outbound-store";
import { INITIAL_RSL_OUTBOUND } from "@/lib/seeds/rsl-outbound";

type Outbound = RslOutbound;

const sb: Record<string, string> = {
  指示送信: "bg-blue-500/15 text-blue-700",
  ピッキング中: "bg-violet-500/15 text-violet-700",
  梱包中: "bg-amber-500/15 text-amber-700",
  発送済: "bg-emerald-500/15 text-emerald-700",
  保留: "bg-gray-500/15 text-gray-500",
  失敗: "bg-red-500/15 text-red-700",
};

export default function RsrLogiOutboundPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Outbound["status"]>("all");
  const [cutoffFilter, setCutoffFilter] = useState<Date | undefined>(undefined);
  usePersistentStore({ store: rslOutboundStore, domain: "rsl-outbound", seed: INITIAL_RSL_OUTBOUND });
  const items = useSyncExternalStore(
    (cb) => rslOutboundStore.subscribe(cb),
    () => rslOutboundStore.getState(),
    () => INITIAL_RSL_OUTBOUND as readonly Outbound[],
  );
  const [retrying, setRetrying] = useState(false);
  const [sending, setSending] = useState(false);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    const cut = cutoffFilter
      ? `${cutoffFilter.getFullYear()}/${String(cutoffFilter.getMonth() + 1).padStart(2, "0")}/${String(cutoffFilter.getDate()).padStart(2, "0")}`
      : null;
    return items.filter((d) => {
      if (k && !`${d.id} ${d.orderNo} ${d.customer} ${d.trackingNo}`.toLowerCase().includes(k)) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (cut && !d.cutoff.startsWith(cut)) return false;
      return true;
    });
  }, [items, keyword, statusFilter, cutoffFilter]);

  function handleRetryFailed() {
    if (retrying) return;
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      for (const d of rslOutboundStore.getState()) {
        if (d.status === "失敗") {
          rslOutboundStore.upsert({ ...d, status: "指示送信" });
        }
      }
      toast.show("失敗キューを再送しました", "success");
    }, 1500);
  }

  function handleImmediateSend() {
    if (sending) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      for (const d of rslOutboundStore.getState()) {
        if (d.status === "保留" || d.status === "指示送信") {
          rslOutboundStore.upsert({ ...d, status: "ピッキング中" });
        }
      }
      toast.show("出荷指示を即時送信しました", "success");
    }, 1800);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">RSL 出荷処理</h1>
            <HelpHint>RSLへの出荷指示と進捗管理。締切時刻までに送信できなかった指示はアラートされます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">楽天店受注をRSLに自動委託し、ピッキング・梱包・発送状況をリアルタイム確認。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={handleRetryFailed} disabled={retrying}>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className={cn("h-4 w-4", retrying && "animate-spin")} />
              {retrying ? "再送中..." : "失敗を再送"}
            </span>
          </SecondaryButton>
          <PrimaryButton onClick={handleImmediateSend} disabled={sending}>
            <span className="inline-flex items-center gap-1.5">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "送信中..." : "即時送信"}
            </span>
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">本日指示</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.filter((d) => d.cutoff.startsWith("2026/04/30")).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">処理中</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">{items.filter((d) => d.status === "ピッキング中" || d.status === "梱包中").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">発送済</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.filter((d) => d.status === "発送済").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">失敗・保留</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{items.filter((d) => d.status === "失敗" || d.status === "保留").length}</div>
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
              placeholder="出荷ID・受注番号・顧客名・送り状番号"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <DatePicker placeholder="締切日" value={cutoffFilter} onChange={setCutoffFilter} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">状態: すべて</option>
            <option value="指示送信">指示送信</option>
            <option value="ピッキング中">ピッキング中</option>
            <option value="梱包中">梱包中</option>
            <option value="発送済">発送済</option>
            <option value="保留">保留</option>
            <option value="失敗">失敗</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setStatusFilter("all"); setCutoffFilter(undefined); }}>クリア</SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {items.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">出荷ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">配送先〒</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">SKU</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">数量</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">締切</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">発送日時 / 送り状</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{d.id}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-blue-700">{d.orderNo}</td>
                <td className="px-3 py-2.5 text-gray-800">{d.customer}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{d.zipPrefix}-xxxx</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{d.items}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{d.qty}</td>
                <td className="px-3 py-2.5 text-gray-700 text-xs">{d.cutoff}</td>
                <td className="px-3 py-2.5 text-xs">
                  <div className="text-gray-700">{d.shippedAt}</div>
                  {d.trackingNo !== "—" && (
                    <div className="text-gray-400 font-mono inline-flex items-center gap-1"><Truck className="h-3 w-3" />{d.trackingNo}</div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[d.status])}>
                    {d.status === "発送済" && <CheckCircle2 className="h-3 w-3" />}
                    {d.status === "保留" && <Clock className="h-3 w-3" />}
                    {d.status}
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
