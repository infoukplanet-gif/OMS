"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { Plus, Trash2, ClipboardList, Building2, FileText } from "lucide-react";

const Field = ({ label, required, placeholder, className, type = "text", defaultValue }: { label: string; required?: boolean; placeholder?: string; className?: string; type?: string; defaultValue?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500 text-xs">*必須</span>}</label>
    <input type={type} placeholder={placeholder} defaultValue={defaultValue} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
  </div>
);

const Select = ({ label, required, options, className }: { label: string; required?: boolean; options: string[]; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500 text-xs">*必須</span>}</label>
    <select className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

interface PurchaseOrderFormProps {
  mode: "create" | "edit";
}

export function PurchaseOrderForm({ mode }: PurchaseOrderFormProps) {
  const isEdit = mode === "edit";
  const [items, setItems] = useState([1, 2, 3]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "発注編集" : "発注登録"}</h1>
        <div className="flex gap-2">
          {isEdit && <button className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">発注キャンセル</button>}
          <button className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">戻る</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "発注確定"}</button>
        </div>
      </div>

      {isEdit && <div className="text-xs text-gray-500">ダッシュボード &gt; 発注伝票 &gt; <span className="text-blue-600">PO-2024-0045</span> &gt; 編集</div>}

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-gray-400" />発注情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="発注番号" placeholder="自動採番" defaultValue={isEdit ? "PO-2024-0045" : undefined} />
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">発注日</label><DatePicker placeholder="発注日を選択" /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">納期希望日</label><DatePicker placeholder="納期を選択" /></div>
          <Select label="ステータス" options={["下書き", "発注中", "一部入荷", "入荷済", "キャンセル"]} />
          <Select label="納品先倉庫" required options={["東京本社倉庫", "大阪倉庫", "福岡倉庫"]} />
          <Field label="担当者" placeholder="自分" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Building2 className="h-4 w-4 text-gray-400" />仕入先情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="仕入先コード" required placeholder="SUP-001" />
          <Field label="仕入先名" required placeholder="株式会社ABC電子" className="col-span-2" />
          <Field label="担当者" placeholder="鈴木 直子" />
          <Field label="連絡先" placeholder="03-0000-0000" type="tel" />
          <Field label="メール" placeholder="suzuki@example.com" type="email" />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">発注明細</h2>
          <button onClick={() => setItems([...items, items.length + 1])} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"><Plus className="h-4 w-4" />明細を追加</button>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead><tr className="bg-white/50">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品コード</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品名</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">単価</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">数量</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">小計</th>
              <th className="w-10" />
            </tr></thead>
            <tbody>{items.map(i => (
              <tr key={i} className="border-t border-white/30">
                <td className="px-3 py-2"><input className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50" placeholder="WEP-001" /></td>
                <td className="px-3 py-2"><input className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50" placeholder="ワイヤレスイヤホン Pro" /></td>
                <td className="px-3 py-2"><input className="h-7 w-24 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right" placeholder="4,500" /></td>
                <td className="px-3 py-2"><input className="h-7 w-16 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-center" placeholder="50" /></td>
                <td className="px-3 py-2 text-right text-gray-700">¥0</td>
                <td className="px-3 py-2"><button onClick={() => setItems(items.filter(n => n !== i))} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="mt-3 space-y-1 text-sm text-right">
          <div className="flex justify-end gap-8"><span className="text-gray-500">小計</span><span className="w-32 text-gray-700">¥0</span></div>
          <div className="flex justify-end gap-8"><span className="text-gray-500">送料</span><span className="w-32 text-gray-700">¥0</span></div>
          <div className="flex justify-end gap-8"><span className="text-gray-500">消費税(10%)</span><span className="w-32 text-gray-700">¥0</span></div>
          <div className="flex justify-end gap-8 pt-1 border-t border-white/40"><span className="font-medium text-gray-800">合計</span><span className="w-32 font-bold text-gray-800 text-lg">¥0</span></div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" />備考</h2>
        <textarea rows={3} placeholder="仕入先への連絡事項、社内メモなど..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
      </GlassCard>

      <div className="flex justify-end gap-2 pt-2">
        {isEdit && <button className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">発注キャンセル</button>}
        <button className="px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">戻る</button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "発注確定"}</button>
      </div>
    </div>
  );
}
