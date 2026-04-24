"use client";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Plus, Pencil, Trash2, Search, ArrowRight } from "lucide-react";

type Row = { id: number; from: string; to: string; contains: boolean; enabled: boolean };

const initial: Row[] = [
  { id: 1, from: "午前中", to: "配達希望: 午前中", contains: true, enabled: true },
  { id: 2, from: "のし", to: "のし対応必要", contains: true, enabled: true },
  { id: 3, from: "領収書", to: "領収書同封希望", contains: true, enabled: true },
  { id: 4, from: "ギフト", to: "ギフト包装希望", contains: true, enabled: true },
  { id: 5, from: "不在時", to: "不在時は置き配でも可", contains: true, enabled: false },
];

export default function NotesConversionPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(initial);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [contains, setContains] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [preview, setPreview] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.from, r.to].some((v) => v.toLowerCase().includes(q)));
  }, [rows, query]);

  const previewResult = useMemo(() => {
    if (!preview) return "";
    let out = preview;
    rows.filter((r) => r.enabled).forEach((r) => {
      if (!r.from) return;
      if (r.contains) {
        if (out.includes(r.from)) out = out.replace(new RegExp(r.from, "g"), r.to);
      } else {
        if (out.trim() === r.from) out = r.to;
      }
    });
    return out;
  }, [preview, rows]);

  function openNew() {
    setEditing(null);
    setFrom(""); setTo(""); setContains(true); setEnabled(true);
    setOpen(true);
  }
  function openEdit(r: Row) {
    setEditing(r);
    setFrom(r.from); setTo(r.to); setContains(r.contains); setEnabled(r.enabled);
    setOpen(true);
  }
  function save() {
    const f = from.trim();
    const t = to.trim();
    if (!f) return toast.show("元テキストを入力してください", "error");
    if (!t) return toast.show("変換後テキストを入力してください", "error");
    const dup = rows.some((r) => r.from === f && r.id !== editing?.id);
    if (dup) return toast.show(`「${f}」は既に登録されています`, "error");
    if (editing) {
      setRows((prev) => prev.map((r) => (r.id === editing.id ? { ...r, from: f, to: t, contains, enabled } : r)));
      toast.show("更新しました");
    } else {
      const id = Math.max(0, ...rows.map((r) => r.id)) + 1;
      setRows((prev) => [...prev, { id, from: f, to: t, contains, enabled }]);
      toast.show("追加しました");
    }
    setOpen(false);
  }
  function toggleEnabled(r: Row) {
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)));
  }
  function confirmDelete() {
    if (!confirmTarget) return;
    setRows((prev) => prev.filter((r) => r.id !== confirmTarget.id));
    toast.show("削除しました");
    setConfirmTarget(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">備考欄変換設定</h1>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm"
        >
          <Plus className="h-4 w-4" />変換ルール追加
        </button>
      </div>

      <GlassCard>
        <p className="text-sm text-gray-500 mb-4">
          備考欄の特定テキストを自動で別テキストに変換するルールを管理します。
        </p>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ルールを検索"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <span className="text-xs text-gray-500 ml-auto">{filtered.length} 件</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">ルールが登録されていません</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/40 hover:bg-white/60">
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <code className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs text-gray-700 truncate">{r.from}</code>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <code className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 truncate">{r.to}</code>
                  <span className="text-xs text-gray-400 shrink-0">
                    {r.contains ? "部分一致" : "完全一致"}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" checked={r.enabled} onChange={() => toggleEnabled(r)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
                <div className="inline-flex gap-1 shrink-0">
                  <button type="button" onClick={() => openEdit(r)} aria-label="編集" className="p-1.5 rounded-lg hover:bg-white/60 text-gray-600">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => setConfirmTarget(r)} aria-label="削除" className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">変換プレビュー</h2>
        <textarea
          value={preview}
          onChange={(e) => setPreview(e.target.value)}
          rows={3}
          placeholder="備考欄に入るテキストを入力してみてください"
          className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 resize-none"
        />
        <div className="mt-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-xs text-gray-500 mb-1">変換結果</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap min-h-[1.5em]">{previewResult || <span className="text-gray-400">—</span>}</p>
        </div>
      </GlassCard>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "変換ルールを編集" : "変換ルールを追加"}
        footer={
          <>
            <SecondaryButton onClick={() => setOpen(false)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={save}>{editing ? "更新" : "追加"}</PrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">元テキスト</label>
            <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">変換後テキスト</label>
            <input type="text" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">マッチ方法</label>
            <select value={contains ? "contains" : "exact"} onChange={(e) => setContains(e.target.value === "contains")} className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              <option value="contains">部分一致（含まれていたら変換）</option>
              <option value="exact">完全一致（全体が一致したら変換）</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded border-gray-300" />
            有効化する
          </label>
        </div>
      </Modal>

      <Modal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title="削除確認"
        size="sm"
        footer={
          <>
            <SecondaryButton onClick={() => setConfirmTarget(null)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={confirmDelete} className="bg-red-500/90 hover:bg-red-600/90">削除する</PrimaryButton>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          「{confirmTarget?.from}」→「{confirmTarget?.to}」を削除します。よろしいですか？
        </p>
      </Modal>
    </div>
  );
}
