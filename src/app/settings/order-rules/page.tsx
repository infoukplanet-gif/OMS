"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
const tabs = ["規定値設定", "支払方法別手数料", "支払発送変換", "日付自動登録", "除外地域"];
const defaults = [
  { label: "デフォルト支払方法", value: "クレジットカード" },
  { label: "デフォルト配送方法", value: "ヤマト運輸" },
  { label: "デフォルト倉庫", value: "東京本社倉庫" },
  { label: "税率", value: "10%" },
  { label: "送料（標準）", value: "¥800" },
  { label: "送料無料条件", value: "¥10,000以上" },
];
const fees = [
  { method: "クレジットカード", fee: "0%", note: "" },
  { method: "銀行振込", fee: "0%", note: "振込手数料は顧客負担" },
  { method: "代金引換", fee: "¥330", note: "一律" },
  { method: "請求書払い", fee: "0%", note: "卸先のみ" },
];
export default function OrderRulesPage() {
  const [tab, setTab] = useState(0);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">受注設定</h1>
      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={cn("px-3 py-2 rounded-xl text-sm transition-all", tab === i ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium" : "text-gray-500 hover:bg-white/40")}>{t}</button>
        ))}
      </div>
      {tab === 0 && (
        <GlassCard>
          <div className="space-y-3">
            {defaults.map(d => (
              <div key={d.label} className="flex items-center justify-between p-3 rounded-xl bg-white/40">
                <span className="text-sm text-gray-700">{d.label}</span>
                <input defaultValue={d.value} className="h-8 w-48 px-3 rounded-lg text-sm text-right bg-white/50 border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
              </div>
            ))}
          </div>
          <button className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">保存</button>
        </GlassCard>
      )}
      {tab === 1 && (
        <GlassCard className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">支払方法</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">手数料</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">備考</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr></thead>
            <tbody>{fees.map(f => (
              <tr key={f.method} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3 text-gray-800">{f.method}</td>
                <td className="px-4 py-3 text-center font-medium text-gray-700">{f.fee}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{f.note}</td>
                <td className="px-4 py-3 text-center"><button className="px-3 py-1 rounded-lg text-xs bg-white/60 border border-white/50 text-gray-600 hover:bg-white/80">編集</button></td>
              </tr>
            ))}</tbody>
          </table>
        </GlassCard>
      )}
      {tab === 2 && (
        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-4">支払発送変換設定</h2>
          <p className="text-sm text-gray-500 mb-4">モール側の支払方法・発送方法を本システムの名称に変換するルールを設定します。</p>
          <div className="overflow-hidden rounded-xl border border-white/50">
            <table className="w-full text-sm">
              <thead><tr className="bg-white/50 border-b border-white/40">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">種別</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">モール側</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">本システム</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">店舗</th>
              </tr></thead>
              <tbody>{[
                { type: "支払方法", from: "クレジットカード", to: "クレジット", shop: "楽天市場" },
                { type: "支払方法", from: "銀行振込（前払）", to: "銀行振込", shop: "Yahoo!" },
                { type: "発送方法", from: "ヤマト宅急便", to: "ヤマト運輸", shop: "全店舗" },
                { type: "発送方法", from: "佐川飛脚便", to: "佐川急便", shop: "全店舗" },
              ].map((r, i) => (
                <tr key={i} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5 text-gray-600 text-xs">{r.type}</td>
                  <td className="px-3 py-2.5 text-gray-700">{r.from}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">{r.to}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{r.shop}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <button className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">変換ルールを追加</button>
        </GlassCard>
      )}
      {tab === 3 && (
        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-4">日付自動登録設定</h2>
          <p className="text-sm text-gray-500 mb-4">受注取込時に自動的に設定する日付項目のルールを設定します。</p>
          <div className="space-y-2">
            {[
              { name: "出荷予定日", rule: "受注日 + 1営業日" },
              { name: "お届け予定日", rule: "出荷予定日 + 2営業日" },
              { name: "支払期限日", rule: "受注日 + 7日" },
              { name: "請求日", rule: "月末締" },
            ].map(r => (
              <div key={r.name} className="flex items-center justify-between p-3 rounded-xl bg-white/40">
                <span className="text-sm font-medium text-gray-800">{r.name}</span>
                <div className="flex items-center gap-2">
                  <input defaultValue={r.rule} className="h-8 w-56 px-3 rounded-lg text-sm text-right bg-white/50 border border-white/50" />
                  <button className="text-xs text-blue-600 hover:text-blue-700">編集</button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
      {tab === 4 && (
        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-4">除外地域の設定</h2>
          <p className="text-sm text-gray-500 mb-4">配送対象外とする地域を設定します。受注時に警告が表示されます。</p>
          <div className="grid grid-cols-4 gap-2">
            {["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"].map(p => (
              <label key={p} className="flex items-center gap-2 p-2 rounded-lg bg-white/40 hover:bg-white/60 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-xs text-gray-700">{p}</span>
              </label>
            ))}
          </div>
          <button className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">保存</button>
        </GlassCard>
      )}
    </div>
  );
}
