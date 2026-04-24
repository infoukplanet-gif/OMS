"use client";
import { GlassCard } from "@/components/ui/glass-card";
const data = [
  { code: "CUS-0099", name: "悪質太郎", reason: "代金引換受取拒否（3回）", date: "2024/03/15" },
  { code: "CUS-0145", name: "迷惑花子", reason: "不正クレジットカード利用", date: "2024/02/28" },
  { code: "CUS-0201", name: "クレーム一郎", reason: "過度なクレーム・脅迫行為", date: "2024/01/10" },
];
export default function BlacklistPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">ブラック顧客</h1>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">顧客コード</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">顧客名</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">登録理由</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">登録日</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody>{data.map(d => (
            <tr key={d.code} className="border-t border-white/30 hover:bg-white/40">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.code}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
              <td className="px-4 py-3 text-gray-600">{d.reason}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{d.date}</td>
              <td className="px-4 py-3 text-center"><button className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25">解除</button></td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
