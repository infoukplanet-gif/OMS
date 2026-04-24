"use client";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Plus, Upload, Pencil } from "lucide-react";
const suppliers = [
  { code: "SUP-001", name: "株式会社ABC電子", contact: "佐藤一郎", phone: "03-1234-5678", email: "sato@abc-elec.co.jp", status: "取引中" },
  { code: "SUP-002", name: "グローバルパーツ合同会社", contact: "田中明", phone: "06-2345-6789", email: "tanaka@globalparts.jp", status: "取引中" },
  { code: "SUP-003", name: "株式会社ケーブルワークス", contact: "鈴木直子", phone: "045-3456-7890", email: "suzuki@cableworks.jp", status: "取引中" },
  { code: "SUP-004", name: "アジアサプライ株式会社", contact: "高橋裕", phone: "03-4567-8901", email: "takahashi@asiasupply.co.jp", status: "停止中" },
];
const sb: Record<string,string> = { "取引中": "bg-emerald-500/15 text-emerald-700", "停止中": "bg-gray-500/15 text-gray-600" };
export default function SuppliersPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">仕入先マスタ</h1>
        <div className="flex gap-2">
          <Link href="/purchasing/suppliers/import" className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all")}><Upload className="h-4 w-4" />一括登録</Link>
          <Link href="/purchasing/suppliers/new" className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all")}><Plus className="h-4 w-4" />仕入先登録</Link>
        </div>
      </div>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">コード</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">仕入先名</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">担当者</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">電話番号</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">メール</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
            <th className="w-10 px-3 py-3" />
          </tr></thead>
          <tbody>{suppliers.map(s => (
            <tr key={s.code} className="border-t border-white/30 hover:bg-white/40 transition-colors">
              <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{s.code}</td>
              <td className="px-3 py-2.5 font-medium text-gray-800">{s.name}</td>
              <td className="px-3 py-2.5 text-gray-700">{s.contact}</td>
              <td className="px-3 py-2.5 text-gray-600">{s.phone}</td>
              <td className="px-3 py-2.5 text-gray-600">{s.email}</td>
              <td className="px-3 py-2.5 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[s.status])}>{s.status}</span></td>
              <td className="px-3 py-2.5"><Link href={`/purchasing/suppliers/${s.code}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="編集"><Pencil className="h-3.5 w-3.5" /></Link></td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
