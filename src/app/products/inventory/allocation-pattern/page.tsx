"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Plus, Copy, Trash2, MoveUp, MoveDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type Rule = {
  warehouse: string;
  priority: number;
};

type Pattern = {
  id: number;
  name: string;
  description: string;
  rules: Rule[];
  appliedShops: string[];
  strategy: "priority" | "ratio" | "nearest";
  enabled: boolean;
};

const WAREHOUSES = ["本社倉庫", "大阪倉庫", "福岡倉庫", "FBA倉庫", "3PL東京"];
const SHOPS = ["楽天市場店", "Yahoo!店", "Amazon店", "自社Shopify", "BASE店"];

const STRATEGY_LABEL: Record<Pattern["strategy"], string> = {
  priority: "優先順位（上から順に引当）",
  ratio: "比率配分（指定比率で分割）",
  nearest: "最寄り優先（配送先から近い順）",
};

const initialPatterns: Pattern[] = [
  {
    id: 1,
    name: "標準パターン",
    description: "本社 → 大阪 → 福岡の順で引当",
    rules: [
      { warehouse: "本社倉庫", priority: 1 },
      { warehouse: "大阪倉庫", priority: 2 },
      { warehouse: "福岡倉庫", priority: 3 },
    ],
    appliedShops: ["楽天市場店", "Yahoo!店", "自社Shopify"],
    strategy: "priority",
    enabled: true,
  },
  {
    id: 2,
    name: "Amazon FBA専用",
    description: "FBA倉庫のみから引当",
    rules: [{ warehouse: "FBA倉庫", priority: 1 }],
    appliedShops: ["Amazon店"],
    strategy: "priority",
    enabled: true,
  },
  {
    id: 3,
    name: "3PL優先パターン",
    description: "3PL東京を優先して自社倉庫を温存",
    rules: [
      { warehouse: "3PL東京", priority: 1 },
      { warehouse: "本社倉庫", priority: 2 },
    ],
    appliedShops: ["BASE店"],
    strategy: "priority",
    enabled: false,
  },
];

export default function AllocationPatternPage() {
  const toast = useToast();
  const [patterns, setPatterns] = useState<Pattern[]>(initialPatterns);
  const [editing, setEditing] = useState<Pattern | null>(null);
  const [isNew, setIsNew] = useState(false);

  function openNew() {
    setEditing({
      id: Math.max(0, ...patterns.map((p) => p.id)) + 1,
      name: "", description: "", rules: [{ warehouse: WAREHOUSES[0], priority: 1 }],
      appliedShops: [], strategy: "priority", enabled: true,
    });
    setIsNew(true);
  }
  function openEdit(p: Pattern) { setEditing({ ...p, rules: [...p.rules] }); setIsNew(false); }
  function duplicate(p: Pattern) {
    const id = Math.max(0, ...patterns.map((p) => p.id)) + 1;
    setPatterns((prev) => [...prev, { ...p, id, name: `${p.name} のコピー`, appliedShops: [] }]);
    toast.show(`「${p.name}」を複製しました`);
  }
  function remove(p: Pattern) {
    if (!confirm(`「${p.name}」を削除しますか？`)) return;
    setPatterns((prev) => prev.filter((x) => x.id !== p.id));
    toast.show(`「${p.name}」を削除しました`);
  }
  function toggleEnabled(id: number) {
    setPatterns((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  }

  function save() {
    if (!editing) return;
    if (!editing.name.trim()) return toast.show("パターン名を入力してください", "error");
    if (editing.rules.length === 0) return toast.show("拠点ルールを1つ以上追加してください", "error");
    setPatterns((prev) => {
      const exists = prev.some((p) => p.id === editing.id);
      if (exists) return prev.map((p) => (p.id === editing.id ? editing : p));
      return [...prev, editing];
    });
    toast.show(`「${editing.name}」を保存しました`);
    setEditing(null);
  }

  function moveRule(idx: number, dir: -1 | 1) {
    if (!editing) return;
    const target = idx + dir;
    if (target < 0 || target >= editing.rules.length) return;
    const rules = [...editing.rules];
    [rules[idx], rules[target]] = [rules[target], rules[idx]];
    rules.forEach((r, i) => { r.priority = i + 1; });
    setEditing({ ...editing, rules });
  }
  function addRule() {
    if (!editing) return;
    setEditing({
      ...editing,
      rules: [...editing.rules, { warehouse: WAREHOUSES[0], priority: editing.rules.length + 1 }],
    });
  }
  function removeRule(idx: number) {
    if (!editing) return;
    const rules = editing.rules.filter((_, i) => i !== idx);
    rules.forEach((r, i) => { r.priority = i + 1; });
    setEditing({ ...editing, rules });
  }
  function toggleShop(shop: string) {
    if (!editing) return;
    const has = editing.appliedShops.includes(shop);
    setEditing({
      ...editing,
      appliedShops: has ? editing.appliedShops.filter((s) => s !== shop) : [...editing.appliedShops, shop],
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">引当拠点のパターン設定</h1>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm"
        >
          <Plus className="h-4 w-4" />パターンを追加
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patterns.map((p) => (
          <GlassCard key={p.id}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500 shrink-0" />
                  <h3 className="font-semibold text-gray-800 truncate">{p.name}</h3>
                  {p.enabled ? (
                    <span className="text-xs bg-emerald-500/15 text-emerald-700 px-2 py-0.5 rounded-full">有効</span>
                  ) : (
                    <span className="text-xs bg-gray-400/15 text-gray-600 px-2 py-0.5 rounded-full">無効</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{p.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-2 shrink-0">
                <input type="checkbox" checked={p.enabled} onChange={() => toggleEnabled(p.id)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>

            <div className="text-xs text-gray-500 mb-2">
              戦略: <span className="text-gray-700">{STRATEGY_LABEL[p.strategy]}</span>
            </div>

            <div className="space-y-1.5 mb-3">
              {p.rules.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-white/60 rounded-lg px-2.5 py-1.5">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-500/15 text-blue-700 text-xs font-semibold">{r.priority}</span>
                  <span className="text-gray-800">{r.warehouse}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {p.appliedShops.map((s) => (
                <span key={s} className="text-xs bg-purple-500/15 text-purple-700 px-2 py-0.5 rounded-full">{s}</span>
              ))}
              {p.appliedShops.length === 0 && (
                <span className="text-xs text-gray-400">未割当</span>
              )}
            </div>

            <div className="flex items-center gap-1 pt-3 border-t border-white/60">
              <button type="button" onClick={() => openEdit(p)} className="px-3 py-1 rounded-lg text-xs bg-white/70 border border-white/60 hover:bg-white">編集</button>
              <button type="button" onClick={() => duplicate(p)} className="px-3 py-1 rounded-lg text-xs bg-white/70 border border-white/60 hover:bg-white flex items-center gap-1">
                <Copy className="h-3 w-3" />複製
              </button>
              <button type="button" onClick={() => remove(p)} aria-label={`${p.name} を削除`} className="px-3 py-1 rounded-lg text-xs text-red-600 hover:bg-red-100 flex items-center gap-1 ml-auto">
                <Trash2 className="h-3 w-3" />削除
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? "パターンを追加" : "パターンを編集"}
        footer={
          <>
            <SecondaryButton onClick={() => setEditing(null)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={save}>保存</PrimaryButton>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">パターン名</label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="例: 標準パターン"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">説明</label>
              <input
                type="text"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="例: 本社倉庫優先"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">引当戦略</label>
              <select
                value={editing.strategy}
                onChange={(e) => setEditing({ ...editing, strategy: e.target.value as Pattern["strategy"] })}
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
              >
                {(Object.keys(STRATEGY_LABEL) as Pattern["strategy"][]).map((s) => (
                  <option key={s} value={s}>{STRATEGY_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">引当拠点ルール</label>
                <button type="button" onClick={addRule} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Plus className="h-3 w-3" />拠点を追加
                </button>
              </div>
              <div className="space-y-1.5">
                {editing.rules.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/60 rounded-lg px-2 py-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-500/15 text-blue-700 text-xs font-semibold">{r.priority}</span>
                    <select
                      value={r.warehouse}
                      onChange={(e) => {
                        const rules = [...editing.rules];
                        rules[idx] = { ...r, warehouse: e.target.value };
                        setEditing({ ...editing, rules });
                      }}
                      className="flex-1 h-8 px-2 rounded-lg text-xs bg-white border border-white/60"
                    >
                      {WAREHOUSES.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <button type="button" onClick={() => moveRule(idx, -1)} aria-label="上へ" className="p-1 rounded hover:bg-white"><MoveUp className="h-3 w-3" /></button>
                    <button type="button" onClick={() => moveRule(idx, 1)} aria-label="下へ" className="p-1 rounded hover:bg-white"><MoveDown className="h-3 w-3" /></button>
                    <button type="button" onClick={() => removeRule(idx)} aria-label="削除" className="p-1 rounded hover:bg-red-100 text-red-500"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">適用する店舗</label>
              <div className="grid grid-cols-2 gap-1.5">
                {SHOPS.map((s) => (
                  <label key={s} className={cn(
                    "flex items-center gap-2 text-sm cursor-pointer rounded-lg px-2 py-1.5 border transition-colors",
                    editing.appliedShops.includes(s) ? "bg-blue-500/10 border-blue-400/60" : "bg-white/60 border-white/60 hover:bg-white/80"
                  )}>
                    <input type="checkbox" checked={editing.appliedShops.includes(s)} onChange={() => toggleShop(s)} className="rounded" />
                    <span className="text-gray-700">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
