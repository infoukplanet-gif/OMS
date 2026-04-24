"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Plus, Clock, Trash2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Period = {
  id: number;
  code: string;
  label: string;
  minDays: number;
  maxDays: number;
  displayTextForCustomer: string;
  badgeColor: string;
  showOnShippingFee: boolean;
  applyToOrderCutoff: string;
  productCount: number;
  active: boolean;
};

const BADGE_COLORS = [
  { key: "emerald", label: "緑", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  { key: "blue", label: "青", className: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  { key: "amber", label: "黄", className: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  { key: "orange", label: "橙", className: "bg-orange-500/15 text-orange-700 border-orange-500/30" },
  { key: "red", label: "赤", className: "bg-red-500/15 text-red-700 border-red-500/30" },
  { key: "gray", label: "灰", className: "bg-gray-500/15 text-gray-700 border-gray-500/30" },
];

function colorClass(key: string) {
  return BADGE_COLORS.find((c) => c.key === key)?.className ?? BADGE_COLORS[0].className;
}

const initialPeriods: Period[] = [
  { id: 1, code: "TODAY", label: "即日出荷", minDays: 0, maxDays: 0, displayTextForCustomer: "本日出荷（15時までのご注文）", badgeColor: "emerald", showOnShippingFee: true, applyToOrderCutoff: "15:00", productCount: 842, active: true },
  { id: 2, code: "NEXT", label: "翌営業日", minDays: 1, maxDays: 1, displayTextForCustomer: "翌営業日出荷", badgeColor: "blue", showOnShippingFee: true, applyToOrderCutoff: "", productCount: 520, active: true },
  { id: 3, code: "2-3D", label: "2〜3営業日", minDays: 2, maxDays: 3, displayTextForCustomer: "2〜3営業日以内に出荷", badgeColor: "amber", showOnShippingFee: true, applyToOrderCutoff: "", productCount: 312, active: true },
  { id: 4, code: "1W", label: "1週間以内", minDays: 4, maxDays: 7, displayTextForCustomer: "ご注文から1週間以内に出荷", badgeColor: "orange", showOnShippingFee: false, applyToOrderCutoff: "", productCount: 124, active: true },
  { id: 5, code: "ORDER", label: "受注生産", minDays: 14, maxDays: 30, displayTextForCustomer: "受注生産（2〜4週間）", badgeColor: "red", showOnShippingFee: false, applyToOrderCutoff: "", productCount: 44, active: true },
  { id: 6, code: "SOLD", label: "販売終了", minDays: 0, maxDays: 0, displayTextForCustomer: "販売終了", badgeColor: "gray", showOnShippingFee: false, applyToOrderCutoff: "", productCount: 0, active: false },
];

export default function DeliveryPeriodPage() {
  const toast = useToast();
  const [periods, setPeriods] = useState<Period[]>(initialPeriods);
  const [editing, setEditing] = useState<Period | null>(null);
  const [isNew, setIsNew] = useState(false);

  function openNew() {
    setEditing({
      id: Math.max(0, ...periods.map((p) => p.id)) + 1,
      code: "", label: "", minDays: 0, maxDays: 0,
      displayTextForCustomer: "", badgeColor: "blue",
      showOnShippingFee: true, applyToOrderCutoff: "",
      productCount: 0, active: true,
    });
    setIsNew(true);
  }
  function openEdit(p: Period) { setEditing({ ...p }); setIsNew(false); }

  function save() {
    if (!editing) return;
    if (!editing.code.trim()) return toast.show("区分コードを入力してください", "error");
    if (!editing.label.trim()) return toast.show("区分名を入力してください", "error");
    if (editing.maxDays < editing.minDays) return toast.show("最大日数は最小日数以上にしてください", "error");
    setPeriods((prev) => {
      const exists = prev.some((p) => p.id === editing.id);
      if (exists) return prev.map((p) => (p.id === editing.id ? editing : p));
      return [...prev, editing];
    });
    toast.show(`「${editing.label}」を保存しました`);
    setEditing(null);
  }

  function remove(p: Period) {
    if (p.productCount > 0) return toast.show(`${p.productCount}件の商品で使用中のため削除できません`, "error");
    if (!confirm(`「${p.label}」を削除しますか？`)) return;
    setPeriods((prev) => prev.filter((x) => x.id !== p.id));
    toast.show(`「${p.label}」を削除しました`);
  }

  function toggle(id: number) {
    setPeriods((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">納期区分設定</h1>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm"
        >
          <Plus className="h-4 w-4" />区分を追加
        </button>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/60 text-gray-600 text-xs">
                <th className="text-left py-2 px-2 font-medium">区分コード</th>
                <th className="text-left py-2 px-2 font-medium">区分名</th>
                <th className="text-center py-2 px-2 font-medium">日数</th>
                <th className="text-left py-2 px-2 font-medium">顧客向け表示</th>
                <th className="text-center py-2 px-2 font-medium">送料画面表示</th>
                <th className="text-right py-2 px-2 font-medium">適用商品数</th>
                <th className="text-center py-2 px-2 font-medium">有効</th>
                <th className="text-right py-2 px-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id} className={cn("border-b border-white/40 hover:bg-white/40 transition-colors", !p.active && "opacity-60")}>
                  <td className="py-2 px-2 font-mono text-xs text-gray-700">{p.code}</td>
                  <td className="py-2 px-2">
                    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border", colorClass(p.badgeColor))}>
                      <Clock className="h-3 w-3" />{p.label}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center text-gray-700 text-xs">
                    {p.minDays === p.maxDays ? `${p.minDays}日` : `${p.minDays}〜${p.maxDays}日`}
                  </td>
                  <td className="py-2 px-2 text-gray-700">{p.displayTextForCustomer}</td>
                  <td className="py-2 px-2 text-center text-xs">
                    {p.showOnShippingFee ? <span className="text-emerald-700">表示</span> : <span className="text-gray-400">非表示</span>}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-700">{p.productCount}件</td>
                  <td className="py-2 px-2 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={p.active} onChange={() => toggle(p.id)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => openEdit(p)} aria-label="編集" className="p-1 rounded hover:bg-white/80"><Edit2 className="h-3.5 w-3.5 text-gray-600" /></button>
                      <button type="button" onClick={() => remove(p)} aria-label="削除" className="p-1 rounded hover:bg-red-100 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? "納期区分を追加" : "納期区分を編集"}
        footer={
          <>
            <SecondaryButton onClick={() => setEditing(null)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={save}>保存</PrimaryButton>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">区分コード</label>
                <input
                  type="text"
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  placeholder="例: TODAY"
                  className="w-full h-9 px-3 rounded-xl text-sm font-mono bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">区分名</label>
                <input
                  type="text"
                  value={editing.label}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  placeholder="例: 即日出荷"
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">最小日数</label>
                <input
                  type="number" min={0}
                  value={editing.minDays}
                  onChange={(e) => setEditing({ ...editing, minDays: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">最大日数</label>
                <input
                  type="number" min={0}
                  value={editing.maxDays}
                  onChange={(e) => setEditing({ ...editing, maxDays: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">顧客向け表示文言</label>
              <input
                type="text"
                value={editing.displayTextForCustomer}
                onChange={(e) => setEditing({ ...editing, displayTextForCustomer: e.target.value })}
                placeholder="例: 本日出荷（15時までのご注文）"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">受注締切時刻（即日出荷など）</label>
              <input
                type="time"
                value={editing.applyToOrderCutoff}
                onChange={(e) => setEditing({ ...editing, applyToOrderCutoff: e.target.value })}
                className="w-32 h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">バッジカラー</label>
              <div className="grid grid-cols-6 gap-1.5">
                {BADGE_COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setEditing({ ...editing, badgeColor: c.key })}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-xs border",
                      c.className,
                      editing.badgeColor === c.key ? "ring-2 ring-blue-500/60" : ""
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={editing.showOnShippingFee} onChange={(e) => setEditing({ ...editing, showOnShippingFee: e.target.checked })} className="rounded" />
              <span className="text-gray-700">送料・配送画面にも表示する</span>
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
