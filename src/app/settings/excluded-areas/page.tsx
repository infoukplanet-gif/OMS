"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { MapPin, Search, Trash2 } from "lucide-react";

type AreaRule = {
  id: string;
  prefecture: string;
  zipPattern: string;
  reason: string;
  carriers: string[];
  surcharge: number;
  cod: boolean;
  enabled: boolean;
};

const initialRules: AreaRule[] = [
  { id: "ar-1", prefecture: "北海道", zipPattern: "040-0000〜099-9999", reason: "離島・遠隔地", carriers: ["ヤマト", "佐川"], surcharge: 880, cod: false, enabled: true },
  { id: "ar-2", prefecture: "沖縄県", zipPattern: "900-0000〜907-9999", reason: "離島", carriers: ["ヤマト", "佐川", "ゆうパック"], surcharge: 1100, cod: false, enabled: true },
  { id: "ar-3", prefecture: "東京都", zipPattern: "100-0301〜100-0511", reason: "小笠原・伊豆諸島", carriers: ["ゆうパック"], surcharge: 1650, cod: false, enabled: true },
  { id: "ar-4", prefecture: "鹿児島県", zipPattern: "891-0000〜899-9999", reason: "奄美群島", carriers: ["ヤマト", "佐川"], surcharge: 880, cod: false, enabled: true },
  { id: "ar-5", prefecture: "島根県", zipPattern: "684-0000〜684-9999", reason: "隠岐諸島", carriers: ["ゆうパック"], surcharge: 770, cod: false, enabled: true },
  { id: "ar-6", prefecture: "新潟県", zipPattern: "952-0000〜952-9999", reason: "佐渡島", carriers: ["ヤマト"], surcharge: 550, cod: true, enabled: true },
  { id: "ar-7", prefecture: "長崎県", zipPattern: "817-0000〜819-9999", reason: "離島群（壱岐・対馬・五島）", carriers: ["ゆうパック"], surcharge: 1320, cod: false, enabled: true },
];

const prefs = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"];
const carriers = ["ヤマト", "佐川", "ゆうパック", "西濃", "福通"];

export default function ExcludedAreasPage() {
  const toast = useToast();
  const [rules, setRules] = useState(initialRules);
  const [keyword, setKeyword] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return rules.filter((r) => {
      if (k && !`${r.prefecture} ${r.zipPattern} ${r.reason}`.toLowerCase().includes(k)) return false;
      if (carrierFilter !== "all" && !r.carriers.includes(carrierFilter)) return false;
      return true;
    });
  }, [rules, keyword, carrierFilter]);

  const update = (id: string, patch: Partial<AreaRule>) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">配送除外地域設定</h1>
            <HelpHint>離島・遠隔地など、通常配送料金で発送できない地域を登録します。受注時に自動で警告・追加送料を付与します。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">対象地域・追加送料・代引可否を業者別に設定し、受注画面に反映します。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => toast.show("除外地域をCSVでインポートします", "info")}>CSVインポート</SecondaryButton>
          <PrimaryButton onClick={() => toast.show("配送除外地域設定を保存しました", "success")}>保存</PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録地域</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{rules.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">有効ルール</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{rules.filter((r) => r.enabled).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">代引不可地域</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{rules.filter((r) => !r.cod).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">平均追加送料</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            ¥{Math.round(rules.reduce((s, r) => s + r.surcharge, 0) / rules.length).toLocaleString()}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="都道府県・郵便番号・理由"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">配送業者: すべて</option>
            {carriers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setCarrierFilter("all"); }}>クリア</SecondaryButton>
          <SecondaryButton onClick={() => toast.show("新規地域ルールを追加します", "info")}>新規追加</SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {rules.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">都道府県</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">郵便番号範囲</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">理由</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">対象配送業者</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">追加送料</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">代引</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">有効</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={cn("border-t border-white/30 hover:bg-white/40", !r.enabled && "opacity-60")}>
                <td className="px-3 py-2.5">
                  <select value={r.prefecture} onChange={(e) => update(r.id, { prefecture: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    {prefs.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <input value={r.zipPattern} onChange={(e) => update(r.id, { zipPattern: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs font-mono w-44" />
                </td>
                <td className="px-3 py-2.5">
                  <input value={r.reason} onChange={(e) => update(r.id, { reason: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs w-44" />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {r.carriers.map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded-md text-[10px] bg-blue-500/15 text-blue-700 inline-flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />{c}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <input type="number" value={r.surcharge} onChange={(e) => update(r.id, { surcharge: Number(e.target.value) })} className="w-20 px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs text-right" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <input type="checkbox" checked={r.cod} onChange={(e) => update(r.id, { cod: e.target.checked })} className="accent-blue-500" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={r.enabled} onChange={(e) => update(r.id, { enabled: e.target.checked })} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button onClick={() => { setRules((p) => p.filter((x) => x.id !== r.id)); toast.show("ルールを削除しました", "info"); }} className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
