"use client";
import { GlassCard } from "@/components/ui/glass-card";

const rules = [
  { from: "レディース > トップス > Tシャツ", fromSource: "楽天", to: "アパレル/トップス/Tシャツ" },
  { from: "Women > Tops > Tee", fromSource: "Amazon", to: "アパレル/トップス/Tシャツ" },
  { from: "ファッション > シャツ", fromSource: "Yahoo!", to: "アパレル/トップス/シャツ" },
  { from: "家電 > 生活家電 > 掃除機", fromSource: "楽天", to: "家電/生活家電/掃除機" },
  { from: "雑貨 > キッチン > 食器", fromSource: "自社EC", to: "ライフ/キッチン/食器" },
];

export default function CategoryConversionPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">カテゴリ変換設定</h1>
          <p className="text-sm text-gray-500 mt-1">
            モール毎のカテゴリ表記を自社標準カテゴリへ正規化します。
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm">
          新規ルール追加
        </button>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">変換元カテゴリ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">取得元</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">変換先カテゴリ</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r, i) => (
              <tr key={i} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3 text-gray-700">{r.from}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/15 text-gray-700">
                    {r.fromSource}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{r.to}</td>
                <td className="px-4 py-3 text-center space-x-1">
                  <button className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">
                    編集
                  </button>
                  <button className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25">
                    削除
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
