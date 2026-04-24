"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";

type Tag = { id: number; name: string; color: string };

const COLORS = [
  { key: "red", label: "赤", className: "bg-red-500/15 text-red-700 border-red-500/20" },
  { key: "orange", label: "橙", className: "bg-orange-500/15 text-orange-700 border-orange-500/20" },
  { key: "yellow", label: "黄", className: "bg-yellow-500/15 text-yellow-700 border-yellow-500/20" },
  { key: "emerald", label: "緑", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20" },
  { key: "teal", label: "青緑", className: "bg-teal-500/15 text-teal-700 border-teal-500/20" },
  { key: "blue", label: "青", className: "bg-blue-500/15 text-blue-700 border-blue-500/20" },
  { key: "purple", label: "紫", className: "bg-purple-500/15 text-purple-700 border-purple-500/20" },
  { key: "pink", label: "桃", className: "bg-pink-500/15 text-pink-700 border-pink-500/20" },
];

const initialTags: Tag[] = [
  { id: 1, name: "優先対応", color: COLORS[0].className },
  { id: 2, name: "ギフト", color: COLORS[6].className },
  { id: 3, name: "同梱不可", color: COLORS[1].className },
  { id: 4, name: "リピーター", color: COLORS[5].className },
  { id: 5, name: "法人", color: COLORS[4].className },
  { id: 6, name: "要確認", color: COLORS[2].className },
];

export default function TagsPage() {
  const toast = useToast();
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [colorKey, setColorKey] = useState(COLORS[0].key);

  function openNew() {
    setEditing(null);
    setName("");
    setColorKey(COLORS[0].key);
    setModalOpen(true);
  }

  function openEdit(tag: Tag) {
    setEditing(tag);
    setName(tag.name);
    const found = COLORS.find((c) => tag.color.includes(c.key));
    setColorKey(found?.key ?? COLORS[0].key);
    setModalOpen(true);
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.show("タグ名を入力してください", "error");
      return;
    }
    const color = COLORS.find((c) => c.key === colorKey)!.className;
    if (editing) {
      setTags((prev) => prev.map((t) => (t.id === editing.id ? { ...t, name: trimmed, color } : t)));
      toast.show(`「${trimmed}」を更新しました`);
    } else {
      const id = Math.max(0, ...tags.map((t) => t.id)) + 1;
      setTags((prev) => [...prev, { id, name: trimmed, color }]);
      toast.show(`「${trimmed}」を追加しました`);
    }
    setModalOpen(false);
  }

  function handleDelete(tag: Tag) {
    if (!confirm(`「${tag.name}」を削除しますか？`)) return;
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
    toast.show(`「${tag.name}」を削除しました`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">受注分類タグ設定</h1>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 border border-blue-400/50 text-white hover:bg-blue-600/90 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />タグ追加
        </button>
      </div>

      <GlassCard>
        {tags.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">タグがまだ登録されていません</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {tags.map((t) => (
              <div key={t.id} className={cn("flex items-center justify-between p-3 rounded-xl border", t.color)}>
                <span className="font-medium text-sm">{t.name}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="px-2 py-0.5 rounded hover:bg-white/50 transition-colors text-xs"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t)}
                    aria-label={`${t.name} を削除`}
                    className="p-1 rounded hover:bg-white/50 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "タグを編集" : "タグを追加"}
        footer={
          <>
            <SecondaryButton onClick={() => setModalOpen(false)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={handleSave}>{editing ? "更新" : "追加"}</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">タグ名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 優先対応"
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">カラー</label>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColorKey(c.key)}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-xl text-sm border transition-all",
                    c.className,
                    colorKey === c.key ? "ring-2 ring-blue-500/60 ring-offset-2 ring-offset-white/60" : ""
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">プレビュー</label>
            <div className={cn("inline-flex items-center p-2 rounded-xl border text-sm", COLORS.find((c) => c.key === colorKey)!.className)}>
              {name.trim() || "タグ名"}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
