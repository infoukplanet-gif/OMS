"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { cn } from "@/lib/utils";
import { Plus, Upload, Pencil, Search, Building2, Truck, Banknote, AlertTriangle, Download } from "lucide-react";

type Supplier = {
  code: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  monthVolume: number;
  ytdVolume: number;
  unpaid: number;
  leadTime: number;
  rating: "A" | "B" | "C";
  status: "取引中" | "停止中" | "新規";
};

const SUPPLIERS: Supplier[] = [
  { code: "SUP-001", name: "株式会社ABC電子", contact: "佐藤一郎", phone: "03-1234-5678", email: "sato@abc-elec.co.jp", monthVolume: 1284000, ytdVolume: 18420000, unpaid: 245000, leadTime: 7, rating: "A", status: "取引中" },
  { code: "SUP-002", name: "グローバルパーツ合同会社", contact: "田中明", phone: "06-2345-6789", email: "tanaka@globalparts.jp", monthVolume: 248000, ytdVolume: 4280000, unpaid: 128000, leadTime: 14, rating: "B", status: "取引中" },
  { code: "SUP-003", name: "株式会社ケーブルワークス", contact: "鈴木直子", phone: "045-3456-7890", email: "suzuki@cableworks.jp", monthVolume: 56000, ytdVolume: 1840000, unpaid: 0, leadTime: 5, rating: "A", status: "取引中" },
  { code: "SUP-004", name: "アジアサプライ株式会社", contact: "高橋裕", phone: "03-4567-8901", email: "takahashi@asiasupply.co.jp", monthVolume: 0, ytdVolume: 1240000, unpaid: 84000, leadTime: 30, rating: "C", status: "停止中" },
  { code: "SUP-005", name: "株式会社東京物流", contact: "中村健太", phone: "03-5678-9012", email: "nakamura@tokyologi.co.jp", monthVolume: 0, ytdVolume: 0, unpaid: 0, leadTime: 3, rating: "A", status: "新規" },
];

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function PurchasingSuppliersPage() {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("すべて");
  const [ratingFilter, setRatingFilter] = useState("すべて");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return SUPPLIERS.filter((s) => {
      if (k && !s.code.toLowerCase().includes(k) && !s.name.toLowerCase().includes(k) && !s.contact.toLowerCase().includes(k)) return false;
      if (statusFilter !== "すべて" && s.status !== statusFilter) return false;
      if (ratingFilter !== "すべて" && s.rating !== ratingFilter) return false;
      return true;
    });
  }, [keyword, statusFilter, ratingFilter]);

  const stats = {
    active: SUPPLIERS.filter((s) => s.status === "取引中").length,
    monthTotal: SUPPLIERS.reduce((s, x) => s + x.monthVolume, 0),
    unpaidTotal: SUPPLIERS.reduce((s, x) => s + x.unpaid, 0),
    avgLead: Math.round(SUPPLIERS.filter((s) => s.status === "取引中").reduce((s, x) => s + x.leadTime, 0) / Math.max(1, SUPPLIERS.filter((s) => s.status === "取引中").length)),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">仕入先マスタ</h1>
            <HelpHint>仕入先（取引先）の連絡先・取引実績・支払状況を一元管理します。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            取引中: <span className="font-semibold text-emerald-700">{stats.active}件</span> ／ 今月発注額:{" "}
            <span className="font-semibold">{fmt(stats.monthTotal)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
            <Download className="h-4 w-4" />CSVエクスポート
          </button>
          <Link href="/purchasing/suppliers/import" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
            <Upload className="h-4 w-4" />一括登録
          </Link>
          <Link href="/purchasing/suppliers/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">
            <Plus className="h-4 w-4" />仕入先登録
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><Building2 className="h-4 w-4" />取引中</div><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.active}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><Banknote className="h-4 w-4" />今月発注額</div><p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{fmt(stats.monthTotal)}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><AlertTriangle className="h-4 w-4" />未支払合計</div><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{fmt(stats.unpaidTotal)}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><Truck className="h-4 w-4" />平均リードタイム</div><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.avgLead}<span className="text-sm font-normal ml-1">日</span></p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="コード・仕入先名・担当者" className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="text-xs text-gray-500">取引状態</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["すべて", "取引中", "停止中", "新規"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">評価ランク</label>
            <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["すべて", "A", "B", "C"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">コード</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">仕入先名</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">担当者</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">連絡先</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">今月発注額</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">未支払</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">リード</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">評価</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.code} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{s.code}</td>
                <td className="px-3 py-2.5 font-medium text-gray-800">{s.name}</td>
                <td className="px-3 py-2.5 text-gray-700">{s.contact}</td>
                <td className="px-3 py-2.5 text-xs">
                  <p className="text-gray-700">{s.phone}</p>
                  <p className="text-gray-500">{s.email}</p>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(s.monthVolume)}</td>
                <td className={cn("px-3 py-2.5 text-right tabular-nums", s.unpaid > 0 ? "text-amber-700 font-semibold" : "text-gray-400")}>{s.unpaid > 0 ? fmt(s.unpaid) : "—"}</td>
                <td className="px-3 py-2.5 text-center text-xs tabular-nums">{s.leadTime}日</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-md text-xs font-bold", s.rating === "A" && "bg-emerald-500/15 text-emerald-700", s.rating === "B" && "bg-yellow-500/15 text-yellow-700", s.rating === "C" && "bg-red-500/15 text-red-700")}>
                    {s.rating}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", s.status === "取引中" && "bg-emerald-500/15 text-emerald-700", s.status === "停止中" && "bg-gray-500/15 text-gray-600", s.status === "新規" && "bg-blue-500/15 text-blue-700")}>
                    {s.status}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/purchasing/suppliers/${s.code}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600">
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
