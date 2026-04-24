"use client";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { AlertCircle, Search } from "lucide-react";

type Row = { id: string; reason: string; createdAt: string };

const initial: Row[] = [
  { id: "ORD-2024-00840", reason: "在庫不足", createdAt: "2026-04-12 10:34" },
  { id: "ORD-2024-00835", reason: "決済エラー", createdAt: "2026-04-12 09:18" },
  { id: "ORD-2024-00828", reason: "手動無効化", createdAt: "2026-04-11 17:44" },
  { id: "ORD-2024-00820", reason: "住所不備", createdAt: "2026-04-11 14:02" },
  { id: "ORD-2024-00815", reason: "決済エラー", createdAt: "2026-04-11 11:09" },
];

export default function ActivatePage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<Row | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.id, r.reason].some((v) => v.toLowerCase().includes(q)));
  }, [rows, query]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const n = new Set(prev);
        filtered.forEach((r) => n.delete(r.id));
        return n;
      });
    } else {
      setSelected((prev) => {
        const n = new Set(prev);
        filtered.forEach((r) => n.add(r.id));
        return n;
      });
    }
  }
  function activateOne(r: Row) {
    setRows((prev) => prev.filter((x) => x.id !== r.id));
    setSelected((prev) => {
      const n = new Set(prev); n.delete(r.id); return n;
    });
    toast.show(`${r.id} を有効化しました`);
    setConfirmTarget(null);
  }
  function activateBulk() {
    const ids = Array.from(selected);
    setRows((prev) => prev.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
    toast.show(`${ids.length} 件の伝票を有効化しました`);
    setConfirmBulk(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">受注伝票有効化</h1>
        <button
          type="button"
          disabled={selected.size === 0}
          onClick={() => setConfirmBulk(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          選択した {selected.size} 件を有効化
        </button>
      </div>

      <GlassCard>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-800">無効化された受注伝票を有効化できます。有効化すると在庫引当が再度行われます。</p>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="伝票番号・理由で検索"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <span className="text-xs text-gray-500 ml-auto">{filtered.length} 件</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">対象の無効伝票はありません</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/40">
                <th className="w-10 px-3 py-2">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">伝票番号</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">無効理由</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">登録日時</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-28">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="rounded border-gray-300" />
                  </td>
                  <td className="px-3 py-2.5 font-medium text-blue-600">{r.id}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-700">{r.reason}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 tabular-nums">{r.createdAt}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => setConfirmTarget(r)}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                    >
                      有効化
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      <Modal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title="有効化確認"
        size="sm"
        footer={
          <>
            <SecondaryButton onClick={() => setConfirmTarget(null)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={() => confirmTarget && activateOne(confirmTarget)}>有効化する</PrimaryButton>
          </>
        }
      >
        <p className="text-sm text-gray-700">{confirmTarget?.id} を有効化します。在庫引当が再度行われます。</p>
      </Modal>

      <Modal
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        title="一括有効化確認"
        size="sm"
        footer={
          <>
            <SecondaryButton onClick={() => setConfirmBulk(false)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={activateBulk}>{selected.size} 件を有効化</PrimaryButton>
          </>
        }
      >
        <p className="text-sm text-gray-700">選択した {selected.size} 件を一括有効化します。よろしいですか？</p>
      </Modal>
    </div>
  );
}
