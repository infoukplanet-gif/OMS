"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

const data = [
  { order: "ORD-2024-00842", product: "Tシャツ ホワイト M", sku: "TS-WH-M", qty: 2, reason: "検品不良", from: "東京倉庫", to: "返品倉庫", status: "振替待ち" },
  { order: "ORD-2024-00838", product: "スニーカー ブラック 27cm", sku: "SN-BK-27", qty: 1, reason: "配送中破損", from: "東京倉庫", to: "返品倉庫", status: "振替完了" },
  { order: "ORD-2024-00835", product: "ジャケット ネイビー L", sku: "JK-NV-L", qty: 1, reason: "色違い", from: "大阪倉庫", to: "返品倉庫", status: "承認待ち" },
];

const sb: Record<string, string> = {
  振替待ち: "bg-amber-500/15 text-amber-700",
  振替完了: "bg-emerald-500/15 text-emerald-700",
  承認待ち: "bg-blue-500/15 text-blue-700",
};

export default function DefectiveTransferPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">不良品振替</h1>
          <p className="text-sm text-gray-500 mt-1">
            不良品を良品倉庫から返品倉庫へ振り替えます。振替実行時に在庫数が自動更新されます。
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm">
          新規振替登録
        </button>
      </div>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">数量</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">理由</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">振替元</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">振替先</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.order} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3 font-medium text-blue-600">{d.order}</td>
                <td className="px-4 py-3 text-gray-800">{d.product}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{d.sku}</td>
                <td className="px-4 py-3 text-right text-gray-700">{d.qty}</td>
                <td className="px-4 py-3 text-gray-600">{d.reason}</td>
                <td className="px-4 py-3 text-gray-600">{d.from}</td>
                <td className="px-4 py-3 text-gray-600">{d.to}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[d.status])}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">
                    実行
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
