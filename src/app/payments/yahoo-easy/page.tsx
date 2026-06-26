"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  yahooEasyImportStore,
  INITIAL_YAHOO_EASY_IMPORT,
  type YahooEasyImportRecord,
} from "@/lib/stores/yahoo-easy-import-store";
import { cn } from "@/lib/utils";
import { Search, RefreshCw, CheckCircle2, Wallet } from "lucide-react";

type Row = YahooEasyImportRecord;

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function YahooEasyPage() {
  const toast = useToast();
  // payments/yahoo-easy はこのストア（domain: "yahoo-easy-payment-import"）の唯一の永続化オーナー。
  usePersistentStore({
    store: yahooEasyImportStore,
    domain: "yahoo-easy-payment-import",
    seed: INITIAL_YAHOO_EASY_IMPORT,
  });
  const rows = useSyncExternalStore(
    (cb) => yahooEasyImportStore.subscribe(cb),
    () => yahooEasyImportStore.getState(),
    () => INITIAL_YAHOO_EASY_IMPORT as readonly Row[],
  );
  const [keyword, setKeyword] = useState("");
  const [methodFilter, setMethodFilter] = useState("すべて");
  const [syncing, setSyncing] = useState(false);

  const resync = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
      const ymd = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
      const seq = String(rows.length + 1).padStart(3, "0");
      const methods = ["クレカ", "PayPay", "コンビニ", "ペイジー"] as const;
      const newRow: Row = {
        id: `YE-${seq}`,
        order: `ORD-2026-00${826 + rows.length}`,
        customer: "新規取得顧客",
        amount: 8000 + rows.length * 1200,
        method: methods[rows.length % methods.length],
        paidAt: stamp,
        yahooId: `YE-${ymd}-${seq}`,
        ourStatus: "未取込",
        selected: false,
      };
      yahooEasyImportStore.setItems([newRow, ...rows]);
      setSyncing(false);
      toast.show("Yahoo!かんたん決済APIから新規入金1件を取得しました", "success");
    }, 1200);
  };

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k)) return false;
      if (methodFilter !== "すべて" && r.method !== methodFilter) return false;
      return true;
    });
  }, [rows, keyword, methodFilter]);

  const toggle = (id: string) =>
    yahooEasyImportStore.setItems(
      rows.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)),
    );
  const importSelected = () => {
    const target = rows.filter((r) => r.selected && r.ourStatus === "未取込");
    if (target.length === 0) {
      toast.show("取込対象が選択されていません");
      return;
    }
    yahooEasyImportStore.setItems(
      rows.map((r) =>
        target.find((t) => t.id === r.id) ? { ...r, ourStatus: "取込済" as const, selected: false } : r,
      ),
    );
    toast.show(`${target.length}件をOMSに取込みました`, "success");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">Yahoo!かんたん決済入金確認</h1>
            <HelpHint>
              Yahoo!かんたん決済（クレカ・PayPay・コンビニ・ペイジー）の入金状況を取込みます。{"\n"}
              実際のサービス利用には、Yahoo!ストア管理画面のAPI設定が必要です。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未取込: <span className="font-semibold text-amber-700">{rows.filter((r) => r.ourStatus === "未取込").length}件</span>
          </p>
        </div>
        <PrimaryButton onClick={importSelected}>
          <CheckCircle2 className="h-4 w-4" />選択を取込
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["クレカ", "PayPay", "コンビニ", "ペイジー"] as const).map((m) => {
          const count = rows.filter((r) => r.method === m).length;
          const sum = rows.filter((r) => r.method === m).reduce((s, r) => s + r.amount, 0);
          return (
            <GlassCard key={m} className="p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500"><Wallet className="h-4 w-4" />{m}</div>
              <p className="mt-2 text-2xl font-bold text-gray-800 tabular-nums">{count}<span className="text-sm font-normal ml-1">件</span></p>
              <p className="text-xs text-gray-500 tabular-nums">{fmt(sum)}</p>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="受注番号・顧客名" className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="text-xs text-gray-500">決済種別</label>
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["すべて", "クレカ", "PayPay", "コンビニ", "ペイジー"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <button onClick={resync} disabled={syncing} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 disabled:opacity-50">
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />{syncing ? "同期中…" : "API再同期"}
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-center w-10"></th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">金額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">決済種別</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">入金日時</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">Yahoo!ID</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">取込</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 text-center">
                  <input type="checkbox" checked={r.selected} disabled={r.ourStatus === "取込済"} onChange={() => toggle(r.id)} className="accent-blue-500 w-4 h-4 disabled:cursor-not-allowed" />
                </td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{r.order}</td>
                <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(r.amount)}</td>
                <td className="px-3 py-2.5 text-center text-xs">{r.method}</td>
                <td className="px-3 py-2.5 text-xs text-gray-600 tabular-nums">{r.paidAt}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{r.yahooId}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", r.ourStatus === "取込済" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700")}>
                    {r.ourStatus}
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
