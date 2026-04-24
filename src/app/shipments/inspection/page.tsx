"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { ScanBarcode, Check, Download, MapPin, Package, Route } from "lucide-react";

const inspectionItems = [
  { no: 1, image: null, name: "LEXY L'AMOUR レクシーラムーア 新・薬用美容液 35ml", code: "lexy011", qty: 1, scanned: 0, location: "A-01-03" },
  { no: 2, image: null, name: "ワイヤレスイヤホン Pro / ブラック", code: "WEP-001-BK", qty: 2, scanned: 0, location: "B-05-12" },
  { no: 3, image: null, name: "USB-Cケーブル 2m", code: "UCB-002", qty: 3, scanned: 0, location: "A-03-08" },
];

export default function InspectionPage() {
  const [mode, setMode] = useState<"inspection" | "picking">("inspection");
  const [orderNumber, setOrderNumber] = useState("753");
  const [format, setFormat] = useState<"csv" | "tsv">("csv");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">検品・ピッキングサポート</h1>
        <p className="text-sm text-gray-500 mt-1">受注伝票から明細の情報を表示して検品作業をサポートします。ピッキング経路最適化機能を搭載。</p>
      </div>

      {/* モード切替 */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
        <button
          onClick={() => setMode("inspection")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all",
            mode === "inspection"
              ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
              : "text-gray-500 hover:bg-white/40"
          )}
        >
          <ScanBarcode className="h-4 w-4" />検品モード
        </button>
        <button
          onClick={() => setMode("picking")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all",
            mode === "picking"
              ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
              : "text-gray-500 hover:bg-white/40"
          )}
        >
          <Route className="h-4 w-4" />ピッキングモード
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-700 font-medium">NEW</span>
        </button>
      </div>

      {/* 入力 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">[1] 受注伝票番号を入力</h2>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">受注伝票番号</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="受注伝票番号を入力 または バーコードをスキャン"
              autoFocus
              className="w-full h-10 px-4 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-end">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">
              <ScanBarcode className="h-4 w-4" />読込
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 受注明細 */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/40 bg-white/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">[2] 受注明細</h2>
              <p className="text-xs text-gray-500 mt-0.5">伝票番号 【{orderNumber}】 の受注伝票を開く ↗</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-500">データ件数: {inspectionItems.length}件</span>
              <div className="flex gap-1">
                <span className="text-gray-500">形式:</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={format === "csv"} onChange={() => setFormat("csv")} />
                  <span>CSV</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={format === "tsv"} onChange={() => setFormat("tsv")} />
                  <span>TSV</span>
                </label>
              </div>
              <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-600 bg-white/60 border border-white/50 hover:bg-white/80">
                <Download className="h-3 w-3" />ダウンロード
              </button>
            </div>
          </div>
        </div>

        {mode === "inspection" ? (
          // 検品モード
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">no.</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">画像</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品名</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品コード</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">受注数</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">検品済</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">状態</th>
              </tr>
            </thead>
            <tbody>
              {inspectionItems.map(i => (
                <tr key={i.no} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5 text-center text-gray-500">{i.no}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="inline-flex h-10 w-10 rounded-lg bg-gray-100/60 items-center justify-center">
                      <Package className="h-4 w-4 text-gray-400" />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-800">{i.name}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{i.code}</td>
                  <td className="px-3 py-2.5 text-center font-medium text-gray-700">{i.qty}</td>
                  <td className="px-3 py-2.5 text-center font-medium">{i.scanned}</td>
                  <td className="px-3 py-2.5 text-center">
                    {i.scanned === i.qty ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Check className="h-3.5 w-3.5" />完了</span>
                    ) : (
                      <span className="text-xs text-yellow-600">{i.scanned}/{i.qty}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          // ピッキングモード（差別化）
          <div className="p-5 space-y-4">
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-sm font-medium text-emerald-800">🚀 ピッキング経路最適化</p>
              <p className="text-xs text-gray-700 mt-1">倉庫ロケーションに基づいて最短経路で商品を集められるよう、ピッキング順序を自動計算しました。</p>
            </div>

            <div className="space-y-2">
              {[...inspectionItems].sort((a, b) => a.location.localeCompare(b.location)).map((i, idx) => (
                <div key={i.no} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/50 hover:bg-white/70 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <span className="font-mono text-sm font-bold text-orange-700">{i.location}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{i.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{i.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">ピッキング数</p>
                    <p className="text-lg font-bold text-gray-800">{i.qty}<span className="text-sm font-normal text-gray-500">個</span></p>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                    <Check className="h-3.5 w-3.5 inline mr-1" />ピック済
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <p className="text-xs text-gray-500">総ピック数: {inspectionItems.reduce((s, i) => s + i.qty, 0)}個</p>
              <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">
                ピッキング完了 → 検品へ
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
