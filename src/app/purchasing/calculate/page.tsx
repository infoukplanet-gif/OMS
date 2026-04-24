"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Calculator, Play, RefreshCw, Download, Info, AlertCircle } from "lucide-react";

const products = [
  { code: "WEP-001", name: "ワイヤレスイヤホン Pro", free: 25, allocated: 5, constant: 30, reorderPoint: 35, lot: 10, shortage: 5, pendingOrder: 0, recommend: 10, supplier: "株式会社ABC電子" },
  { code: "UCB-002", name: "USB-Cケーブル 2m", free: 6, allocated: 2, constant: 50, reorderPoint: 55, lot: 50, shortage: 44, pendingOrder: 0, recommend: 100, supplier: "ケーブルワークス" },
  { code: "SWB-003", name: "スマートウォッチバンド", free: 5, allocated: 3, constant: 30, reorderPoint: 35, lot: 30, shortage: 25, pendingOrder: 0, recommend: 30, supplier: "株式会社ABC電子" },
  { code: "MBT-004", name: "モバイルバッテリー 20000mAh", free: 1, allocated: 1, constant: 20, reorderPoint: 25, lot: 30, shortage: 19, pendingOrder: 0, recommend: 30, supplier: "グローバルパーツ" },
  { code: "TWS-006", name: "完全ワイヤレスイヤホン", free: 0, allocated: 0, constant: 15, reorderPoint: 20, lot: 20, shortage: 15, pendingOrder: 20, recommend: 0, supplier: "株式会社ABC電子" },
];

export default function CalculatePage() {
  const [showProcess, setShowProcess] = useState(false);
  const [selected, setSelected] = useState<string[]>(products.filter(p => p.recommend > 0).map(p => p.code));

  const toggle = (code: string) => {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">発注計算</h1>
          <p className="text-sm text-gray-500 mt-1">発注計算の開始・状況の確認、欠品数・注残数の更新をすることができます。</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
            <RefreshCw className="h-4 w-4" />欠品数を最新に更新
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
            <RefreshCw className="h-4 w-4" />注残数を最新に更新
          </button>
        </div>
      </div>

      {/* 計算式の説明 */}
      <GlassCard className="bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-gray-800 space-y-2">
            <p className="font-medium">計算式</p>
            <div className="p-3 rounded-xl bg-white/60 font-mono text-xs text-gray-800">
              発注数 = 欠品数 + 在庫定数 − 未入荷の発注残数
            </div>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• <span className="font-medium text-blue-700">在庫定数</span>: 常に保持しておきたい在庫数（商品マスタで設定）</li>
              <li>• <span className="font-medium text-blue-700">発注点</span>: フリー在庫数 + 発注残数 がこの値を下回った商品が計算対象</li>
              <li>• <span className="font-medium text-blue-700">発注ロット</span>: 発注時の最小単位（計算結果はロット単位で繰り上げ）</li>
              <li>• 取扱区分が「取扱中止」「メーカー取扱中止」の商品は対象外</li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* 計算操作 */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-2">発注計算開始</h2>
          <p className="text-xs text-gray-500 mb-3">数分で計算処理が完了します。完了後、発注書ダウンロード画面から発注書を取得してください。</p>
          <button
            onClick={() => setShowProcess(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
          >
            <Play className="h-4 w-4" />発注計算を開始
          </button>
        </GlassCard>

        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-2">発注計算状況確認</h2>
          <p className="text-xs text-gray-500 mb-3">発注計算の進行状況を確認することができます。</p>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
            <RefreshCw className="h-4 w-4" />発注計算状況を確認
          </button>
        </GlassCard>
      </div>

      {/* 確認ダイアログ */}
      {showProcess && (
        <GlassCard className="bg-yellow-500/5 border-yellow-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">発注計算処理を開始しますか？</p>
              <p className="text-xs text-gray-700 mt-1">
                発注計算を行うと、発注状態が「未発行」の発注伝票は全て削除され、
                発注計算の結果に応じて新しい発注伝票が起票されます。
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowProcess(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
                >
                  OK
                </button>
                <button
                  onClick={() => setShowProcess(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 計算結果テーブル */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/40 bg-white/30 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">計算結果プレビュー（{selected.length}件選択中）</h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-white/60 border border-white/50 text-gray-600 hover:bg-white/80">
              <Download className="h-3.5 w-3.5" />発注書ダウンロード
            </button>
            <button
              disabled={selected.length === 0}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                selected.length > 0
                  ? "bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <Calculator className="h-3.5 w-3.5" />発注書を作成（{selected.length}件）
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="w-10 px-2 py-2"><input type="checkbox" className="rounded border-gray-300" /></th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">商品コード</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">商品名</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">仕入先</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">フリー在庫</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">引当数</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">在庫定数</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">発注点</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">欠品数</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">発注残</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">ロット</th>
                <th className="px-2 py-2 text-center font-medium text-blue-700">推奨発注数</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const isReorder = p.recommend > 0;
                return (
                  <tr key={p.code} className={cn(
                    "border-t border-white/30 transition-colors",
                    selected.includes(p.code) ? "bg-blue-500/5" : "hover:bg-white/40"
                  )}>
                    <td className="px-2 py-2"><input type="checkbox" checked={selected.includes(p.code)} onChange={() => toggle(p.code)} className="rounded border-gray-300" /></td>
                    <td className="px-2 py-2 font-mono text-gray-500">{p.code}</td>
                    <td className="px-2 py-2 text-gray-800">{p.name}</td>
                    <td className="px-2 py-2 text-gray-600">{p.supplier}</td>
                    <td className="px-2 py-2 text-center text-gray-700">{p.free}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{p.allocated}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{p.constant}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{p.reorderPoint}</td>
                    <td className="px-2 py-2 text-center font-medium text-orange-600">{p.shortage}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{p.pendingOrder}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{p.lot}</td>
                    <td className="px-2 py-2 text-center">
                      {isReorder ? (
                        <span className="font-bold text-blue-600 text-sm">{p.recommend}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
