"use client";
import { GlassCard } from "@/components/ui/glass-card";
const items = [
  { name: "設定項目1", desc: "支払方法別メッセージ設定に関する設定", enabled: true },
  { name: "設定項目2", desc: "支払方法別メッセージ設定の自動処理", enabled: true },
  { name: "設定項目3", desc: "支払方法別メッセージ設定の通知", enabled: false },
];
export default function Page() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">支払方法別メッセージ設定</h1>
      <GlassCard>
        <div className="space-y-2">
          {items.map(i => (
            <div key={i.name} className="flex items-center justify-between p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors">
              <div><p className="text-sm font-medium text-gray-800">{i.name}</p><p className="text-xs text-gray-500">{i.desc}</p></div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={i.enabled} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
          ))}
        </div>
        <button className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">保存</button>
      </GlassCard>
    </div>
  );
}
