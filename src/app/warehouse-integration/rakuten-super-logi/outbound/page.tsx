"use client";
import { GlassCard } from "@/components/ui/glass-card";
const data = [
  { col1: "サンプル1", col2: "値1", col3: "楽天スーパーロジ 出荷処理", col4: "2024/04/12", status: "処理済" },
  { col1: "サンプル2", col2: "値2", col3: "楽天スーパーロジ 出荷処理", col4: "2024/04/11", status: "処理中" },
  { col1: "サンプル3", col2: "値3", col3: "楽天スーパーロジ 出荷処理", col4: "2024/04/10", status: "処理済" },
];
export default function Page() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">楽天スーパーロジ 出荷処理</h1>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">No.</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">項目</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">内容</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">日付</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">ステータス</th>
          </tr></thead>
          <tbody>{data.map((d, i) => (
            <tr key={i} className="border-t border-white/30 hover:bg-white/40">
              <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{d.col1}</td>
              <td className="px-3 py-2.5 text-gray-700">{d.col2}</td>
              <td className="px-3 py-2.5 text-gray-800">{d.col3}</td>
              <td className="px-3 py-2.5 text-gray-500 text-xs">{d.col4}</td>
              <td className="px-3 py-2.5 text-center"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">{d.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
