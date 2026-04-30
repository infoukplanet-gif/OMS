"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileDown,
  FileText,
  CheckSquare,
} from "lucide-react";

type Shipment = {
  id: string;
  customer: string;
  items: number;
  amount: number;
  carrier: string;
  tracking: string;
  shipDate: string;
  status: "出荷待ち" | "出荷済み" | "配送中" | "配達完了";
  shop: string;
};

const initial: Shipment[] = [
  { id: "ORD-2026-08851", customer: "山田 太郎", items: 3, amount: 32_400, carrier: "ヤマト運輸", tracking: "", shipDate: "2026/04/30", status: "出荷待ち", shop: "本店" },
  { id: "ORD-2026-08850", customer: "佐藤 花子", items: 1, amount: 8_900, carrier: "佐川急便", tracking: "", shipDate: "2026/04/30", status: "出荷待ち", shop: "楽天店" },
  { id: "ORD-2026-08849", customer: "田中 一郎", items: 5, amount: 154_000, carrier: "ヤマト運輸", tracking: "", shipDate: "2026/04/30", status: "出荷待ち", shop: "本店" },
  { id: "ORD-2026-08848", customer: "渡辺 美咲", items: 2, amount: 24_800, carrier: "日本郵便", tracking: "", shipDate: "2026/05/01", status: "出荷待ち", shop: "Yahoo!店" },
  { id: "ORD-2026-08847", customer: "木村 健", items: 1, amount: 6_200, carrier: "ヤマト運輸", tracking: "", shipDate: "2026/05/01", status: "出荷待ち", shop: "本店" },
  { id: "ORD-2026-08845", customer: "伊藤 大輔", items: 2, amount: 18_600, carrier: "日本郵便", tracking: "JP1234567890", shipDate: "2026/04/29", status: "出荷済み", shop: "本店" },
  { id: "ORD-2026-08844", customer: "中村 あかり", items: 1, amount: 3_200, carrier: "ヤマト運輸", tracking: "3456-7890-1234", shipDate: "2026/04/29", status: "配送中", shop: "Amazon店" },
  { id: "ORD-2026-08843", customer: "小林 修", items: 3, amount: 67_500, carrier: "佐川急便", tracking: "5678-9012-3456", shipDate: "2026/04/28", status: "配送中", shop: "楽天店" },
  { id: "ORD-2026-08842", customer: "高橋 涼", items: 4, amount: 88_400, carrier: "西濃運輸", tracking: "9012-3456-7890", shipDate: "2026/04/28", status: "配送中", shop: "本店" },
  { id: "ORD-2026-08840", customer: "松本 愛", items: 2, amount: 15_800, carrier: "ヤマト運輸", tracking: "7890-1234-5678", shipDate: "2026/04/27", status: "配達完了", shop: "本店" },
  { id: "ORD-2026-08839", customer: "木村 拓也", items: 1, amount: 4_200, carrier: "日本郵便", tracking: "JP9876543210", shipDate: "2026/04/27", status: "配達完了", shop: "Yahoo!店" },
  { id: "ORD-2026-08838", customer: "吉田 あゆみ", items: 2, amount: 12_300, carrier: "佐川急便", tracking: "1357-2468-9876", shipDate: "2026/04/26", status: "配達完了", shop: "本店" },
];

const statusBadge: Record<string, string> = {
  出荷待ち: "bg-orange-500/15 text-orange-700",
  出荷済み: "bg-blue-500/15 text-blue-700",
  配送中: "bg-purple-500/15 text-purple-700",
  配達完了: "bg-emerald-500/15 text-emerald-700",
};

const carrierIcon: Record<string, { color: string; label: string }> = {
  ヤマト運輸: { color: "bg-green-500", label: "ヤ" },
  佐川急便: { color: "bg-blue-600", label: "佐" },
  日本郵便: { color: "bg-red-500", label: "郵" },
  西濃運輸: { color: "bg-amber-500", label: "西" },
  福山通運: { color: "bg-indigo-500", label: "福" },
};

type TabValue = "pending" | "shipped" | "in_transit" | "delivered";

const tabToStatus: Record<TabValue, Shipment["status"]> = {
  pending: "出荷待ち",
  shipped: "出荷済み",
  in_transit: "配送中",
  delivered: "配達完了",
};

const carriers = ["ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運"];

export default function ShipmentsPage() {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [activeTab, setActiveTab] = useState<TabValue>("pending");
  const [selected, setSelected] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [shipDateFilter, setShipDateFilter] = useState("");

  const filtered = useMemo(() => {
    const targetStatus = tabToStatus[activeTab];
    const k = keyword.trim().toLowerCase();
    return items.filter((s) => {
      if (s.status !== targetStatus) return false;
      if (k && !`${s.id} ${s.customer}`.toLowerCase().includes(k)) return false;
      if (carrierFilter !== "all" && s.carrier !== carrierFilter) return false;
      if (shipDateFilter && s.shipDate !== shipDateFilter) return false;
      return true;
    });
  }, [items, activeTab, keyword, carrierFilter, shipDateFilter]);

  const counts = useMemo(
    () => ({
      pending: items.filter((s) => s.status === "出荷待ち").length,
      shipped: items.filter((s) => s.status === "出荷済み").length,
      in_transit: items.filter((s) => s.status === "配送中").length,
      delivered: items.filter((s) => s.status === "配達完了").length,
    }),
    [items]
  );

  const tabs: { label: string; value: TabValue; count: number }[] = [
    { label: "出荷待ち", value: "pending", count: counts.pending },
    { label: "出荷済み", value: "shipped", count: counts.shipped },
    { label: "配送中", value: "in_transit", count: counts.in_transit },
    { label: "配達完了", value: "delivered", count: counts.delivered },
  ];

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected((prev) => (prev.length === filtered.length ? [] : filtered.map((s) => s.id)));

  const updateTracking = (id: string, tracking: string) =>
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, tracking } : s)));

  const confirmShipping = () => {
    if (selected.length === 0) {
      toast.show("出荷確定する受注を選択してください", "error");
      return;
    }
    setItems((prev) => prev.map((s) => (selected.includes(s.id) ? { ...s, status: "出荷済み" } : s)));
    toast.show(`${selected.length} 件を出荷確定しました`, "success");
    setSelected([]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800">出荷管理</h1>
          <HelpHint>受注ステータスごとに出荷待ち→出荷済み→配送中→配達完了を管理。検索・配送業者・出荷予定日で絞込み、選択した受注を一括で出荷確定できます。</HelpHint>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toast.show("出荷指示書を発行します", "info")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80 transition-all")}>
            <FileText className="h-4 w-4" />
            出荷指示書
          </button>
          <button onClick={() => toast.show("納品書を発行します", "info")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80 transition-all")}>
            <FileDown className="h-4 w-4" />
            納品書
          </button>
          <button onClick={confirmShipping} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90 transition-all")}>
            <CheckSquare className="h-4 w-4" />
            一括出荷確定
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setSelected([]); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200",
              activeTab === tab.value
                ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
            )}
          >
            {tab.label}
            <span className={cn(
              "px-1.5 py-0.5 rounded-md text-xs",
              activeTab === tab.value ? "bg-blue-500/15 text-blue-700 font-medium" : "bg-gray-500/10 text-gray-500"
            )}>
              {tab.count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            type="text"
            placeholder="受注番号・顧客名で検索..."
            className={cn(
              "w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
              "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          />
        </div>
        <select
          value={carrierFilter}
          onChange={(e) => setCarrierFilter(e.target.value)}
          className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">配送方法: すべて</option>
          {carriers.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <DatePicker
          compact
          placeholder="出荷予定日"
          onChange={(d) => {
            if (!d) { setShipDateFilter(""); return; }
            setShipDateFilter(`${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`);
          }}
        />
        {(keyword || carrierFilter !== "all" || shipDateFilter) && (
          <button
            onClick={() => { setKeyword(""); setCarrierFilter("all"); setShipDateFilter(""); }}
            className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 text-gray-600 hover:bg-white/70"
          >
            クリア
          </button>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注番号</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客名</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">店舗</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">商品数</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計金額</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">配送方法</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">追跡番号</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">出荷予定日</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const c = carrierIcon[s.carrier];
                return (
                  <tr
                    key={s.id}
                    className={cn(
                      "border-t border-white/30 transition-colors",
                      selected.includes(s.id) ? "bg-blue-500/5" : "hover:bg-white/40"
                    )}
                  >
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Link href={`/orders/${s.id}/edit`} className="font-medium text-blue-600 hover:underline">{s.id}</Link>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{s.customer}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{s.shop}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{s.items}</td>
                    <td className="px-3 py-3 text-right font-medium text-gray-800">¥{s.amount.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {c && (
                          <span className={cn("h-5 w-5 rounded text-[10px] font-bold text-white flex items-center justify-center", c.color)}>
                            {c.label}
                          </span>
                        )}
                        <span className="text-gray-600 text-xs">{s.carrier}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {s.tracking ? (
                        <span className="font-mono text-xs text-gray-600">{s.tracking}</span>
                      ) : (
                        <input
                          value={s.tracking}
                          onChange={(e) => updateTracking(s.id, e.target.value)}
                          type="text"
                          placeholder="番号を入力..."
                          className={cn(
                            "w-full h-7 px-2 rounded-lg text-xs bg-white/50 border border-white/50",
                            "placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                          )}
                        />
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{s.shipDate}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusBadge[s.status])}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/orders/${s.id}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="詳細">
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-12 text-center text-sm text-gray-400">該当する受注がありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-white/40 bg-white/30">
          <div>
            {selected.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">{selected.length} 件選択中</span>
                <button onClick={confirmShipping} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors">
                  出荷確定
                </button>
                <button onClick={() => toast.show(`${selected.length} 件の配送番号を一括登録します`, "info")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 transition-colors">
                  配送番号一括登録
                </button>
                <button onClick={() => toast.show(`${selected.length} 件の出荷指示書を発行します`, "info")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 transition-colors">
                  出荷指示書
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{filtered.length} 件 / 全 {items.length} 件</span>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-400">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-600 hover:bg-white/70 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
