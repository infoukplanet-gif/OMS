"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Plus, ArrowRight, Trash2, Store } from "lucide-react";
import { cn } from "@/lib/utils";

type Mall = "rakuten" | "yahoo" | "amazon" | "shopify";
type Mapping = {
  id: number;
  internalCategory: string;
  mall: Mall;
  mallCategoryPath: string;
  mallCategoryId: string;
  active: boolean;
};

const MALL_LABEL: Record<Mall, string> = {
  rakuten: "楽天市場",
  yahoo: "Yahoo!ショッピング",
  amazon: "Amazon",
  shopify: "Shopify",
};

const INTERNAL_CATEGORIES = [
  "ファッション / レディース / トップス",
  "ファッション / レディース / ボトムス",
  "ファッション / レディース / ワンピース",
  "ファッション / メンズ / トップス",
  "ファッション / メンズ / ボトムス",
  "雑貨 / アクセサリー",
  "雑貨 / バッグ",
];

const initialMappings: Mapping[] = [
  { id: 1, internalCategory: "ファッション / レディース / トップス", mall: "rakuten", mallCategoryPath: "レディースファッション > トップス > Tシャツ・カットソー", mallCategoryId: "100371", active: true },
  { id: 2, internalCategory: "ファッション / レディース / トップス", mall: "yahoo", mallCategoryPath: "ファッション > レディースファッション > トップス", mallCategoryId: "2497", active: true },
  { id: 3, internalCategory: "ファッション / レディース / トップス", mall: "amazon", mallCategoryPath: "Fashion > Women > Tops & Tees", mallCategoryId: "7141123051", active: true },
  { id: 4, internalCategory: "ファッション / レディース / ボトムス", mall: "rakuten", mallCategoryPath: "レディースファッション > パンツ", mallCategoryId: "100371A", active: true },
  { id: 5, internalCategory: "雑貨 / アクセサリー", mall: "shopify", mallCategoryPath: "Jewelry > Necklaces", mallCategoryId: "ap-neck", active: true },
  { id: 6, internalCategory: "雑貨 / バッグ", mall: "rakuten", mallCategoryPath: "レディースバッグ > ハンドバッグ", mallCategoryId: "216131", active: false },
];

export default function CategoryMappingPage() {
  const toast = useToast();
  const [mappings, setMappings] = useState<Mapping[]>(initialMappings);
  const [editing, setEditing] = useState<Mapping | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterMall, setFilterMall] = useState<string>("all");
  const [filterInternal, setFilterInternal] = useState<string>("all");

  const filtered = mappings.filter((m) => {
    if (filterMall !== "all" && m.mall !== filterMall) return false;
    if (filterInternal !== "all" && m.internalCategory !== filterInternal) return false;
    return true;
  });

  function openNew() {
    setEditing({
      id: Math.max(0, ...mappings.map((m) => m.id)) + 1,
      internalCategory: INTERNAL_CATEGORIES[0],
      mall: "rakuten",
      mallCategoryPath: "", mallCategoryId: "", active: true,
    });
    setIsNew(true);
  }
  function openEdit(m: Mapping) { setEditing({ ...m }); setIsNew(false); }

  function save() {
    if (!editing) return;
    if (!editing.mallCategoryPath.trim()) return toast.show("モール側カテゴリを入力してください", "error");
    setMappings((prev) => {
      const exists = prev.some((m) => m.id === editing.id);
      if (exists) return prev.map((m) => (m.id === editing.id ? editing : m));
      return [...prev, editing];
    });
    toast.show("マッピングを保存しました");
    setEditing(null);
  }

  function remove(m: Mapping) {
    if (!confirm("このマッピングを削除しますか？")) return;
    setMappings((prev) => prev.filter((x) => x.id !== m.id));
    toast.show("マッピングを削除しました");
  }

  function toggle(id: number) {
    setMappings((prev) => prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">カテゴリ変換設定</h1>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm"
        >
          <Plus className="h-4 w-4" />マッピングを追加
        </button>
      </div>

      <GlassCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">店舗内カテゴリで絞り込み</label>
            <select
              value={filterInternal}
              onChange={(e) => setFilterInternal(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
            >
              <option value="all">すべて</option>
              {INTERNAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">モールで絞り込み</label>
            <select
              value={filterMall}
              onChange={(e) => setFilterMall(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
            >
              <option value="all">すべて</option>
              {(Object.keys(MALL_LABEL) as Mall[]).map((m) => <option key={m} value={m}>{MALL_LABEL[m]}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/60 text-gray-600 text-xs">
                <th className="text-left py-2 px-2 font-medium">店舗内カテゴリ</th>
                <th className="text-center py-2 px-2 font-medium" style={{ width: "30px" }}></th>
                <th className="text-left py-2 px-2 font-medium">モール</th>
                <th className="text-left py-2 px-2 font-medium">モール側カテゴリ</th>
                <th className="text-left py-2 px-2 font-medium">カテゴリID</th>
                <th className="text-center py-2 px-2 font-medium">有効</th>
                <th className="text-right py-2 px-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className={cn("border-b border-white/40 hover:bg-white/40 transition-colors", !m.active && "opacity-60")}>
                  <td className="py-2 px-2 text-gray-800">{m.internalCategory}</td>
                  <td className="py-2 px-2 text-center"><ArrowRight className="h-3.5 w-3.5 text-gray-400 inline" /></td>
                  <td className="py-2 px-2">
                    <span className="inline-flex items-center gap-1.5 text-xs bg-blue-500/15 text-blue-700 px-2 py-0.5 rounded-full">
                      <Store className="h-3 w-3" />{MALL_LABEL[m.mall]}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-gray-700">{m.mallCategoryPath}</td>
                  <td className="py-2 px-2 text-xs font-mono text-gray-500">{m.mallCategoryId}</td>
                  <td className="py-2 px-2 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={m.active} onChange={() => toggle(m.id)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => openEdit(m)} className="px-2 py-0.5 rounded text-xs text-blue-600 hover:bg-blue-50">編集</button>
                      <button type="button" onClick={() => remove(m)} aria-label="削除" className="p-1 rounded hover:bg-red-100 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-gray-500">条件に一致するマッピングがありません</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? "マッピングを追加" : "マッピングを編集"}
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
              <label className="block text-xs font-medium text-gray-600 mb-1">店舗内カテゴリ</label>
              <select
                value={editing.internalCategory}
                onChange={(e) => setEditing({ ...editing, internalCategory: e.target.value })}
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
              >
                {INTERNAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">変換先モール</label>
              <select
                value={editing.mall}
                onChange={(e) => setEditing({ ...editing, mall: e.target.value as Mall })}
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
              >
                {(Object.keys(MALL_LABEL) as Mall[]).map((m) => <option key={m} value={m}>{MALL_LABEL[m]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">モール側カテゴリパス</label>
              <input
                type="text"
                value={editing.mallCategoryPath}
                onChange={(e) => setEditing({ ...editing, mallCategoryPath: e.target.value })}
                placeholder="例: レディースファッション > トップス > Tシャツ"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">カテゴリID</label>
              <input
                type="text"
                value={editing.mallCategoryId}
                onChange={(e) => setEditing({ ...editing, mallCategoryId: e.target.value })}
                placeholder="例: 100371"
                className="w-full h-9 px-3 rounded-xl text-sm font-mono bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="rounded" />
              <span className="text-gray-700">このマッピングを有効にする</span>
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
