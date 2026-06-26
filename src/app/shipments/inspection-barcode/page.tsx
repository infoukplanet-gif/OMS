"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { ScanLine, CheckCircle2, AlertTriangle, History, Package, X } from "lucide-react";
import { inspectionStore } from "@/lib/stores/inspection";
import { INITIAL_INSPECTIONS } from "@/lib/seeds/inspection";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  type InspectionRecord,
  isInspectionComplete,
  resolveScan,
  transitionInspection,
} from "@/lib/state-machines/inspection";

type ScanLog = {
  id: number;
  at: string;
  sku: string;
  result: "ok" | "ng" | "duplicate";
  detail?: string;
};

export default function ShipmentsInspectionBarcodePage() {
  const toast = useToast();
  const router = useRouter();

  // 検品セッション（受注ごとのSKUスキャン進捗）は共有ストアに永続化する。
  usePersistentStore({
    store: inspectionStore,
    domain: "inspections",
    seed: INITIAL_INSPECTIONS,
  });
  const records = useSyncExternalStore(
    (cb) => inspectionStore.subscribe(cb),
    () => inspectionStore.getState(),
    () => INITIAL_INSPECTIONS,
  );

  const [orderNo, setOrderNo] = useState("ORD-2026-00851");
  const [completing, setCompleting] = useState(false);
  const [scanCode, setScanCode] = useState("");
  // ログIDの単調増加カウンタ（Date.now() は render 純粋性ルールに抵触するため使わない）。
  const logSeq = useRef(1000);
  // スキャン履歴はセッション中の活動ログ（UIフィード）なので ephemeral。
  const [logs, setLogs] = useState<ScanLog[]>([
    { id: 1, at: "10:24:18", sku: "WEP-001", result: "ok" },
    { id: 2, at: "10:24:14", sku: "WEP-001", result: "ok" },
    { id: 3, at: "10:24:08", sku: "PFS-005", result: "ok" },
    { id: 4, at: "10:24:02", sku: "PFS-005", result: "ok" },
    { id: 5, at: "10:23:58", sku: "PFS-005", result: "duplicate", detail: "既に4回スキャン済み" },
  ]);

  const active: InspectionRecord | undefined = records.find((r) => r.id === orderNo);
  const items = active?.items ?? [];

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanCode.trim().toUpperCase();
    if (!code) return;
    const now = new Date().toLocaleTimeString("ja-JP", { hour12: false });
    if (!active) {
      toast.show(`対象受注が見つかりません: ${orderNo}`, "error");
      setScanCode("");
      return;
    }
    const res = resolveScan(active, code);
    const logId = (logSeq.current += 1);
    if (res.result === "ok") {
      inspectionStore.upsert(res.record);
      setLogs([{ id: logId, at: now, sku: code, result: "ok" }, ...logs]);
      toast.show(`${res.itemName} をスキャンしました`, "success");
    } else if (res.result === "duplicate") {
      setLogs([{ id: logId, at: now, sku: code, result: "duplicate", detail: res.detail }, ...logs]);
      toast.show("既に必要数をスキャン済みです", "error");
    } else {
      setLogs([{ id: logId, at: now, sku: code, result: "ng", detail: res.detail }, ...logs]);
      toast.show(`未知のSKUです: ${code}`, "error");
    }
    setScanCode("");
  };

  const totalRequired = items.reduce((s, i) => s + i.required, 0);
  const totalScanned = items.reduce((s, i) => s + i.scanned, 0);
  const allDone = active ? isInspectionComplete(active) : false;

  const completeShipment = () => {
    if (!active || !allDone || completing) return;
    setCompleting(true);
    inspectionStore.upsert(transitionInspection(active, "complete"));
    const now = new Date().toLocaleTimeString("ja-JP", { hour12: false });
    const logId = (logSeq.current += 1);
    setLogs((prev) => [
      { id: logId, at: now, sku: orderNo, result: "ok", detail: "検品完了・出荷確定へ送信" },
      ...prev,
    ]);
    toast.show(`${orderNo} の検品が完了しました。出荷確定へ移動します`, "success");
    setTimeout(() => {
      router.push(`/shipments/confirm?order=${encodeURIComponent(orderNo)}`);
    }, 600);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">バーコード検品出荷処理</h1>
            <HelpHint>
              SKUバーコードをスキャンしながら、受注内容と現物の一致を検品します。{"\n"}
              全SKUを既定数スキャンすると出荷確定ボタンが有効化されます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            受注: <span className="font-semibold text-blue-700">{orderNo}</span> ／ 進捗:{" "}
            <span className="font-semibold">{totalScanned}/{totalRequired}</span> 個
            {active?.status === "検品完了" && (
              <span className="ml-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />検品完了
              </span>
            )}
          </p>
        </div>
        <PrimaryButton onClick={completeShipment} disabled={!allDone || completing}>
          <CheckCircle2 className="h-4 w-4" />{completing ? "送信中…" : "検品完了 → 出荷確定"}
        </PrimaryButton>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-gray-500">対象受注番号</label>
            <input
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <form onSubmit={handleScan} className="flex-1 min-w-[280px]">
            <label className="text-xs text-gray-500">バーコード入力（スキャナで読み取り）</label>
            <div className="mt-1 flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                <input
                  autoFocus
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  placeholder="SKUコードをスキャン..."
                  className="w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-blue-500/10 border border-blue-300/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
              >
                スキャン
              </button>
            </div>
          </form>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-800">検品対象アイテム</h2>
              <HelpHint>受注に紐付いた商品の必要数とスキャン済み数を表示します。</HelpHint>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">商品名</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">必要数</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">スキャン</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">進捗</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">
                        対象受注の検品アイテムがありません
                      </td>
                    </tr>
                  ) : (
                    items.map((i) => {
                      const done = i.scanned >= i.required;
                      return (
                        <tr key={i.sku} className={cn("border-t border-white/30", done && "bg-emerald-500/5")}>
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{i.sku}</td>
                          <td className="px-4 py-2.5 text-gray-800">{i.name}</td>
                          <td className="px-4 py-2.5 text-center tabular-nums text-gray-700">{i.required}</td>
                          <td className="px-4 py-2.5 text-center tabular-nums font-semibold text-gray-800">{i.scanned}</td>
                          <td className="px-4 py-2.5 text-center">
                            {done ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />完了
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700">
                                残 {i.required - i.scanned}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-800">スキャンログ</h2>
            <HelpHint>直近のスキャン履歴。OK/NG/重複が時系列で表示されます。</HelpHint>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {logs.map((l) => (
              <div
                key={l.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border text-xs",
                  l.result === "ok" && "bg-emerald-500/8 border-emerald-300/30 text-emerald-800",
                  l.result === "ng" && "bg-red-500/8 border-red-300/30 text-red-800",
                  l.result === "duplicate" && "bg-amber-500/8 border-amber-300/30 text-amber-800"
                )}
              >
                {l.result === "ok" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : l.result === "ng" ? <X className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                <span className="text-gray-500 tabular-nums">{l.at}</span>
                <span className="font-mono">{l.sku}</span>
                {l.detail && <span className="text-[10px] opacity-70">— {l.detail}</span>}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
