"use client";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Search, Maximize2 } from "lucide-react";

type Row = { id: string; customer: string; note: string; checked: boolean };

const initial: Row[] = [
  { id: "ORD-2026-01102", customer: "株式会社サンプル", note: "ギフト包装希望。のし紙（内のし・御祝・佐藤様）でお願いします。12月23日までに先方へ到着するようにご手配ください。配送状況が分かり次第ご連絡お願いします。", checked: false },
  { id: "ORD-2026-01101", customer: "山田太郎", note: "午前中指定でお願いします", checked: false },
  { id: "ORD-2026-01098", customer: "田中一郎", note: "領収書同封希望（宛名：株式会社ABC）", checked: true },
  { id: "ORD-2026-01095", customer: "鈴木商事", note: "商品Aと商品Bは別梱包でお願いします。納期優先で発送してください。", checked: false },
  { id: "ORD-2026-01092", customer: "伊藤大輔", note: "不在時は置き配でも可", checked: false },
  { id: "ORD-2026-01088", customer: "小林修", note: "電話連絡必要", checked: true },
];

export default function NotesPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(initial);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expand, setExpand] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.id, r.customer, r.note].some((v) => v.toLowerCase().includes(q)));
  }, [rows, query]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id) || r.checked);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
    });
  }
  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => { const n = new Set(prev); filtered.forEach((r) => n.delete(r.id)); return n; });
    } else {
      setSelected((prev) => {
        const n = new Set(prev);
        filtered.filter((r) => !r.checked).forEach((r) => n.add(r.id));
        return n;
      });
    }
  }
  function markChecked(ids: string[]) {
    if (ids.length === 0) return;
    setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, checked: true } : r)));
    setSelected(new Set());
    toast.show(`${ids.length} 件を確認済にしました`);
  }
  function markUnchecked(r: Row) {
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, checked: false } : x)));
    toast.show(`${r.id} の確認を取消しました`, "info");
  }

  const selectedCount = selected.size;
  const pendingCount = rows.filter((r) => !r.checked).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">備考欄一括確認</h1>
          <p className="text-xs text-gray-500 mt-1">未確認 {pendingCount} 件</p>
        </div>
        <button
          type="button"
          disabled={selectedCount === 0}
          onClick={() => markChecked(Array.from(selected))}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          選択した {selectedCount} 件を確認済
        </button>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="伝票番号・顧客名・備考内容で検索"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <span className="text-xs text-gray-500 ml-auto">{filtered.length} 件</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">該当する備考付き受注はありません</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/40 border-b border-white/40">
                <th className="w-10 px-3 py-2">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-36">伝票番号</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-40">顧客名</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">備考内容</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-28">確認済</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-white/30 hover:bg-white/40 align-top">
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      disabled={r.checked}
                      onChange={() => toggle(r.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-2.5 font-medium text-blue-600">{r.id}</td>
                  <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                  <td
                    className="px-3 py-2.5 text-gray-600 cursor-pointer group"
                    onDoubleClick={() => setExpand(r)}
                    title="ダブルクリックで全文表示"
                  >
                    <div className="flex items-start gap-2">
                      <span className="line-clamp-2">{r.note}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setExpand(r); }}
                        aria-label="全文表示"
                        className="p-1 rounded hover:bg-white/60 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <Maximize2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {r.checked ? (
                      <button
                        type="button"
                        onClick={() => markUnchecked(r)}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
                      >
                        確認済
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markChecked([r.id])}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                      >
                        確認
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      <Modal
        open={!!expand}
        onClose={() => setExpand(null)}
        title={expand ? `${expand.id} ${expand.customer} の備考` : ""}
        size="lg"
        footer={
          <>
            <SecondaryButton onClick={() => setExpand(null)}>閉じる</SecondaryButton>
            {expand && !expand.checked && (
              <PrimaryButton onClick={() => { markChecked([expand.id]); setExpand(null); }}>
                確認済にする
              </PrimaryButton>
            )}
          </>
        }
      >
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{expand?.note}</p>
      </Modal>
    </div>
  );
}
