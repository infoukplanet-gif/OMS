"use client";
import { GlassCard } from "@/components/ui/glass-card";

const data = [
  { method: "クレジットカード", rate: "3.25%", fixed: "¥0", min: "¥0", max: "-" },
  { method: "代金引換", rate: "-", fixed: "¥330", min: "¥0", max: "¥10,000" },
  { method: "NP後払い", rate: "3.60%", fixed: "¥190", min: "¥0", max: "-" },
  { method: "Atone", rate: "2.90%", fixed: "¥0", min: "¥0", max: "-" },
  { method: "銀行振込", rate: "-", fixed: "¥0", min: "¥0", max: "-" },
  { method: "コンビニ後払い", rate: "4.00%", fixed: "¥210", min: "¥0", max: "-" },
  { method: "Yahoo!かんたん決済", rate: "3.45%", fixed: "¥0", min: "¥0", max: "-" },
  { method: "楽天ペイ", rate: "3.30%", fixed: "¥0", min: "¥0", max: "-" },
];

export default function PaymentFeesPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">支払方法別手数料設定</h1>
        <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm">
          変更を保存
        </button>
      </div>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">支払方法</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">手数料率</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">固定手数料</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">下限額</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">上限額</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.method} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3 font-medium text-gray-800">{d.method}</td>
                <td className="px-4 py-3 text-right text-gray-700">{d.rate}</td>
                <td className="px-4 py-3 text-right text-gray-700">{d.fixed}</td>
                <td className="px-4 py-3 text-right text-gray-700">{d.min}</td>
                <td className="px-4 py-3 text-right text-gray-700">{d.max}</td>
                <td className="px-4 py-3 text-center">
                  <button className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">
                    編集
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
      <GlassCard className="p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">計算ルール</h2>
        <p className="text-sm text-gray-600 leading-6">
          手数料は「手数料率 × 受注金額 + 固定手数料」で算出されます。下限額・上限額が設定されている場合は、その範囲内に丸め込まれます。
          税区分は企業設定の「手数料税区分」に従います。
        </p>
      </GlassCard>
    </div>
  );
}
