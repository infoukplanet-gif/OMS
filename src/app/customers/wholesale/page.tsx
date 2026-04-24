"use client";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Plus, Upload, Pencil } from "lucide-react";
const clients = [
  { code: "WS-001", name: "株式会社ABC商事", contact: "山本部長", terms: "月末締翌月末払", credit: "¥500,000", group: "A" },
  { code: "WS-002", name: "グローバルトレード合同会社", contact: "李マネージャー", terms: "月末締翌々月末払", credit: "¥1,000,000", group: "S" },
  { code: "WS-003", name: "北海道物産株式会社", contact: "鈴木課長", terms: "月末締翌月末払", credit: "¥300,000", group: "B" },
];
export default function WholesalePage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">卸先マスタ</h1>
        <div className="flex gap-2">
          <Link href="/customers/wholesale/import" className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all")}><Upload className="h-4 w-4" />一括登録</Link>
          <Link href="/customers/wholesale/new" className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all")}><Plus className="h-4 w-4" />卸先登録</Link>
        </div>
      </div>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">コード</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">卸先名</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">担当者</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">支払条件</th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">与信限度</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">価格グループ</th>
            <th className="w-10 px-3 py-3" />
          </tr></thead>
          <tbody>{clients.map(c => (
            <tr key={c.code} className="border-t border-white/30 hover:bg-white/40 transition-colors">
              <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{c.code}</td>
              <td className="px-3 py-2.5 font-medium text-gray-800">{c.name}</td>
              <td className="px-3 py-2.5 text-gray-700">{c.contact}</td>
              <td className="px-3 py-2.5 text-gray-600 text-xs">{c.terms}</td>
              <td className="px-3 py-2.5 text-right font-medium text-gray-700">{c.credit}</td>
              <td className="px-3 py-2.5 text-center"><span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/15 text-amber-700">{c.group}</span></td>
              <td className="px-3 py-2.5"><Link href={`/customers/wholesale/${c.code}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="編集"><Pencil className="h-3.5 w-3.5" /></Link></td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
