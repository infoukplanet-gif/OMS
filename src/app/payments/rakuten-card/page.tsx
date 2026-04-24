"use client";
import { GlassCard } from "@/components/ui/glass-card";
const data = [
  { order: "ORD-2024-00851", customer: "山田太郎", amount: "¥32,400", auth: "2024/04/11", status: "売上確定待ち" },
  { order: "ORD-2024-00845", customer: "高橋健", amount: "¥22,800", auth: "2024/04/10", status: "売上確定待ち" },
  { order: "ORD-2024-00838", customer: "井上智", amount: "¥28,500", auth: "2024/04/09", status: "売上確定済" },
];
export default function Page() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">楽天カード決済確定</h1>
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/40 bg-white/30 flex items-center justify-between">
          <p className="text-sm text-gray-600">楽天カードの売上確定処理を行います</p>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">一括売上確定</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="w-10 px-3 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客名</th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">金額</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">オーソリ日</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
          </tr></thead>
          <tbody>{data.map(d => (
            <tr key={d.order} className="border-t border-white/30 hover:bg-white/40">
              <td className="px-3 py-2.5"><input type="checkbox" className="rounded border-gray-300" /></td>
              <td className="px-3 py-2.5 font-medium text-blue-600">{d.order}</td>
              <td className="px-3 py-2.5 text-gray-700">{d.customer}</td>
              <td className="px-3 py-2.5 text-right font-medium text-gray-800">{d.amount}</td>
              <td className="px-3 py-2.5 text-gray-500 text-xs">{d.auth}</td>
              <td className="px-3 py-2.5 text-center"><span className={d.status === "売上確定済" ? "px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700" : "px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-700"}>{d.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
