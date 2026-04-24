"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Receipt,
  Repeat,
} from "lucide-react";

const kpis = [
  { label: "月間売上", value: "¥12,450,000", change: "+15%", up: true, icon: DollarSign, color: "blue" },
  { label: "月間受注数", value: "1,234", unit: "件", change: "+8%", up: true, icon: ShoppingCart, color: "emerald" },
  { label: "平均注文単価", value: "¥10,089", change: "-2%", up: false, icon: Receipt, color: "purple" },
  { label: "リピート率", value: "34.5%", change: "+3%", up: true, icon: Repeat, color: "cyan" },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-600" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-600" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-600" },
};

const dailySales = [
  { day: "4/1", value: 380 }, { day: "4/2", value: 420 }, { day: "4/3", value: 350 },
  { day: "4/4", value: 490 }, { day: "4/5", value: 530 }, { day: "4/6", value: 310 },
  { day: "4/7", value: 280 }, { day: "4/8", value: 460 }, { day: "4/9", value: 510 },
  { day: "4/10", value: 480 }, { day: "4/11", value: 550 }, { day: "4/12", value: 390 },
  { day: "4/13", value: 340 }, { day: "4/14", value: 290 }, { day: "4/15", value: 470 },
  { day: "4/16", value: 520 }, { day: "4/17", value: 490 }, { day: "4/18", value: 560 },
  { day: "4/19", value: 440 }, { day: "4/20", value: 380 }, { day: "4/21", value: 310 },
  { day: "4/22", value: 500 }, { day: "4/23", value: 530 }, { day: "4/24", value: 480 },
  { day: "4/25", value: 610 }, { day: "4/26", value: 570 }, { day: "4/27", value: 420 },
  { day: "4/28", value: 350 }, { day: "4/29", value: 490 }, { day: "4/30", value: 540 },
];
const maxSales = Math.max(...dailySales.map((d) => d.value));

const channels = [
  { name: "楽天市場", value: 35, amount: "¥4,357,500", color: "bg-red-500" },
  { name: "Amazon", value: 28, amount: "¥3,486,000", color: "bg-orange-400" },
  { name: "Shopify", value: 20, amount: "¥2,490,000", color: "bg-green-500" },
  { name: "Yahoo!", value: 10, amount: "¥1,245,000", color: "bg-purple-500" },
  { name: "卸売", value: 7, amount: "¥871,500", color: "bg-amber-500" },
];

const topProducts = [
  { rank: 1, name: "ワイヤレスイヤホン Pro", sold: 342, revenue: "¥4,377,600", change: "+18%" },
  { rank: 2, name: "モバイルバッテリー 20000mAh", sold: 289, revenue: "¥1,439,220", change: "+12%" },
  { rank: 3, name: "急速充電器 65W", sold: 256, revenue: "¥890,880", change: "+5%" },
  { rank: 4, name: "USB-Cケーブル 2m", sold: 234, revenue: "¥299,520", change: "-3%" },
  { rank: 5, name: "スマートウォッチバンド", sold: 198, revenue: "¥788,040", change: "+22%" },
  { rank: 6, name: "保護フィルム セット", sold: 187, revenue: "¥295,460", change: "+8%" },
  { rank: 7, name: "完全ワイヤレスイヤホン", sold: 156, revenue: "¥1,388,400", change: "+31%" },
  { rank: 8, name: "Bluetoothスピーカー", sold: 134, revenue: "¥938,000", change: "-5%" },
  { rank: 9, name: "タブレットスタンド", sold: 121, revenue: "¥362,790", change: "+10%" },
  { rank: 10, name: "ワイヤレス充電パッド", sold: 98, revenue: "¥293,020", change: "+2%" },
];

const categories = [
  { name: "オーディオ", value: 38, color: "bg-blue-500" },
  { name: "充電器・ケーブル", value: 25, color: "bg-emerald-500" },
  { name: "アクセサリー", value: 20, color: "bg-purple-500" },
  { name: "スマホ周辺", value: 12, color: "bg-orange-500" },
  { name: "その他", value: 5, color: "bg-gray-400" },
];

const periods = ["今日", "今週", "今月", "3ヶ月", "カスタム"];

export default function AnalyticsPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">分析</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-xl bg-white/40 backdrop-blur-xl border border-white/50">
            {periods.map((p, i) => (
              <button
                key={p}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition-all",
                  i === 2
                    ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <button className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium",
            "bg-white/60 backdrop-blur-xl border border-white/50",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
            "text-gray-700 hover:bg-white/80 transition-all"
          )}>
            レポートエクスポート
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const c = colorMap[kpi.color];
          return (
            <GlassCard key={kpi.label} className="hover:shadow-[0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  <p className="mt-1 text-3xl font-bold text-gray-800">
                    {kpi.value}
                    {kpi.unit && <span className="text-lg font-normal text-gray-500">{kpi.unit}</span>}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    {kpi.up ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                    <span className={cn("text-xs font-medium", kpi.up ? "text-emerald-600" : "text-red-600")}>{kpi.change} 前月比</span>
                  </div>
                </div>
                <div className={cn("p-2.5 rounded-xl", c.bg)}>
                  <kpi.icon className={cn("h-5 w-5", c.text)} />
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Sales trend */}
        <GlassCard className="col-span-2">
          <h2 className="text-base font-semibold text-gray-800 mb-4">売上推移（直近30日）</h2>
          <div className="h-52 flex items-end gap-[3px] px-1">
            {dailySales.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-blue-500/25 border border-blue-500/20 hover:bg-blue-500/40 transition-colors cursor-pointer"
                  style={{ height: `${(d.value / maxSales) * 200}px` }}
                  title={`${d.day}: ¥${(d.value * 10000).toLocaleString()}`}
                />
                {i % 5 === 0 && <span className="text-[9px] text-gray-400">{d.day}</span>}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Channel breakdown */}
        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-4">チャネル別売上</h2>
          <div className="space-y-3">
            {channels.map((ch) => (
              <div key={ch.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", ch.color)} />
                    <span className="text-gray-700">{ch.name}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{ch.amount}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100/60 overflow-hidden">
                  <div className={cn("h-full rounded-full", ch.color)} style={{ width: `${ch.value}%`, opacity: 0.6 }} />
                </div>
                <p className="text-right text-[10px] text-gray-400">{ch.value}%</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Top products */}
        <GlassCard className="col-span-2">
          <h2 className="text-base font-semibold text-gray-800 mb-4">売上ランキング TOP10</h2>
          <div className="overflow-hidden rounded-xl border border-white/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50">
                  <th className="w-12 px-3 py-2 text-center text-xs font-medium text-gray-500">#</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品名</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">販売数</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">売上金額</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">前月比</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.rank} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                    <td className="px-3 py-2 text-center">
                      <span className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold",
                        p.rank <= 3 ? "bg-amber-500/15 text-amber-700" : "text-gray-400"
                      )}>
                        {p.rank}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-800">{p.name}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{p.sold}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-800">{p.revenue}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn("text-xs font-medium", p.change.startsWith("+") ? "text-emerald-600" : "text-red-600")}>
                        {p.change}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Categories */}
        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-4">カテゴリ別売上</h2>
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="w-28 text-sm text-gray-600">{cat.name}</span>
                <div className="flex-1 h-7 rounded-lg bg-gray-100/60 overflow-hidden">
                  <div
                    className={cn("h-full rounded-lg flex items-center pl-3 text-xs font-medium text-white", cat.color)}
                    style={{ width: `${cat.value}%`, opacity: 0.7 }}
                  >
                    {cat.value}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
