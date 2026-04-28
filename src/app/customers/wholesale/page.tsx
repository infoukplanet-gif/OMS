"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { cn } from "@/lib/utils";
import {
  Plus,
  Upload,
  Pencil,
  Search,
  Building2,
  TrendingUp,
  AlertTriangle,
  Banknote,
  Download,
  ArrowUpDown,
  X,
} from "lucide-react";

type Wholesale = {
  code: string;
  name: string;
  kana: string;
  contact: string;
  terms: string;
  creditLimit: number;
  creditUsed: number;
  group: "S" | "A" | "B" | "C";
  status: "通常" | "重点" | "新規" | "停止";
  monthSales: number;
  ytdSales: number;
  delays: number;
  prefecture: string;
  startedAt: string;
};

const ALL_CLIENTS: Wholesale[] = [
  { code: "WS-001", name: "株式会社ABC商事", kana: "エービーシーショウジ", contact: "山本部長", terms: "月末締翌月末払", creditLimit: 500000, creditUsed: 384000, group: "A", status: "通常", monthSales: 248000, ytdSales: 3120000, delays: 0, prefecture: "東京都", startedAt: "2022-04-15" },
  { code: "WS-002", name: "グローバルトレード合同会社", kana: "グローバルトレード", contact: "李マネージャー", terms: "月末締翌々月末払", creditLimit: 1000000, creditUsed: 920000, group: "S", status: "重点", monthSales: 1284000, ytdSales: 18420500, delays: 0, prefecture: "大阪府", startedAt: "2020-09-01" },
  { code: "WS-003", name: "北海道物産株式会社", kana: "ホッカイドウブッサン", contact: "鈴木課長", terms: "月末締翌月末払", creditLimit: 300000, creditUsed: 184000, group: "B", status: "通常", monthSales: 142000, ytdSales: 1820000, delays: 0, prefecture: "北海道", startedAt: "2023-06-12" },
  { code: "WS-004", name: "九州フードサービス", kana: "キュウシュウフード", contact: "田中支店長", terms: "20日締翌月10日払", creditLimit: 800000, creditUsed: 640000, group: "A", status: "重点", monthSales: 720000, ytdSales: 8920000, delays: 1, prefecture: "福岡県", startedAt: "2021-11-20" },
  { code: "WS-005", name: "東海卸センター株式会社", kana: "トウカイオロシ", contact: "佐藤主任", terms: "月末締翌月20日払", creditLimit: 600000, creditUsed: 240000, group: "B", status: "通常", monthSales: 320000, ytdSales: 4480000, delays: 0, prefecture: "愛知県", startedAt: "2022-02-08" },
  { code: "WS-006", name: "関西商事 株式会社", kana: "カンサイショウジ", contact: "村田専務", terms: "月末締翌月末払", creditLimit: 1200000, creditUsed: 1180000, group: "S", status: "重点", monthSales: 1480000, ytdSales: 21340000, delays: 0, prefecture: "京都府", startedAt: "2018-04-01" },
  { code: "WS-007", name: "信越流通", kana: "シンエツリュウツウ", contact: "高橋係長", terms: "10日締翌月末払", creditLimit: 200000, creditUsed: 0, group: "C", status: "新規", monthSales: 0, ytdSales: 84000, delays: 0, prefecture: "長野県", startedAt: "2026-04-01" },
  { code: "WS-008", name: "南九州ロジスティクス", kana: "ミナミキュウシュウ", contact: "前田室長", terms: "月末締翌々月末払", creditLimit: 400000, creditUsed: 412000, group: "B", status: "通常", monthSales: 224000, ytdSales: 2480000, delays: 2, prefecture: "鹿児島県", startedAt: "2023-08-10" },
  { code: "WS-009", name: "東北物流ネットワーク", kana: "トウホクブツリュウ", contact: "渡辺所長", terms: "月末締翌月末払", creditLimit: 0, creditUsed: 18000, group: "C", status: "停止", monthSales: 0, ytdSales: 18000, delays: 4, prefecture: "宮城県", startedAt: "2021-01-15" },
  { code: "WS-010", name: "首都圏卸売市場 株式会社", kana: "シュトケンオロシ", contact: "中村部長", terms: "月末締翌月15日払", creditLimit: 950000, creditUsed: 412000, group: "A", status: "通常", monthSales: 384000, ytdSales: 6248000, delays: 0, prefecture: "東京都", startedAt: "2019-07-22" },
];

const STATUS_OPTIONS = ["すべて", "通常", "重点", "新規", "停止"] as const;
const GROUP_OPTIONS = ["すべて", "S", "A", "B", "C"] as const;
const TERMS_OPTIONS = [
  "すべて",
  "月末締翌月末払",
  "月末締翌々月末払",
  "20日締翌月10日払",
  "月末締翌月20日払",
  "月末締翌月15日払",
  "10日締翌月末払",
] as const;

type SortKey = "code" | "name" | "creditLimit" | "creditUsed" | "monthSales" | "ytdSales" | "delays";

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function WholesalePage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("すべて");
  const [group, setGroup] = useState<(typeof GROUP_OPTIONS)[number]>("すべて");
  const [terms, setTerms] = useState<(typeof TERMS_OPTIONS)[number]>("すべて");
  const [creditAlert, setCreditAlert] = useState(false);
  const [delayOnly, setDelayOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("ytdSales");
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState<Wholesale | null>(null);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    const result = ALL_CLIENTS.filter((c) => {
      if (
        k &&
        !c.name.toLowerCase().includes(k) &&
        !c.kana.toLowerCase().includes(k) &&
        !c.code.toLowerCase().includes(k) &&
        !c.contact.toLowerCase().includes(k)
      )
        return false;
      if (status !== "すべて" && c.status !== status) return false;
      if (group !== "すべて" && c.group !== group) return false;
      if (terms !== "すべて" && c.terms !== terms) return false;
      if (creditAlert && c.creditUsed / Math.max(c.creditLimit, 1) < 0.9) return false;
      if (delayOnly && c.delays === 0) return false;
      return true;
    });
    result.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return sortDesc ? bv - av : av - bv;
      return sortDesc
        ? String(bv).localeCompare(String(av), "ja")
        : String(av).localeCompare(String(bv), "ja");
    });
    return result;
  }, [keyword, status, group, terms, creditAlert, delayOnly, sortKey, sortDesc]);

  const totals = useMemo(
    () => ({
      count: filtered.length,
      monthSales: filtered.reduce((s, c) => s + c.monthSales, 0),
      ytdSales: filtered.reduce((s, c) => s + c.ytdSales, 0),
      creditUsed: filtered.reduce((s, c) => s + c.creditUsed, 0),
      delays: filtered.reduce((s, c) => s + c.delays, 0),
    }),
    [filtered]
  );

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDesc(!sortDesc);
    else {
      setSortKey(k);
      setSortDesc(true);
    }
  };

  const clearFilters = () => {
    setKeyword("");
    setStatus("すべて");
    setGroup("すべて");
    setTerms("すべて");
    setCreditAlert(false);
    setDelayOnly(false);
  };

  const activeFilters = [
    keyword && `キーワード: ${keyword}`,
    status !== "すべて" && `ステータス: ${status}`,
    group !== "すべて" && `グループ: ${group}`,
    terms !== "すべて" && `支払条件: ${terms}`,
    creditAlert && "与信使用90%以上",
    delayOnly && "支払遅延あり",
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">卸先マスタ</h1>
            <HelpHint>
              卸先（B to B取引先）の一覧画面。支払条件・与信状況・取引実績で絞り込めます。{"\n"}
              行をクリックするとサイド詳細パネルが開きます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {ALL_CLIENTS.length} 件中 <span className="font-semibold text-gray-700">{totals.count}</span> 件表示
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all">
            <Download className="h-4 w-4" />CSVエクスポート
          </button>
          <Link
            href="/customers/wholesale/import"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all"
          >
            <Upload className="h-4 w-4" />一括登録
          </Link>
          <Link
            href="/customers/wholesale/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
          >
            <Plus className="h-4 w-4" />卸先登録
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Building2 className="h-4 w-4" />取引社数
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{totals.count}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4" />今月売上
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{fmt(totals.monthSales)}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Banknote className="h-4 w-4" />与信使用合計
          </div>
          <p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{fmt(totals.creditUsed)}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertTriangle className="h-4 w-4" />支払遅延件数
          </div>
          <p
            className={cn(
              "mt-2 text-3xl font-bold tabular-nums",
              totals.delays > 0 ? "text-red-700" : "text-gray-800"
            )}
          >
            {totals.delays}
            <span className="text-sm font-normal ml-1">件</span>
          </p>
        </GlassCard>
      </div>

      {/* フィルター */}
      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード検索</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="法人名・カナ・コード・担当者で検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">取引ステータス</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">価格グループ</label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as (typeof GROUP_OPTIONS)[number])}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {GROUP_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px]">
            <label className="text-xs text-gray-500">支払条件</label>
            <select
              value={terms}
              onChange={(e) => setTerms(e.target.value as (typeof TERMS_OPTIONS)[number])}
              className="mt-1 w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {TERMS_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={creditAlert}
              onChange={(e) => setCreditAlert(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            与信使用 90%以上
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={delayOnly}
              onChange={(e) => setDelayOnly(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            支払遅延あり
          </label>
          {activeFilters.length > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <X className="h-3.5 w-3.5" />フィルターをクリア
            </button>
          )}
        </div>
        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((f) => (
              <span
                key={String(f)}
                className="px-2.5 py-1 rounded-full text-xs bg-blue-500/10 text-blue-700 border border-blue-200/60"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </GlassCard>

      {/* テーブル */}
      <div className="flex gap-4">
        <GlassCard
          className={cn(
            "p-0 overflow-hidden transition-all duration-300",
            selected ? "flex-1" : "w-full"
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50 border-b border-white/40">
                  <SortHeader label="コード" k="code" sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                  <SortHeader label="卸先名" k="name" sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">担当者</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">支払条件</th>
                  <SortHeader label="与信限度" k="creditLimit" align="right" sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                  <SortHeader label="使用額" k="creditUsed" align="right" sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">使用率</th>
                  <SortHeader label="今月売上" k="monthSales" align="right" sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                  <SortHeader label="今期累計" k="ytdSales" align="right" sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">グループ</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
                  <SortHeader label="遅延" k="delays" align="center" sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                  <th className="w-10 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-3 py-12 text-center text-gray-400">
                      条件に該当する卸先がありません。フィルターを見直してください。
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const usage = c.creditLimit ? Math.round((c.creditUsed / c.creditLimit) * 100) : 0;
                    return (
                      <tr
                        key={c.code}
                        onClick={() => setSelected(c)}
                        className={cn(
                          "border-t border-white/30 cursor-pointer transition-colors",
                          selected?.code === c.code ? "bg-blue-500/10" : "hover:bg-white/40"
                        )}
                      >
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{c.code}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.prefecture}</p>
                        </td>
                        <td className="px-3 py-2.5 text-gray-700">{c.contact}</td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs">{c.terms}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(c.creditLimit)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmt(c.creditUsed)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                              usage >= 100
                                ? "bg-red-500/15 text-red-700"
                                : usage >= 90
                                ? "bg-amber-500/15 text-amber-700"
                                : "bg-emerald-500/15 text-emerald-700"
                            )}
                          >
                            {usage}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(c.monthSales)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmt(c.ytdSales)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-xs font-bold",
                            c.group === "S" && "bg-purple-500/15 text-purple-700",
                            c.group === "A" && "bg-amber-500/15 text-amber-700",
                            c.group === "B" && "bg-blue-500/15 text-blue-700",
                            c.group === "C" && "bg-gray-500/15 text-gray-600"
                          )}>{c.group}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            c.status === "通常" && "bg-emerald-500/15 text-emerald-700",
                            c.status === "重点" && "bg-blue-500/15 text-blue-700",
                            c.status === "新規" && "bg-purple-500/15 text-purple-700",
                            c.status === "停止" && "bg-red-500/15 text-red-700",
                          )}>{c.status}</span>
                        </td>
                        <td className={cn("px-3 py-2.5 text-center tabular-nums", c.delays > 0 ? "text-red-600 font-semibold" : "text-gray-400")}>
                          {c.delays}
                        </td>
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/customers/wholesale/${c.code}/edit`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors"
                            title="編集"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* 詳細パネル */}
        {selected && (
          <GlassCard className="w-80 shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">{selected.name}</h3>
              <button
                onClick={() => setSelected(null)}
                className="p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 font-mono">{selected.code} ・ {selected.prefecture}</p>
            <div className="h-px bg-white/40" />
            <div className="space-y-2 text-sm">
              <Row label="主担当" value={selected.contact} />
              <Row label="支払条件" value={selected.terms} />
              <Row label="取引開始" value={selected.startedAt} />
              <Row label="ステータス" value={selected.status} />
            </div>
            <div className="h-px bg-white/40" />
            <div>
              <p className="text-xs text-gray-500 mb-1">与信使用状況</p>
              <div className="h-2 rounded-full bg-white/60 overflow-hidden">
                <div
                  className={cn(
                    "h-full",
                    selected.creditLimit && selected.creditUsed / selected.creditLimit >= 1
                      ? "bg-red-500"
                      : selected.creditLimit && selected.creditUsed / selected.creditLimit >= 0.9
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      selected.creditLimit ? (selected.creditUsed / selected.creditLimit) * 100 : 0
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {fmt(selected.creditUsed)} / {fmt(selected.creditLimit)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-xl bg-white/50">
                <p className="text-xs text-gray-500">今月売上</p>
                <p className="text-base font-bold text-emerald-700 tabular-nums">{fmt(selected.monthSales)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/50">
                <p className="text-xs text-gray-500">今期累計</p>
                <p className="text-base font-bold text-blue-700 tabular-nums">{fmt(selected.ytdSales)}</p>
              </div>
            </div>
            <Link
              href={`/customers/wholesale/${selected.code}/edit`}
              className="block w-full text-center px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
            >
              詳細を編集する
            </Link>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  );
}

function SortHeader({
  label,
  k,
  align = "left",
  sortKey,
  sortDesc,
  onClick,
}: {
  label: string;
  k: SortKey;
  align?: "left" | "right" | "center";
  sortKey: SortKey;
  sortDesc: boolean;
  onClick: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <th className={cn("px-3 py-3 text-xs font-medium text-gray-500", `text-${align}`)}>
      <button
        type="button"
        onClick={() => onClick(k)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-gray-700 transition-colors",
          active && "text-blue-600"
        )}
      >
        {label}
        <ArrowUpDown className={cn("h-3 w-3", active && (sortDesc ? "rotate-180" : ""))} />
      </button>
    </th>
  );
}
