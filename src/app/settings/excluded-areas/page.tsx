"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { MapPin, Plus, Search, Trash2 } from "lucide-react";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  excludedAreasStore,
  INITIAL_EXCLUDED_AREAS,
  type AreaRule,
} from "@/lib/stores/excluded-areas-store";

const prefs = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"];
const carriers = ["ヤマト", "佐川", "ゆうパック", "西濃", "福通"];

export default function ExcludedAreasPage() {
  const toast = useToast();

  // 永続化オーナー
  usePersistentStore({
    store: excludedAreasStore,
    domain: "excluded-areas",
    seed: INITIAL_EXCLUDED_AREAS,
  });

  const storeRules = useSyncExternalStore(
    excludedAreasStore.subscribe,
    excludedAreasStore.getState,
    excludedAreasStore.getState,
  );

  // ドラフト状態（インライン編集用）。ストアが復元されたら同期する。
  // ストア配列はそのまま参照保持し、編集は常に immutable に新配列を作る
  // （setState に都度新規配列を渡すと set-state-in-effect で警告されるため）。
  const [rules, setRules] = useState<readonly AreaRule[]>(storeRules);
  const [keyword, setKeyword] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");

  useEffect(() => {
    setRules(storeRules);
  }, [storeRules]);

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

  const fileRef = useRef<HTMLInputElement>(null);

  const parseCsv = (text: string): AreaRule[] => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    // 先頭行が見出し（「都道府県」を含む）の場合はスキップ
    const startsAt = lines[0].includes("都道府県") ? 1 : 0;
    const out: AreaRule[] = [];
    for (let i = startsAt; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const [prefecture, zipPattern, reason, carrierCol, surchargeCol, codCol, enabledCol] = cols;
      if (!prefecture || !prefs.includes(prefecture)) continue;
      const ruleCarriers = (carrierCol ?? "")
        .split(/[|;／・]/)
        .map((c) => c.trim())
        .filter((c) => carriers.includes(c));
      out.push({
        id: `ar-import-${i}-${out.length}`,
        prefecture,
        zipPattern: zipPattern ?? "",
        reason: reason ?? "",
        carriers: ruleCarriers.length > 0 ? ruleCarriers : ["ヤマト"],
        surcharge: Number(surchargeCol) || 0,
        cod: /^(true|1|可|○|代引可)$/i.test(codCol ?? ""),
        enabled: enabledCol === undefined || /^(true|1|有効|○)$/i.test(enabledCol),
      });
    }
    return out;
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        toast.show("取込可能な行がありませんでした（都道府県列を確認してください）", "info");
        return;
      }
      const merged = [...rules, ...parsed];
      setRules(merged);
      excludedAreasStore.setItems(merged);
      toast.show(`${parsed.length}件の除外地域を取込みました`, "success");
    } catch {
      toast.show("CSVの読み込みに失敗しました", "error");
    }
  };

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
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = "";
            }}
          />
          <SecondaryButton onClick={() => fileRef.current?.click()}>CSVインポート</SecondaryButton>
          <PrimaryButton onClick={() => { excludedAreasStore.setItems(rules); toast.show("配送除外地域設定を保存しました", "success"); }}>保存</PrimaryButton>
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
          <SecondaryButton onClick={() => {
            const newRule: AreaRule = { id: `ar-${Date.now()}`, prefecture: "北海道", zipPattern: "", reason: "離島・遠隔地", carriers: ["ヤマト"], surcharge: 0, cod: false, enabled: true };
            excludedAreasStore.upsert(newRule);
            setRules((prev) => [...prev, newRule]);
          }}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" />新規追加</span>
          </SecondaryButton>
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
                  <button onClick={() => { excludedAreasStore.remove(r.id); setRules((p) => p.filter((x) => x.id !== r.id)); toast.show("ルールを削除しました", "info"); }} className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25">
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
