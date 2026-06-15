"use client";

import { useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  importPatternsStore,
  INITIAL_IMPORT_PATTERNS,
  nextImportPatternId,
  type ImportPattern,
} from "@/lib/stores/import-patterns";

const SOURCES = ["楽天市場", "Amazon", "Yahoo!", "自社EC", "au PAY", "その他"];
const DELIMITERS = ["カンマ(,)", "タブ", "パイプ(|)", "セミコロン(;)"];
const ENCODINGS = ["UTF-8", "Shift_JIS", "EUC-JP"];

function todayString() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`;
}

export default function ImportPatternsPage() {
  const toast = useToast();

  // 永続化オーナー（このページのみ usePersistentStore を張る）
  usePersistentStore({
    store: importPatternsStore,
    domain: "import-patterns",
    seed: INITIAL_IMPORT_PATTERNS,
  });

  // ストア購読
  const patterns = useSyncExternalStore(
    importPatternsStore.subscribe,
    importPatternsStore.getState,
    importPatternsStore.getState,
  );

  // モーダル状態
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ImportPattern | null>(null);

  // フォーム状態
  const [name, setName] = useState("");
  const [source, setSource] = useState(SOURCES[0]);
  const [columns, setColumns] = useState(20);
  const [delimiter, setDelimiter] = useState(DELIMITERS[0]);
  const [encoding, setEncoding] = useState(ENCODINGS[0]);
  const [hasHeader, setHasHeader] = useState(true);

  function openNew() {
    setEditing(null);
    setName("");
    setSource(SOURCES[0]);
    setColumns(20);
    setDelimiter(DELIMITERS[0]);
    setEncoding(ENCODINGS[0]);
    setHasHeader(true);
    setModalOpen(true);
  }

  function openEdit(p: ImportPattern) {
    setEditing(p);
    setName(p.name);
    setSource(p.source);
    setColumns(p.columns);
    setDelimiter(p.delimiter);
    setEncoding(p.encoding);
    setHasHeader(p.hasHeader);
    setModalOpen(true);
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.show("パターン名を入力してください", "error");
      return;
    }
    if (editing) {
      importPatternsStore.upsert({
        ...editing,
        name: trimmed,
        source,
        columns,
        delimiter,
        encoding,
        hasHeader,
      });
      toast.show(`「${trimmed}」を更新しました`);
    } else {
      const id = nextImportPatternId(importPatternsStore.getState());
      importPatternsStore.upsert({
        id,
        name: trimmed,
        source,
        columns,
        delimiter,
        encoding,
        hasHeader,
        lastUsed: todayString(),
        count: 0,
      });
      toast.show(`「${trimmed}」を追加しました`);
    }
    setModalOpen(false);
  }

  function handleDelete(p: ImportPattern) {
    if (!confirm(`「${p.name}」を削除しますか？`)) return;
    importPatternsStore.remove(p.id);
    toast.show(`「${p.name}」を削除しました`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">受注一括登録パターン設定</h1>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 border border-blue-400/50 text-white hover:bg-blue-600/90 shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />新規パターン
        </button>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">パターン名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">取得元</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">カラム数</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">区切り</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">エンコード</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">利用回数</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">最終使用</th>
              <th className="w-24 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {patterns.map((p) => (
              <tr key={p.id} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-700">{p.source}</td>
                <td className="px-4 py-3 text-center text-gray-600">{p.columns}</td>
                <td className="px-4 py-3 text-gray-600">{p.delimiter}</td>
                <td className="px-4 py-3 text-gray-600">{p.encoding}</td>
                <td className="px-4 py-3 text-center text-gray-600">{p.count}回</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.lastUsed}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      aria-label={`${p.name} を編集`}
                      className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      aria-label={`${p.name} を削除`}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "パターンを編集" : "新規パターンを作成"}
        size="lg"
        footer={
          <>
            <SecondaryButton onClick={() => setModalOpen(false)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={handleSave}>{editing ? "更新" : "保存"}</PrimaryButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">パターン名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 楽天市場標準"
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">取得元</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            >
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">カラム数</label>
            <input
              type="number"
              min={1}
              max={100}
              value={columns}
              onChange={(e) => setColumns(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">区切り文字</label>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            >
              {DELIMITERS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">エンコード</label>
            <select
              value={encoding}
              onChange={(e) => setEncoding(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            >
              {ENCODINGS.map((enc) => <option key={enc}>{enc}</option>)}
            </select>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            1行目をヘッダー行として扱う
          </label>
        </div>
      </Modal>
    </div>
  );
}
