"use client";
import { useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Plus, ChevronRight, ChevronDown, Folder, FolderOpen, Edit2, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  productCategoryStore,
  INITIAL_CATEGORIES,
  type CategoryRecord,
} from "@/lib/stores/product-category";

function buildTree(all: readonly CategoryRecord[], parentId: string | null = null): CategoryRecord[] {
  return all.filter((c) => c.parentId === parentId).sort((a, b) => a.displayOrder - b.displayOrder);
}

export default function ProductCategoriesPage() {
  const toast = useToast();

  // 永続化オーナー（このページのみ呼ぶ）
  usePersistentStore({ store: productCategoryStore, domain: "product-categories", seed: INITIAL_CATEGORIES });

  // 共有ストアを購読
  const categories = useSyncExternalStore(
    productCategoryStore.subscribe,
    productCategoryStore.getState,
    productCategoryStore.getState,
  );

  const [expanded, setExpanded] = useState<Set<string>>(new Set(["1", "2", "6", "9"]));
  const [editing, setEditing] = useState<CategoryRecord | null>(null);
  const [isNew, setIsNew] = useState(false);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function nextId(): string {
    const maxN = categories.reduce((acc, c) => {
      const n = Number(c.id);
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 0);
    return String(maxN + 1);
  }

  function openNew(parentId: string | null = null) {
    const siblings = categories.filter((c) => c.parentId === parentId);
    setEditing({
      id: nextId(),
      parentId, name: "", slug: "",
      displayOrder: siblings.length + 1, productCount: 0, enabled: true,
    });
    setIsNew(true);
  }
  function openEdit(c: CategoryRecord) { setEditing({ ...c }); setIsNew(false); }

  function save() {
    if (!editing) return;
    if (!editing.name.trim()) return toast.show("カテゴリ名を入力してください", "error");
    productCategoryStore.upsert(editing);
    toast.show(`「${editing.name}」を保存しました`);
    setEditing(null);
  }

  function remove(c: CategoryRecord) {
    const hasChildren = categories.some((x) => x.parentId === c.id);
    if (hasChildren) return toast.show("子カテゴリを先に削除してください", "error");
    if (!confirm(`「${c.name}」を削除しますか？`)) return;
    productCategoryStore.remove(c.id);
    toast.show(`「${c.name}」を削除しました`);
  }

  function renderNode(c: CategoryRecord, depth: number) {
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
  const parentOptions = [{ id: null as string | null, label: "（ルート）" }, ...categories.filter((c) => c.id !== editing?.id).map((c) => ({ id: c.id, label: c.name }))];

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
                onChange={(e) => setEditing({ ...editing, parentId: e.target.value === "" ? null : e.target.value })}
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
