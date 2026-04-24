"use client";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Search } from "lucide-react";

type Status = "確認待ち" | "引当済" | "出荷待ち";
type Row = { id: string; customer: string; status: Status; amount: number; orderedAt: string };

const initial: Row[] = [
  { id: "ORD-2026-01102", customer: "株式会社サンプル", status: "出荷待ち", amount: 38400, orderedAt: "2026-04-22" },
  { id: "ORD-2026-01101", customer: "山田太郎", status: "出荷待ち", amount: 12800, orderedAt: "2026-04-22" },
  { id: "ORD-2026-01098", customer: "田中一郎", status: "引当済", amount: 5600, orderedAt: "2026-04-22" },
  { id: "ORD-2026-01095", customer: "鈴木商事", status: "出荷待ち", amount: 92400, orderedAt: "2026-04-21" },
  { id: "ORD-2026-01092", customer: "伊藤大輔", status: "確認待ち", amount: 18700, orderedAt: "2026-04-21" },
  { id: "ORD-2026-01090", customer: "株式会社ABC", status: "引当済", amount: 125800, orderedAt: "2026-04-21" },
  { id: "ORD-2026-01088", customer: "小林修", status: "出荷待ち", amount: 3280, orderedAt: "2026-04-20" },
];

const STATUSES: (Status | "すべて")[] = ["すべて", "確認待ち", "引当済", "出荷待ち"];

export default function BulkCompletePage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(initial);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "すべて">("すべて");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<{ total: number; done: number } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const statusOk = statusFilter === "すべて" || r.status === statusFilter;
      const queryOk = !q || [r.id, r.customer].some((v) => v.toLowerCase().includes(q));
      return statusOk && queryOk;
    });
  }, [rows, query, statusFilter]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const selectedTotal = useMemo(
    () => rows.filter((r) => selected.has(r.id)).reduce((s, r) => s + r.amount, 0),
    [rows, selected]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
    });
  }
  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => { const n = new Set(prev); filtered.forEach((r) => n.delete(r.id)); return n; });
    } else {
      setSelected((prev) => { const n = new Set(prev); filtered.forEach((r) => n.add(r.id)); return n; });
    }
  }

  function runComplete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setConfirming(false);
    setProgress({ total: ids.length, done: 0 });
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setProgress({ total: ids.length, done: i });
      if (i >= ids.length) {
        clearInterval(interval);
        setTimeout(() => {
          setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
          setSelected(new Set());
          setProgress(null);
          toast.show(`${ids.length} 件を完了済に変更しました`);
        }, 300);
      }
    }, 180);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">一括注文完了</h1>
        <button
          type="button"
          disabled={selected.size === 0}
          onClick={() => setConfirming(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/90 text-white hover:bg-emerald-600/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          選択した {selected.size} 件を完了
        </button>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="伝票番号・顧客名で検索"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-white/40 border border-white/60">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-white/90 text-blue-600 shadow-sm" : "text-gray-600 hover:bg-white/60"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-auto">
            {selected.size > 0 && <>選択合計 ¥{selectedTotal.toLocaleString()} / </>}
            {filtered.length} 件
          </span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">該当する受注はありません</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/40">
                <th className="w-10 px-3 py-2">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">伝票番号</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">顧客</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-28">ステータス</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">金額</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-28">受注日</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="rounded border-gray-300" />
                  </td>
                  <td className="px-3 py-2.5 font-medium text-blue-600">{r.id}</td>
                  <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "出荷待ち" ? "bg-blue-500/15 text-blue-700" : r.status === "引当済" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-800 tabular-nums">¥{r.amount.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 tabular-nums">{r.orderedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="一括完了確認"
        size="sm"
        footer={
          <>
            <SecondaryButton onClick={() => setConfirming(false)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={runComplete} className="bg-emerald-500/90 hover:bg-emerald-600/90">
              {selected.size} 件を完了
            </PrimaryButton>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          選択した {selected.size} 件（合計 ¥{selectedTotal.toLocaleString()}）を「完了済」に変更します。
          完了後はステータスを戻せません。
        </p>
      </Modal>

      <Modal
        open={!!progress}
        onClose={() => {}}
        title="一括完了処理中"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700 tabular-nums">
            {progress?.done} / {progress?.total} 件処理中
          </p>
          <div className="h-2 rounded-full bg-white/60 overflow-hidden border border-white/40">
            <div
              className="h-full bg-emerald-500 transition-all duration-150"
              style={{ width: `${progress ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">処理が完了するまでこのままお待ちください。</p>
        </div>
      </Modal>
    </div>
  );
}
