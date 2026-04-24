"use client";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

type Row = { id: number; code: string; name: string; fee: number; prepaid: boolean; enabled: boolean };

const initial: Row[] = [
  { id: 1, code: "PAY01", name: "クレジットカード", fee: 0, prepaid: true, enabled: true },
  { id: 2, code: "PAY02", name: "代金引換", fee: 330, prepaid: false, enabled: true },
  { id: 3, code: "PAY03", name: "銀行振込", fee: 0, prepaid: true, enabled: true },
  { id: 4, code: "PAY04", name: "コンビニ払い", fee: 220, prepaid: true, enabled: true },
  { id: 5, code: "PAY05", name: "後払い決済", fee: 250, prepaid: false, enabled: true },
  { id: 6, code: "PAY06", name: "PayPay", fee: 0, prepaid: true, enabled: false },
];

export default function PaymentCategoriesPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(initial);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [fee, setFee] = useState(0);
  const [prepaid, setPrepaid] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.code, r.name].some((v) => v.toLowerCase().includes(q)));
  }, [rows, query]);

  function openNew() {
    setEditing(null);
    setCode(""); setName(""); setFee(0); setPrepaid(true); setEnabled(true);
    setOpen(true);
  }
  function openEdit(r: Row) {
    setEditing(r);
    setCode(r.code); setName(r.name); setFee(r.fee); setPrepaid(r.prepaid); setEnabled(r.enabled);
    setOpen(true);
  }
  function save() {
    const c = code.trim().toUpperCase();
    const n = name.trim();
    if (!c) return toast.show("コードを入力してください", "error");
    if (!n) return toast.show("名称を入力してください", "error");
    if (fee < 0) return toast.show("手数料は0以上で入力してください", "error");
    const dup = rows.some((r) => r.code.toUpperCase() === c && r.id !== editing?.id);
    if (dup) return toast.show(`コード「${c}」は既に存在します`, "error");
    if (editing) {
      setRows((prev) => prev.map((r) => (r.id === editing.id ? { ...r, code: c, name: n, fee, prepaid, enabled } : r)));
      toast.show(`「${n}」を更新しました`);
    } else {
      const id = Math.max(0, ...rows.map((r) => r.id)) + 1;
      setRows((prev) => [...prev, { id, code: c, name: n, fee, prepaid, enabled }]);
      toast.show(`「${n}」を追加しました`);
    }
    setOpen(false);
  }
  function toggleEnabled(r: Row) {
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)));
  }
  function confirmDelete() {
    if (!confirmTarget) return;
    setRows((prev) => prev.filter((r) => r.id !== confirmTarget.id));
    toast.show(`「${confirmTarget.name}」を削除しました`);
    setConfirmTarget(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">区分名称設定 支払方法</h1>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm"
        >
          <Plus className="h-4 w-4" />新規追加
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
              placeholder="コード・名称で検索"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <span className="text-xs text-gray-500 ml-auto">{filtered.length} 件</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">該当する支払方法が登録されていません</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/40">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-24">コード</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">名称</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">手数料</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-24">区分</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-20">有効</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-28">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{r.code}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">{r.name}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">¥{r.fee.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.prepaid ? "bg-blue-500/15 text-blue-700" : "bg-amber-500/15 text-amber-700"}`}>
                      {r.prepaid ? "前払" : "後払"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={r.enabled} onChange={() => toggleEnabled(r)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="inline-flex gap-1">
                      <button type="button" onClick={() => openEdit(r)} aria-label="編集" className="p-1.5 rounded-lg hover:bg-white/60 text-gray-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => setConfirmTarget(r)} aria-label="削除" className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "支払方法を編集" : "支払方法を追加"}
        footer={
          <>
            <SecondaryButton onClick={() => setOpen(false)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={save}>{editing ? "更新" : "追加"}</PrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">コード</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="例: PAY07" className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">名称</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 楽天ペイ" className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">手数料（円）</label>
              <input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value) || 0)} min={0} className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 tabular-nums" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">区分</label>
              <select value={prepaid ? "pre" : "post"} onChange={(e) => setPrepaid(e.target.value === "pre")} className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
                <option value="pre">前払</option>
                <option value="post">後払</option>
              </select>
            </div>
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
        <p className="text-sm text-gray-700">「{confirmTarget?.name}」を削除します。よろしいですか？</p>
      </Modal>
    </div>
  );
}
