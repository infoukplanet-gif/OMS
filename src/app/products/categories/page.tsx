"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Plus, ChevronRight, ChevronDown, Folder, FolderOpen, Edit2, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  displayOrder: number;
  productCount: number;
  enabled: boolean;
};

const initialCategories: Category[] = [
  { id: 1, parentId: null, name: "ファッション", slug: "fashion", displayOrder: 1, productCount: 384, enabled: true },
  { id: 2, parentId: 1, name: "レディース", slug: "ladies", displayOrder: 1, productCount: 220, enabled: true },
  { id: 3, parentId: 2, name: "トップス", slug: "tops", displayOrder: 1, productCount: 95, enabled: true },
  { id: 4, parentId: 2, name: "ボトムス", slug: "bottoms", displayOrder: 2, productCount: 76, enabled: true },
  { id: 5, parentId: 2, name: "ワンピース", slug: "onepiece", displayOrder: 3, productCount: 49, enabled: true },
  { id: 6, parentId: 1, name: "メンズ", slug: "mens", displayOrder: 2, productCount: 164, enabled: true },
  { id: 7, parentId: 6, name: "トップス", slug: "mens-tops", displayOrder: 1, productCount: 84, enabled: true },
  { id: 8, parentId: 6, name: "ボトムス", slug: "mens-bottoms", displayOrder: 2, productCount: 80, enabled: true },
  { id: 9, parentId: null, name: "雑貨", slug: "goods", displayOrder: 2, productCount: 132, enabled: true },
  { id: 10, parentId: 9, name: "アクセサリー", slug: "accessories", displayOrder: 1, productCount: 78, enabled: true },
  { id: 11, parentId: 9, name: "バッグ", slug: "bags", displayOrder: 2, productCount: 54, enabled: false },
  { id: 12, parentId: null, name: "セール", slug: "sale", displayOrder: 3, productCount: 42, enabled: true },
];

function buildTree(all: Category[], parentId: number | null = null): Category[] {
  return all.filter((c) => c.parentId === parentId).sort((a, b) => a.displayOrder - b.displayOrder);
}

export default function ProductCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1, 2, 6, 9]));
  const [editing, setEditing] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openNew(parentId: number | null = null) {
    const siblings = categories.filter((c) => c.parentId === parentId);
    setEditing({
      id: Math.max(0, ...categories.map((c) => c.id)) + 1,
      parentId, name: "", slug: "",
      displayOrder: siblings.length + 1, productCount: 0, enabled: true,
    });
    setIsNew(true);
  }
  function openEdit(c: Category) { setEditing({ ...c }); setIsNew(false); }

  function save() {
    if (!editing) return;
    if (!editing.name.trim()) return toast.show("カテゴリ名を入力してください", "error");
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === editing.id);
      if (exists) return prev.map((c) => (c.id === editing.id ? editing : c));
      return [...prev, editing];
    });
    toast.show(`「${editing.name}」を保存しました`);
    setEditing(null);
  }

  function remove(c: Category) {
    const hasChildren = categories.some((x) => x.parentId === c.id);
    if (hasChildren) return toast.show("子カテゴリを先に削除してください", "error");
    if (!confirm(`「${c.name}」を削除しますか？`)) return;
    setCategories((prev) => prev.filter((x) => x.id !== c.id));
    toast.show(`「${c.name}」を削除しました`);
  }

  function renderNode(c: Category, depth: number) {
    const children = buildTree(categories, c.id);
    const isOpen = expanded.has(c.id);
    return (
      <div key={c.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/70 group",
            !c.enabled && "opacity-50"
          )}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          <GripVertical className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab" />
          {children.length > 0 ? (
            <button type="button" onClick={() => toggle(c.id)} aria-label={isOpen ? "折りたたむ" : "展開"} className="p-0.5 rounded hover:bg-white">
              {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="w-4 h-4" />
          )}
          {children.length > 0 && isOpen ? (
            <FolderOpen className="h-4 w-4 text-amber-500" />
          ) : (
            <Folder className="h-4 w-4 text-amber-500" />
          )}
          <span className="text-sm text-gray-800 flex-1 truncate">{c.name}</span>
          <span className="text-xs text-gray-400 font-mono">{c.slug}</span>
          <span className="text-xs text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">{c.productCount}件</span>
          {!c.enabled && <span className="text-xs text-gray-500 bg-gray-400/15 px-2 py-0.5 rounded-full">非表示</span>}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={() => openNew(c.id)} aria-label="子カテゴリを追加" className="p-1 rounded hover:bg-white"><Plus className="h-3.5 w-3.5 text-gray-500" /></button>
            <button type="button" onClick={() => openEdit(c)} aria-label="編集" className="p-1 rounded hover:bg-white"><Edit2 className="h-3.5 w-3.5 text-gray-500" /></button>
            <button type="button" onClick={() => remove(c)} aria-label="削除" className="p-1 rounded hover:bg-red-100"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
          </div>
        </div>
        {isOpen && children.map((ch) => renderNode(ch, depth + 1))}
      </div>
    );
  }

  const roots = buildTree(categories, null);
  const parentOptions = [{ id: null as number | null, label: "（ルート）" }, ...categories.filter((c) => c.id !== editing?.id).map((c) => ({ id: c.id, label: c.name }))];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">店舗内カテゴリマスタ設定</h1>
        <button
          type="button"
          onClick={() => openNew(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm"
        >
          <Plus className="h-4 w-4" />カテゴリを追加
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="p-3 rounded-xl bg-white/60 border border-white/60">
          <div className="text-xs text-gray-500">総カテゴリ数</div>
          <div className="text-xl font-bold text-gray-800 mt-1">{categories.length}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/60 border border-white/60">
          <div className="text-xs text-gray-500">ルートカテゴリ</div>
          <div className="text-xl font-bold text-gray-800 mt-1">{categories.filter((c) => c.parentId === null).length}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/60 border border-white/60">
          <div className="text-xs text-gray-500">有効</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{categories.filter((c) => c.enabled).length}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/60 border border-white/60">
          <div className="text-xs text-gray-500">非表示</div>
          <div className="text-xl font-bold text-gray-500 mt-1">{categories.filter((c) => !c.enabled).length}</div>
        </div>
      </div>

      <GlassCard>
        <div className="space-y-0.5">
          {roots.map((c) => renderNode(c, 0))}
          {roots.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">カテゴリが登録されていません</p>
          )}
        </div>
      </GlassCard>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? "カテゴリを追加" : "カテゴリを編集"}
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
              <label className="block text-xs font-medium text-gray-600 mb-1">親カテゴリ</label>
              <select
                value={editing.parentId ?? ""}
                onChange={(e) => setEditing({ ...editing, parentId: e.target.value === "" ? null : Number(e.target.value) })}
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
              >
                {parentOptions.map((o) => (
                  <option key={o.id ?? "root"} value={o.id ?? ""}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">カテゴリ名</label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="例: トップス"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">URLスラッグ</label>
              <input
                type="text"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                placeholder="例: tops"
                className="w-full h-9 px-3 rounded-xl text-sm font-mono bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">表示順</label>
              <input
                type="number" min={1}
                value={editing.displayOrder}
                onChange={(e) => setEditing({ ...editing, displayOrder: Number(e.target.value) })}
                className="w-24 h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} className="rounded" />
              <span className="text-gray-700">このカテゴリを表示する</span>
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
