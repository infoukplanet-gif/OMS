"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { Undo2, FileText } from "lucide-react";

const Field = ({ label, required, placeholder, className, type = "text", defaultValue }: { label: string; required?: boolean; placeholder?: string; className?: string; type?: string; defaultValue?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500 text-xs">*必須</span>}</label>
    <input type={type} placeholder={placeholder} defaultValue={defaultValue} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
  </div>
);

const Select = ({ label, options, className }: { label: string; options: string[]; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <select className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

export function ReturnForm({ mode }: { mode: "create" | "edit" }) {
  const isEdit = mode === "edit";
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "返品編集" : "返品登録"}</h1>
        <div className="flex gap-2">
          {isEdit && <button className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">削除</button>}
          <button className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "保存"}</button>
        </div>
      </div>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Undo2 className="h-4 w-4 text-gray-400" />返品情報</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="返品番号" placeholder="自動採番" defaultValue={isEdit ? "RET-001" : undefined} />
          <Field label="元受注番号" required placeholder="ORD-2024-00820" />
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">返品受付日</label><DatePicker placeholder="日付を選択" /></div>
          <Field label="顧客名" placeholder="渡辺 京子" />
          <Field label="返品商品" placeholder="ワイヤレスイヤホン Pro" />
          <Field label="返品数量" type="number" placeholder="1" />
          <Select label="返品理由" options={["初期不良", "誤配送", "顧客都合", "破損", "サイズ違い", "イメージ違い"]} />
          <Select label="処理方法" options={["返金", "交換", "代替品送付", "保留"]} />
          <Select label="ステータス" options={["受付済", "処理中", "返金済", "交換済", "完了"]} />
          <Field label="返品送料負担" placeholder="自社/顧客" />
          <Field label="返金額" type="number" placeholder="0" />
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">返金日</label><DatePicker placeholder="日付を選択" /></div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" />備考・対応履歴</h2>
        <div className="space-y-3">
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">返品理由詳細</label><textarea rows={3} placeholder="顧客からの説明..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">対応メモ</label><textarea rows={3} placeholder="社内対応の記録..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" /></div>
        </div>
      </GlassCard>

      <div className="flex justify-end gap-2 pt-2">
        {isEdit && <button className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">削除</button>}
        <button className="px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "保存"}</button>
      </div>
    </div>
  );
}
