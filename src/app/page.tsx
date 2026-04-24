"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import {
  ShoppingCart,
  DollarSign,
  Truck,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

const kpiData = [
  { label: "本日の受注", value: "47", unit: "件", change: "+12%", icon: ShoppingCart, color: "blue" },
  { label: "本日の売上", value: "¥1,284,500", unit: "", change: "+8%", icon: DollarSign, color: "green" },
  { label: "出荷待ち", value: "23", unit: "件", change: "", icon: Truck, color: "orange" },
  { label: "在庫アラート", value: "5", unit: "件", change: "", icon: AlertTriangle, color: "red" },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-600" },
  green: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-600" },
  red: { bg: "bg-red-500/10", text: "text-red-600" },
};

const statusData = [
  { label: "新規受付", count: 12, color: "bg-blue-500" },
  { label: "確認待ち", count: 8, color: "bg-yellow-500" },
  { label: "出荷待ち", count: 23, color: "bg-orange-500" },
  { label: "出荷済み", count: 156, color: "bg-emerald-500" },
  { label: "完了", count: 1203, color: "bg-gray-400" },
];

const recentOrders = [
  { id: "ORD-2024-00851", shop: "楽天市場", customer: "山田太郎", amount: "¥32,400", status: "新規受付", sc: "bg-blue-500/15 text-blue-700" },
  { id: "ORD-2024-00850", shop: "Amazon", customer: "佐藤花子", amount: "¥8,900", status: "出荷待ち", sc: "bg-orange-500/15 text-orange-700" },
  { id: "ORD-2024-00849", shop: "Shopify", customer: "田中一郎", amount: "¥154,000", status: "確認待ち", sc: "bg-yellow-500/15 text-yellow-700" },
  { id: "ORD-2024-00848", shop: "Yahoo!", customer: "鈴木美咲", amount: "¥5,600", status: "出荷済み", sc: "bg-emerald-500/15 text-emerald-700" },
  { id: "ORD-2024-00847", shop: "楽天市場", customer: "高橋健", amount: "¥22,800", status: "完了", sc: "bg-gray-500/15 text-gray-600" },
];

const lowStockItems = [
  { name: "ワイヤレスイヤホン Pro", sku: "WEP-001", current: 3, safety: 10, danger: true },
  { name: "USB-Cケーブル 2m", sku: "UCB-002", current: 8, safety: 15, danger: false },
  { name: "スマートウォッチバンド", sku: "SWB-003", current: 5, safety: 10, danger: false },
  { name: "モバイルバッテリー 20000mAh", sku: "MBT-004", current: 2, safety: 8, danger: true },
  { name: "保護フィルム セット", sku: "PFS-005", current: 12, safety: 20, danger: false },
];

export default function Dashboard() {
  const total = statusData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpiData.map((kpi) => {
          const c = colorMap[kpi.color];
          return (
            <GlassCard key={kpi.label} className="hover:shadow-[0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  <p className="mt-1 text-3xl font-bold text-gray-800">
                    {kpi.value}
                    <span className="text-lg font-normal text-gray-500">{kpi.unit}</span>
                  </p>
                  {kpi.change && (
                    <div className="mt-2 flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">{kpi.change} 前日比</span>
                    </div>
                  )}
                </div>
                <div className={cn("p-2.5 rounded-xl", c.bg)}>
                  <kpi.icon className={cn("h-5 w-5", c.text)} />
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-4">受注ステータス</h2>
          <div className="space-y-3">
            {statusData.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-20 text-sm text-gray-600">{s.label}</span>
                <div className="flex-1 h-7 rounded-lg bg-gray-100/60 overflow-hidden">
                  <div
                    className={cn("h-full rounded-lg flex items-center pl-3 text-xs font-medium text-white", s.color)}
                    style={{ width: `${Math.max((s.count / total) * 100, 8)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm font-medium text-gray-700">{s.count}件</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-4">売上推移（直近7日間）</h2>
          <div className="h-48 flex items-end gap-2 px-2">
            {[65, 45, 78, 52, 88, 72, 95].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-lg bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                  style={{ height: `${v * 1.8}px` }}
                />
                <span className="text-[10px] text-gray-400">{["月", "火", "水", "木", "金", "土", "日"][i]}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">直近の受注</h2>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">すべて見る →</button>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">受注番号</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">店舗</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">顧客</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">金額</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-t border-white/40 hover:bg-white/40 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-blue-600">{o.id}</td>
                    <td className="px-3 py-2.5 text-gray-600">{o.shop}</td>
                    <td className="px-3 py-2.5 text-gray-700">{o.customer}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-700">{o.amount}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", o.sc)}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">低在庫アラート</h2>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">すべて見る →</button>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品名</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">現在庫</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">安全在庫</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">状態</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item.sku} className="border-t border-white/40 hover:bg-white/40 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="text-gray-700">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.sku}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-medium text-gray-700">{item.current}</td>
                    <td className="px-3 py-2.5 text-center text-gray-500">{item.safety}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                        item.danger ? "bg-red-500/15 text-red-700" : "bg-yellow-500/15 text-yellow-700"
                      )}>
                        {item.danger ? "危険" : "注意"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
