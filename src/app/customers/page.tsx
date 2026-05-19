"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  Download,
  ArrowUpDown,
} from "lucide-react";

type CustomerKind = "general" | "wholesale" | "blacklist";
type Rank = "通常" | "シルバー" | "ゴールド" | "プラチナ" | "VIP";

type Customer = {
  id: string;
  code: string;
  name: string;
  kana: string;
  email: string;
  phone: string;
  prefecture: string;
  purchases: number;
  total: number;
  lastPurchase: string;
  registered: string;
  rank: Rank;
  vip: boolean;
  kind: CustomerKind;
};

const ALL_CUSTOMERS: Customer[] = [
  { id: "C001", code: "CUS-0001", name: "山田太郎", kana: "ヤマダタロウ", email: "yamada@example.com", phone: "090-1234-5678", prefecture: "東京都", purchases: 24, total: 384200, lastPurchase: "2026-04-11", registered: "2023-01-15", rank: "ゴールド", vip: true, kind: "general" },
  { id: "C002", code: "CUS-0002", name: "佐藤花子", kana: "サトウハナコ", email: "sato@example.com", phone: "080-2345-6789", prefecture: "大阪府", purchases: 8, total: 52400, lastPurchase: "2026-04-10", registered: "2023-05-22", rank: "シルバー", vip: false, kind: "general" },
  { id: "C003", code: "CUS-0003", name: "田中一郎", kana: "タナカイチロウ", email: "tanaka@example.com", phone: "070-3456-7890", prefecture: "愛知県", purchases: 31, total: 1245000, lastPurchase: "2026-04-11", registered: "2022-11-03", rank: "VIP", vip: true, kind: "general" },
  { id: "C004", code: "CUS-0004", name: "鈴木美咲", kana: "スズキミサキ", email: "suzuki@example.com", phone: "090-4567-8901", prefecture: "神奈川県", purchases: 3, total: 15600, lastPurchase: "2026-04-09", registered: "2024-02-10", rank: "通常", vip: false, kind: "general" },
  { id: "C005", code: "CUS-0005", name: "高橋健", kana: "タカハシケン", email: "takahashi@example.com", phone: "080-5678-9012", prefecture: "福岡県", purchases: 15, total: 198500, lastPurchase: "2026-04-08", registered: "2023-03-28", rank: "ゴールド", vip: true, kind: "general" },
  { id: "C006", code: "CUS-0006", name: "渡辺京子", kana: "ワタナベキョウコ", email: "watanabe@example.com", phone: "070-6789-0123", prefecture: "京都府", purchases: 5, total: 67800, lastPurchase: "2026-04-07", registered: "2023-08-14", rank: "シルバー", vip: false, kind: "general" },
  { id: "C007", code: "CUS-0007", name: "伊藤大輔", kana: "イトウダイスケ", email: "ito@example.com", phone: "090-7890-1234", prefecture: "宮城県", purchases: 2, total: 22400, lastPurchase: "2026-04-05", registered: "2024-01-20", rank: "通常", vip: false, kind: "general" },
  { id: "C008", code: "CUS-0008", name: "中村あかり", kana: "ナカムラアカリ", email: "nakamura@example.com", phone: "080-8901-2345", prefecture: "東京都", purchases: 19, total: 256300, lastPurchase: "2026-04-11", registered: "2022-09-07", rank: "プラチナ", vip: true, kind: "general" },
  { id: "C009", code: "CUS-0009", name: "小林さくら", kana: "コバヤシサクラ", email: "kobayashi@example.com", phone: "090-1112-2233", prefecture: "北海道", purchases: 12, total: 142000, lastPurchase: "2026-04-06", registered: "2023-12-01", rank: "ゴールド", vip: false, kind: "general" },
  { id: "C010", code: "CUS-0010", name: "加藤翔", kana: "カトウショウ", email: "kato@example.com", phone: "070-2233-4455", prefecture: "兵庫県", purchases: 7, total: 84200, lastPurchase: "2026-04-03", registered: "2024-03-15", rank: "シルバー", vip: false, kind: "general" },
];

const tabs: { label: string; value: CustomerKind; count: number }[] = [
  { label: "一般顧客", value: "general", count: 2847 },
  { label: "卸先マスタ", value: "wholesale", count: 34 },
  { label: "ブラックリスト", value: "blacklist", count: 12 },
];

const RANK_OPTIONS = ["すべて", "通常", "シルバー", "ゴールド", "プラチナ", "VIP"] as const;
const PURCHASE_OPTIONS = ["指定なし", "1回以上", "5回以上", "10回以上", "20回以上"] as const;
const AMOUNT_OPTIONS = ["指定なし", "1万円以上", "5万円以上", "10万円以上", "50万円以上"] as const;
const PERIOD_OPTIONS = ["すべて", "今月購入", "3ヶ月以内", "1年以内", "1年以上前"] as const;

type SortKey = "code" | "name" | "purchases" | "total" | "lastPurchase";

const PSEUDO_NOW = new Date("2026-04-28").getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

const recentOrders = [
  { id: "ORD-2026-00851", amount: "¥32,400", status: "新規受付", date: "04/11" },
  { id: "ORD-2026-00830", amount: "¥18,200", status: "完了", date: "04/05" },
  { id: "ORD-2026-00812", amount: "¥8,500", status: "完了", date: "03/28" },
];

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function CustomersPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<CustomerKind>("general");
  const [keyword, setKeyword] = useState("");
  const [rank, setRank] = useState<(typeof RANK_OPTIONS)[number]>("すべて");
  const [purchaseFilter, setPurchaseFilter] = useState<(typeof PURCHASE_OPTIONS)[number]>("指定なし");
  const [amountFilter, setAmountFilter] = useState<(typeof AMOUNT_OPTIONS)[number]>("指定なし");
  const [periodFilter, setPeriodFilter] = useState<(typeof PERIOD_OPTIONS)[number]>("すべて");
  const [vipOnly, setVipOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("lastPurchase");
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    const minPurchase = { 指定なし: 0, "1回以上": 1, "5回以上": 5, "10回以上": 10, "20回以上": 20 }[purchaseFilter];
    const minAmount = {
      指定なし: 0,
      "1万円以上": 10000,
      "5万円以上": 50000,
      "10万円以上": 100000,
      "50万円以上": 500000,
    }[amountFilter];
    const periodWindow: Record<(typeof PERIOD_OPTIONS)[number], [number, number] | null> = {
      すべて: null,
      今月購入: [0, 30],
      "3ヶ月以内": [0, 90],
      "1年以内": [0, 365],
      "1年以上前": [365, Infinity],
    };

    const result = ALL_CUSTOMERS.filter((c) => {
      if (
        k &&
        !c.name.toLowerCase().includes(k) &&
        !c.kana.toLowerCase().includes(k) &&
        !c.code.toLowerCase().includes(k) &&
        !c.email.toLowerCase().includes(k) &&
        !c.phone.toLowerCase().includes(k)
      )
        return false;
      if (rank !== "すべて" && c.rank !== rank) return false;
      if (c.purchases < minPurchase) return false;
      if (c.total < minAmount) return false;
      if (vipOnly && !c.vip) return false;
      const window = periodWindow[periodFilter];
      if (window) {
        const days = (PSEUDO_NOW - new Date(c.lastPurchase).getTime()) / DAY_MS;
        if (days < window[0] || days > window[1]) return false;
      }
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
  }, [keyword, rank, purchaseFilter, amountFilter, periodFilter, vipOnly, sortKey, sortDesc]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDesc(!sortDesc);
    else {
      setSortKey(k);
      setSortDesc(true);
    }
  };

  const clearFilters = () => {
    setKeyword("");
    setRank("すべて");
    setPurchaseFilter("指定なし");
    setAmountFilter("指定なし");
    setPeriodFilter("すべて");
    setVipOnly(false);
  };

  const activeFilters = [
    keyword && `検索: ${keyword}`,
    rank !== "すべて" && `ランク: ${rank}`,
    purchaseFilter !== "指定なし" && `購入: ${purchaseFilter}`,
    amountFilter !== "指定なし" && `累計: ${amountFilter}`,
    periodFilter !== "すべて" && `期間: ${periodFilter}`,
    vipOnly && "VIPのみ",
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">顧客管理</h1>
            <HelpHint>
              個人顧客・卸先・ブラックリストを切り替えて管理します。{"\n"}
              絞り込んだ後、行をクリックすると右側に顧客カードが開きます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {ALL_CUSTOMERS.length} 件中 <span className="font-semibold text-gray-700">{filtered.length}</span> 件表示
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all">
            <Download className="h-4 w-4" />CSVエクスポート
          </button>
          <Link
            href="/customers/wholesale/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all"
          >
            <Plus className="h-4 w-4" />卸先登録
          </Link>
          <Link
            href="/customers/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
          >
            <Plus className="h-4 w-4" />顧客登録
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
        {tabs.map((tab) => {
          const isWholesale = tab.value === "wholesale";
          const isBlacklist = tab.value === "blacklist";
          if (isWholesale || isBlacklist) {
            return (
              <Link
                key={tab.value}
                href={isWholesale ? "/customers/wholesale" : "/customers/blacklist"}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-white/40 transition-all"
              >
                {tab.label}
                <span className="px-1.5 py-0.5 rounded-md text-xs bg-gray-500/10 text-gray-500">
                  {tab.count.toLocaleString()}
                </span>
              </Link>
            );
          }
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all",
                activeTab === tab.value
                  ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-md text-xs",
                  activeTab === tab.value ? "bg-blue-500/15 text-blue-700 font-medium" : "bg-gray-500/10 text-gray-500"
                )}
              >
                {tab.count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード検索</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="氏名・カナ・コード・メール・電話で検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">ランク</label>
            <select
              value={rank}
              onChange={(e) => setRank(e.target.value as (typeof RANK_OPTIONS)[number])}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {RANK_OPTIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">購入回数</label>
            <select
              value={purchaseFilter}
              onChange={(e) => setPurchaseFilter(e.target.value as (typeof PURCHASE_OPTIONS)[number])}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {PURCHASE_OPTIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">累計金額</label>
            <select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value as (typeof AMOUNT_OPTIONS)[number])}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {AMOUNT_OPTIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">最終購入</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as (typeof PERIOD_OPTIONS)[number])}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {PERIOD_OPTIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={vipOnly}
              onChange={(e) => setVipOnly(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            VIPのみ
          </label>
          {activeFilters.length > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <X className="h-3.5 w-3.5" />クリア
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

      <div className="flex gap-4">
        {/* Table */}
        <GlassCard
          className={cn(
            "p-0 overflow-hidden transition-all duration-300",
            selectedCustomer ? "flex-1" : "w-full"
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50 border-b border-white/40">
                  <SortHeader label="顧客コード" k="code" sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                  <SortHeader label="顧客名" k="name" sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">メール</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">電話番号</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">ランク</th>
                  <SortHeader label="購入回数" k="purchases" align="center" sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                  <SortHeader label="累計金額" k="total" align="right" sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                  <SortHeader label="最終購入日" k="lastPurchase" sortKey={sortKey} sortDesc={sortDesc} onClick={toggleSort} />
                  <th className="w-10 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-12 text-center text-gray-400">
                      条件に該当する顧客がありません。フィルターを見直してください。
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className={cn(
                        "border-t border-white/30 transition-colors cursor-pointer",
                        selectedCustomer?.id === c.id ? "bg-blue-500/8" : "hover:bg-white/40"
                      )}
                    >
                      <td className="px-3 py-3 font-mono text-xs text-gray-500">{c.code}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{c.name}</span>
                          {c.vip && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700">
                              VIP
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{c.kana} ・ {c.prefecture}</p>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{c.email}</td>
                      <td className="px-3 py-3 text-gray-600">{c.phone}</td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-xs font-bold",
                            c.rank === "VIP" && "bg-pink-500/15 text-pink-700",
                            c.rank === "プラチナ" && "bg-purple-500/15 text-purple-700",
                            c.rank === "ゴールド" && "bg-amber-500/15 text-amber-700",
                            c.rank === "シルバー" && "bg-slate-400/15 text-slate-700",
                            c.rank === "通常" && "bg-gray-500/15 text-gray-600"
                          )}
                        >
                          {c.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-medium text-gray-700 tabular-nums">{c.purchases}</td>
                      <td className="px-3 py-3 text-right font-medium text-gray-800 tabular-nums">{fmt(c.total)}</td>
                      <td className="px-3 py-3 text-gray-500 text-xs">{c.lastPurchase}</td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/customers/${c.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors"
                          title="編集"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/40 bg-white/30">
            <span className="text-sm text-gray-500">
              {filtered.length === 0 ? "0" : `1-${filtered.length}`} / {filtered.length} 件
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => toast.show("ページネーションは v2 で実装予定", "info")}
                aria-label="前のページ"
                className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-400 hover:bg-white/70 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => toast.show("ページネーションは v2 で実装予定", "info")}
                aria-label="次のページ"
                className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-600 hover:bg-white/70 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Preview Panel */}
        {selectedCustomer && (
          <GlassCard className="w-80 shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">顧客情報</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Name */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 font-bold text-lg">
                {selectedCustomer.name[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{selectedCustomer.name}</p>
                <p className="text-xs text-gray-500">
                  {selectedCustomer.code} ・ {selectedCustomer.rank}
                  {selectedCustomer.vip && " ・VIP"}
                </p>
              </div>
            </div>

            <div className="h-px bg-white/40" />

            {/* Contact */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{selectedCustomer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{selectedCustomer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">{selectedCustomer.prefecture}</span>
              </div>
            </div>

            <div className="h-px bg-white/40" />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-xl bg-white/50">
                <p className="text-xs text-gray-500">購入回数</p>
                <p className="text-lg font-bold text-gray-800">
                  {selectedCustomer.purchases}
                  <span className="text-sm font-normal text-gray-500">回</span>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/50">
                <p className="text-xs text-gray-500">累計金額</p>
                <p className="text-lg font-bold text-gray-800">{fmt(selectedCustomer.total)}</p>
              </div>
            </div>

            <div className="h-px bg-white/40" />

            {/* Recent Orders */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ShoppingCart className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">直近の注文</span>
              </div>
              <div className="space-y-1.5">
                {recentOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/40 text-xs"
                  >
                    <span className="text-blue-600 font-medium">{o.id}</span>
                    <span className="text-gray-700 font-medium">{o.amount}</span>
                    <span className="text-gray-400">{o.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={`/customers/${selectedCustomer.id}/edit`}
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
