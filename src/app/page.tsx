"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { cn } from "@/lib/utils";
import {
  ShoppingCart,
  DollarSign,
  Truck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  RotateCcw,
  Mail,
  Users,
  Clock,
  Store,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import {
  ORDER_STATUSES,
  orderStatusBadge,
  type OrderStatus,
} from "@/lib/state-machines/order";
import { mailQueue, type MailJob, type MailTriggerType } from "@/lib/mail/queue";

type PeriodKey = "today" | "week" | "month" | "ytd";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "本日" },
  { key: "week", label: "今週" },
  { key: "month", label: "今月" },
  { key: "ytd", label: "今期" },
];

type Kpi = {
  label: string;
  values: Record<PeriodKey, { value: string; unit?: string; change?: number }>;
  href: string;
  icon: typeof ShoppingCart;
  color: "blue" | "green" | "orange" | "red" | "purple" | "amber";
  hint: string;
};

const KPI_DATA: Kpi[] = [
  {
    label: "受注件数",
    icon: ShoppingCart,
    color: "blue",
    href: "/orders",
    hint: "選択期間内に取り込まれた受注の件数。キャンセル含む全件です。",
    values: {
      today: { value: "47", unit: "件", change: 12 },
      week: { value: "284", unit: "件", change: 8 },
      month: { value: "1,284", unit: "件", change: 15 },
      ytd: { value: "8,420", unit: "件", change: 22 },
    },
  },
  {
    label: "売上金額",
    icon: DollarSign,
    color: "green",
    href: "/analytics/sales",
    hint: "選択期間の確定売上。キャンセル・返品分を除いた純額です。",
    values: {
      today: { value: "¥1,284,500", change: 8 },
      week: { value: "¥8,920,400", change: 12 },
      month: { value: "¥38,420,000", change: 18 },
      ytd: { value: "¥248,200,000", change: 14 },
    },
  },
  {
    label: "出荷待ち",
    icon: Truck,
    color: "orange",
    href: "/shipments",
    hint: "出荷指示が完了していない受注件数。当日中に処理推奨。",
    values: {
      today: { value: "23", unit: "件" },
      week: { value: "48", unit: "件" },
      month: { value: "82", unit: "件" },
      ytd: { value: "—", unit: "" },
    },
  },
  {
    label: "在庫アラート",
    icon: AlertTriangle,
    color: "red",
    href: "/products/inventory",
    hint: "安全在庫を下回っているSKU数。発注計算でリプレニッシュを検討してください。",
    values: {
      today: { value: "5", unit: "件" },
      week: { value: "5", unit: "件" },
      month: { value: "5", unit: "件" },
      ytd: { value: "5", unit: "件" },
    },
  },
  {
    label: "返品処理待ち",
    icon: RotateCcw,
    color: "amber",
    href: "/purchasing/returns",
    hint: "返品申請が登録されたが、入庫検品が完了していない件数。",
    values: {
      today: { value: "3", unit: "件" },
      week: { value: "8", unit: "件" },
      month: { value: "24", unit: "件" },
      ytd: { value: "184", unit: "件" },
    },
  },
  {
    label: "未対応メール",
    icon: Mail,
    color: "purple",
    href: "/mail/pending",
    hint: "顧客から届いた問合せ・クレームのうち、未返信のもの。",
    values: {
      today: { value: "12", unit: "件" },
      week: { value: "18", unit: "件" },
      month: { value: "42", unit: "件" },
      ytd: { value: "—", unit: "" },
    },
  },
];

const COLOR_MAP: Record<Kpi["color"], { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-600" },
  green: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-600" },
  red: { bg: "bg-red-500/10", text: "text-red-600" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-600" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600" },
};

/**
 * 受注ステータス分布（直近30日のスナップショット想定）。
 * 状態定義は src/lib/state-machines/order.ts の ORDER_STATUSES に従う。
 * 後でサーバ集計に置き換える際は ORDER_STATUSES の順を保証して送ってもらう前提。
 */
const ORDER_STATUS_COUNTS: Record<OrderStatus, number> = {
  新規受付: 87,
  確認待ち: 42,
  発売日時待ち: 18,
  入金待ち: 134,
  引当待ち: 76,
  印刷待ち: 58,
  印刷済み: 31,
  出荷済み: 740,
  キャンセル: 48,
};

const TRIGGER_LABEL: Record<MailTriggerType, string> = {
  thanks: "受注確認",
  "ship-notify": "出荷通知",
  "payment-confirmed": "入金確認",
};

const TRIGGER_BADGE: Record<MailTriggerType, string> = {
  thanks: "bg-blue-500/15 text-blue-700",
  "ship-notify": "bg-emerald-500/15 text-emerald-700",
  "payment-confirmed": "bg-violet-500/15 text-violet-700",
};

const SALES_TREND_BY_PERIOD: Record<PeriodKey, { labels: string[]; values: number[] }> = {
  today: {
    labels: ["0時", "4時", "8時", "12時", "16時", "20時"],
    values: [12, 8, 24, 38, 28, 18],
  },
  week: {
    labels: ["月", "火", "水", "木", "金", "土", "日"],
    values: [65, 45, 78, 52, 88, 72, 95],
  },
  month: {
    labels: ["1週", "2週", "3週", "4週"],
    values: [320, 412, 384, 488],
  },
  ytd: {
    labels: ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"],
    values: [820, 880, 920, 1080, 1240, 1180, 1340, 1480, 1620, 1284, 1180, 1320],
  },
};

const RECENT_ORDERS = [
  { id: "ORD-2026-00851", shop: "楽天市場", customer: "山田太郎", amount: "¥32,400", status: "新規受付", sc: "bg-blue-500/15 text-blue-700", date: "10:24" },
  { id: "ORD-2026-00850", shop: "Amazon", customer: "佐藤花子", amount: "¥8,900", status: "出荷待ち", sc: "bg-orange-500/15 text-orange-700", date: "10:18" },
  { id: "ORD-2026-00849", shop: "Shopify", customer: "田中一郎", amount: "¥154,000", status: "確認待ち", sc: "bg-yellow-500/15 text-yellow-700", date: "10:02" },
  { id: "ORD-2026-00848", shop: "Yahoo!", customer: "鈴木美咲", amount: "¥5,600", status: "出荷済み", sc: "bg-emerald-500/15 text-emerald-700", date: "09:48" },
  { id: "ORD-2026-00847", shop: "楽天市場", customer: "高橋健", amount: "¥22,800", status: "完了", sc: "bg-gray-500/15 text-gray-600", date: "09:22" },
];

const LOW_STOCK = [
  { name: "ワイヤレスイヤホン Pro", sku: "WEP-001", current: 3, safety: 10, danger: true },
  { name: "USB-Cケーブル 2m", sku: "UCB-002", current: 8, safety: 15, danger: false },
  { name: "スマートウォッチバンド", sku: "SWB-003", current: 5, safety: 10, danger: false },
  { name: "モバイルバッテリー 20000mAh", sku: "MBT-004", current: 2, safety: 8, danger: true },
  { name: "保護フィルム セット", sku: "PFS-005", current: 12, safety: 20, danger: false },
];

const ALERTS = [
  { id: 1, severity: "critical", title: "出荷遅延の恐れ", body: "本日18時までに出荷必要な12件が未指示です", href: "/shipments", action: "出荷指示画面へ" },
  { id: 2, severity: "warning", title: "与信使用率90%超", body: "卸先2社が与信使用90%を超えています", href: "/customers/wholesale", action: "卸先一覧へ" },
  { id: 3, severity: "warning", title: "在庫切れ寸前", body: "VIP予約商品2点が安全在庫を下回っています", href: "/products/inventory", action: "在庫一覧へ" },
  { id: 4, severity: "info", title: "新規未対応問合せ", body: "メールが12件、未対応のまま24時間経過しました", href: "/mail/pending", action: "メール一覧へ" },
];

const SHOP_SALES = [
  { shop: "楽天市場", orders: 824, sales: 18420000, rate: 38, color: "bg-rose-500" },
  { shop: "Yahoo!ショッピング", orders: 482, sales: 9820000, rate: 21, color: "bg-purple-500" },
  { shop: "Amazon", orders: 384, sales: 8240000, rate: 18, color: "bg-orange-500" },
  { shop: "自社EC（Shopify）", orders: 248, sales: 6420000, rate: 14, color: "bg-emerald-500" },
  { shop: "卸先EDI", orders: 84, sales: 4920000, rate: 9, color: "bg-blue-500" },
];

const STAFF_PERFORMANCE = [
  { name: "佐藤 健", orders: 124, sales: 2840000, target: 3000000 },
  { name: "鈴木 美咲", orders: 108, sales: 2480000, target: 2500000 },
  { name: "田中 花子", orders: 96, sales: 2120000, target: 2500000 },
  { name: "高橋 翔", orders: 82, sales: 1840000, target: 2000000 },
];

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodKey>("today");

  const trend = SALES_TREND_BY_PERIOD[period];
  const max = Math.max(...trend.values, 1);
  const totalStatus = useMemo(
    () => ORDER_STATUSES.reduce((sum, s) => sum + ORDER_STATUS_COUNTS[s], 0),
    [],
  );

  const peakValue = useMemo(() => Math.max(...trend.values), [trend.values]);

  // セッション内 mailQueue のライブスナップショット（初回マウントで取得）
  const [liveMailJobs, setLiveMailJobs] = useState<MailJob[]>([]);
  useEffect(() => {
    setLiveMailJobs(mailQueue.snapshot());
  }, []);
  const liveMailByTrigger = useMemo(() => {
    const map: Record<MailTriggerType, number> = {
      thanks: 0,
      "ship-notify": 0,
      "payment-confirmed": 0,
    };
    for (const job of liveMailJobs) map[job.triggerType]++;
    return map;
  }, [liveMailJobs]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
            <HelpHint>
              主要KPIと業務アラートを一画面で俯瞰します。{"\n"}
              KPIカードをクリックすると該当画面に遷移し、期間タブで集計範囲を切り替えられます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })} 時点のスナップショット
          </p>
        </div>

        {/* 期間切替 */}
        <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-sm transition-all",
                period === p.key
                  ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 業務アラート */}
      {ALERTS.length > 0 && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-800">要対応アラート</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700">{ALERTS.length}件</span>
            <HelpHint>運用に支障が出る可能性のある案件のサマリー。重要度順に表示しています。</HelpHint>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ALERTS.map((a) => (
              <Link
                key={a.id}
                href={a.href}
                className={cn(
                  "flex items-start justify-between gap-3 p-3 rounded-xl border transition-all",
                  a.severity === "critical" && "bg-red-500/8 border-red-300/40 hover:bg-red-500/12",
                  a.severity === "warning" && "bg-amber-500/8 border-amber-300/40 hover:bg-amber-500/12",
                  a.severity === "info" && "bg-blue-500/8 border-blue-300/40 hover:bg-blue-500/12"
                )}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{a.body}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-gray-700 whitespace-nowrap">
                  {a.action}
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>
      )}

      {/* セッション内 自動メールキュー（state-machine handlers が enqueue した分） */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-800">セッション内 自動メールキュー</h2>
            <HelpHint>
              受注/出荷/入金の state machine から handler.sendMail で自動 enqueue されたジョブの内訳。同一セッション内のみ保持されます。詳細は送信待ちキュー画面で確認できます。
            </HelpHint>
          </div>
          <Link href="/mail/pending" className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-0.5">
            送信待ちキューへ <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl p-3 bg-white/40 border border-white/50">
            <div className="text-xs text-gray-500">合計 enqueue</div>
            <div className="text-2xl font-bold text-gray-800 tabular-nums mt-1">{liveMailJobs.length}</div>
          </div>
          {(Object.keys(liveMailByTrigger) as MailTriggerType[]).map((triggerType) => (
            <div key={triggerType} className="rounded-xl p-3 bg-white/40 border border-white/50">
              <div>
                <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap", TRIGGER_BADGE[triggerType])}>
                  {TRIGGER_LABEL[triggerType]}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-800 tabular-nums mt-1">{liveMailByTrigger[triggerType]}</div>
            </div>
          ))}
        </div>
        {liveMailJobs.length === 0 && (
          <p className="mt-3 text-xs text-gray-400">
            まだ自動 enqueue されたメールはありません。受注一覧の一括「入金待ちへ / 出荷登録」や入金登録で自動的に積まれます。
          </p>
        )}
      </GlassCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPI_DATA.map((kpi) => {
          const c = COLOR_MAP[kpi.color];
          const v = kpi.values[period];
          return (
            <Link key={kpi.label} href={kpi.href} className="block group">
              <GlassCard className="h-full transition-all group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] group-hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-gray-500 truncate">{kpi.label}</p>
                      <HelpHint side="bottom">{kpi.hint}</HelpHint>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-800 tabular-nums">
                      {v.value}
                      {v.unit && <span className="text-sm font-normal text-gray-500 ml-0.5">{v.unit}</span>}
                    </p>
                    {v.change !== undefined && (
                      <div className="mt-1.5 flex items-center gap-1">
                        {v.change >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            v.change >= 0 ? "text-emerald-600" : "text-red-600"
                          )}
                        >
                          {v.change > 0 ? "+" : ""}
                          {v.change}% 前期比
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={cn("p-2 rounded-xl shrink-0", c.bg)}>
                    <kpi.icon className={cn("h-4 w-4", c.text)} />
                  </div>
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      {/* 受注ステータス + 売上推移 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-800">受注ステータス内訳</h2>
              <HelpHint>state-machines/order.ts の ORDER_STATUSES 全 9 状態の件数。クリックで該当ステータスの受注一覧へ遷移します。</HelpHint>
            </div>
            <span className="text-xs text-gray-500">合計 {totalStatus.toLocaleString()} 件</span>
          </div>
          <div className="space-y-1.5">
            {ORDER_STATUSES.map((status) => {
              const count = ORDER_STATUS_COUNTS[status];
              const ratio = totalStatus === 0 ? 0 : Math.round((count / totalStatus) * 100);
              return (
                <Link
                  key={status}
                  href={`/orders?status=${encodeURIComponent(status)}`}
                  className="flex items-center gap-3 group hover:bg-white/40 rounded-lg -mx-1.5 px-1.5 py-1 transition-colors"
                >
                  <span className={cn("inline-flex w-24 justify-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap shrink-0", orderStatusBadge[status])}>
                    {status}
                  </span>
                  <div className="flex-1 h-5 rounded-lg bg-gray-100/60 overflow-hidden">
                    <div
                      className="h-full rounded-lg bg-blue-500/40 group-hover:bg-blue-500/55 transition-colors"
                      style={{ width: `${Math.max(ratio, 2)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm font-medium text-gray-700 tabular-nums shrink-0">{count.toLocaleString()}件</span>
                  <span className="w-9 text-right text-[10px] text-gray-400 tabular-nums shrink-0">{ratio}%</span>
                </Link>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-800">売上推移</h2>
              <HelpHint>選択期間の売上推移。期間タブで日次/週次/月次/月別に切替できます。</HelpHint>
            </div>
            <span className="text-xs text-gray-500">ピーク: {peakValue.toLocaleString()}</span>
          </div>
          <div className="h-48 flex items-end gap-2 px-2">
            {trend.values.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {v}
                </span>
                <div
                  className="w-full rounded-t-lg bg-blue-500/20 border border-blue-500/30 group-hover:bg-blue-500/40 transition-colors"
                  style={{ height: `${(v / max) * 160 + 8}px` }}
                />
                <span className="text-[10px] text-gray-400 truncate">{trend.labels[i]}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* モール別売上 + 担当者別 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-800">モール別売上</h2>
              <HelpHint>取込元チャネル別の売上構成。比率は今月実績ベースです。</HelpHint>
            </div>
            <Link href="/analytics/sales" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              詳細分析 →
            </Link>
          </div>
          <div className="space-y-3">
            {SHOP_SALES.map((s) => (
              <div key={s.shop} className="flex items-center gap-3">
                <span className="w-32 text-sm text-gray-700 truncate">{s.shop}</span>
                <div className="flex-1 h-6 rounded-lg bg-gray-100/60 overflow-hidden">
                  <div className={cn("h-full rounded-lg", s.color)} style={{ width: `${s.rate * 2}%` }} />
                </div>
                <div className="w-32 text-right">
                  <span className="text-sm font-medium text-gray-800 tabular-nums">{fmt(s.sales)}</span>
                  <p className="text-[10px] text-gray-500 tabular-nums">{s.orders} 件 / {s.rate}%</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-800">担当者別実績（今月）</h2>
              <HelpHint>担当営業ごとの今月売上と目標達成率。受注画面の担当者で集計しています。</HelpHint>
            </div>
            <Link href="/analytics" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              全期間で見る →
            </Link>
          </div>
          <div className="space-y-3">
            {STAFF_PERFORMANCE.map((s) => {
              const rate = Math.round((s.sales / s.target) * 100);
              return (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-800">{s.name}</span>
                    <span className="text-xs text-gray-500 tabular-nums">
                      {fmt(s.sales)} / {fmt(s.target)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-gray-100/60 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          rate >= 100 ? "bg-emerald-500" : rate >= 80 ? "bg-blue-500" : "bg-amber-500"
                        )}
                        style={{ width: `${Math.min(rate, 100)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "w-12 text-right text-xs font-semibold tabular-nums",
                        rate >= 100 ? "text-emerald-700" : rate >= 80 ? "text-blue-700" : "text-amber-700"
                      )}
                    >
                      {rate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>{s.orders} 件処理</span>
                    {rate >= 100 ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />達成
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-gray-500">
                        <Clock className="h-3 w-3" />進行中
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* 直近受注 + 在庫アラート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-800">直近の受注</h2>
              <HelpHint>取込済みの最新受注 5件。クリックで受注詳細へ遷移します。</HelpHint>
            </div>
            <Link href="/orders" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              すべて見る →
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">受注番号</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">店舗</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">顧客</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">金額</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">状態</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">時刻</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ORDERS.map((o) => (
                  <tr key={o.id} className="border-t border-white/40 hover:bg-white/40 transition-colors">
                    <td className="px-3 py-2.5">
                      <Link href={`/orders/details?id=${o.id}`} className="font-medium text-blue-600 hover:underline">
                        {o.id}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{o.shop}</td>
                    <td className="px-3 py-2.5 text-gray-700">{o.customer}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-700 tabular-nums">{o.amount}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", o.sc)}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-gray-500 tabular-nums">{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-800">低在庫アラート</h2>
              <HelpHint>安全在庫を下回ったSKU。発注計算へ進んでリプレニッシュ可能です。</HelpHint>
            </div>
            <Link href="/products/inventory" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              在庫一覧へ →
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">現在庫</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">安全在庫</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">状態</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {LOW_STOCK.map((item) => (
                  <tr key={item.sku} className="border-t border-white/40 hover:bg-white/40 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="text-gray-700">{item.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{item.sku}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-medium text-gray-800 tabular-nums">{item.current}</td>
                    <td className="px-3 py-2.5 text-center text-gray-500 tabular-nums">{item.safety}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium",
                          item.danger ? "bg-red-500/15 text-red-700" : "bg-yellow-500/15 text-yellow-700"
                        )}
                      >
                        {item.danger ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {item.danger ? "危険" : "注意"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Link
                        href="/purchasing/calculate"
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        発注 →
                      </Link>
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
