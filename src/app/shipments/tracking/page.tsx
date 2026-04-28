"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Upload, Search, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

type Row = {
  id: string;
  order: string;
  customer: string;
  carrier: string;
  warehouse: string;
  trackingNo: string;
  notified: boolean;
};

const INITIAL: Row[] = [
  { id: "1", order: "ORD-2026-00851", customer: "山田太郎", carrier: "ヤマト運輸", warehouse: "東京本社倉庫", trackingNo: "", notified: false },
  { id: "2", order: "ORD-2026-00850", customer: "佐藤花子", carrier: "ヤマト運輸", warehouse: "東京本社倉庫", trackingNo: "", notified: false },
  { id: "3", order: "ORD-2026-00849", customer: "田中一郎", carrier: "佐川急便", warehouse: "大阪倉庫", trackingNo: "", notified: false },
  { id: "4", order: "ORD-2026-00848", customer: "鈴木美咲", carrier: "日本郵便", warehouse: "東京本社倉庫", trackingNo: "1234-5678-9012", notified: true },
  { id: "5", order: "ORD-2026-00847", customer: "高橋健", carrier: "ヤマト運輸", warehouse: "九州物流センター", trackingNo: "", notified: false },
  { id: "6", order: "ORD-2026-00846", customer: "渡辺京子", carrier: "佐川急便", warehouse: "東京本社倉庫", trackingNo: "", notified: false },
];

export default function ShipmentsTrackingPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(INITIAL);
  const [keyword, setKeyword] = useState("");
  const [carrier, setCarrier] = useState("すべて");
  const [pendingOnly, setPendingOnly] = useState(true);

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k)) return false;
      if (carrier !== "すべて" && r.carrier !== carrier) return false;
      if (pendingOnly && r.trackingNo) return false;
      return true;
    });
  }, [rows, keyword, carrier, pendingOnly]);

  const updateTracking = (id: string, value: string) => setRows(rows.map((r) => (r.id === id ? { ...r, trackingNo: value } : r)));
  const apply = (id: string) => {
    const r = rows.find((x) => x.id === id);
    if (!r || !r.trackingNo) return;
    setRows(rows.map((x) => (x.id === id ? { ...x, notified: true } : x)));
    toast.show(`${r.order} に追跡番号を反映し、モール通知を送信しました`, "success");
  };
  const applyAll = () => {
    const target = filtered.filter((r) => r.trackingNo && !r.notified);
    if (target.length === 0) {
      toast.show("反映対象がありません");
      return;
    }
    setRows(rows.map((r) => (target.find((t) => t.id === r.id) ? { ...r, notified: true } : r)));
    toast.show(`${target.length} 件の追跡番号を反映しました`, "success");
  };

  const stats = {
    total: rows.length,
    pending: rows.filter((r) => !r.trackingNo).length,
    ready: rows.filter((r) => r.trackingNo && !r.notified).length,
    notified: rows.filter((r) => r.notified).length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">配送番号反映</h1>
            <HelpHint>
              配送業者から取得した追跡番号を受注に紐づけ、モールへの出荷通知を送信します。{"\n"}
              ヤマトB2/佐川e飛伝II からのCSV取込にも対応しています。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未反映: <span className="font-semibold text-amber-700">{stats.pending}件</span> ／ 反映待ち:{" "}
            <span className="font-semibold text-blue-700">{stats.ready}件</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.show("CSV取込モーダルを開きました")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
          >
            <Upload className="h-4 w-4" />CSV一括登録
          </button>
          <PrimaryButton onClick={applyAll}>
            <CheckCircle2 className="h-4 w-4" />一括反映
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">対象受注</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.total}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">追跡番号未取得</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.pending}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">反映待ち</p><p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{stats.ready}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">反映済み</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.notified}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="受注番号・顧客名で検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">配送業者</label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={pendingOnly}
              onChange={(e) => setPendingOnly(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            未反映のみ表示
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">配送業者</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">倉庫</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">追跡番号</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">通知</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">対象受注がありません。</td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className={cn("border-t border-white/30 hover:bg-white/40", r.notified && "opacity-70")}>
                  <td className="px-4 py-3 font-medium text-blue-600">{r.order}</td>
                  <td className="px-4 py-3 text-gray-800">{r.customer}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{r.carrier}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{r.warehouse}</td>
                  <td className="px-4 py-3">
                    <input
                      value={r.trackingNo}
                      onChange={(e) => updateTracking(r.id, e.target.value)}
                      placeholder="追跡番号を入力..."
                      className="w-full h-7 px-2 rounded-lg text-xs font-mono bg-white/60 border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.notified ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />通知済
                      </span>
                    ) : r.trackingNo ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-700">
                        <RefreshCw className="h-3 w-3" />反映待ち
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700">
                        <AlertTriangle className="h-3 w-3" />未取得
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => apply(r.id)}
                      disabled={!r.trackingNo || r.notified}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-medium",
                        r.trackingNo && !r.notified ? "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25" : "bg-gray-200/40 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      反映
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
