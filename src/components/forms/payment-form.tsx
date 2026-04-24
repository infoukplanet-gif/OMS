"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { CreditCard, FileText } from "lucide-react";

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

interface PaymentFormProps {
  mode: "create" | "edit";
}

export function PaymentForm({ mode }: PaymentFormProps) {
  const isEdit = mode === "edit";
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "入金編集" : "入金登録"}</h1>
        <div className="flex gap-2">
          {isEdit && <button className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">削除</button>}
          <button className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "保存"}</button>
        </div>
      </div>
      {isEdit && <div className="text-xs text-gray-500">ダッシュボード &gt; 入金管理 &gt; 編集</div>}

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-400" />入金情報</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="受注番号" required placeholder="ORD-2024-00851" />
          <Field label="顧客名" placeholder="山田 太郎" />
          <Field label="受注金額" type="number" placeholder="32400" />
          <Field label="入金額" required type="number" placeholder="32400" />
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">入金日</label><DatePicker placeholder="入金日を選択" /></div>
          <Select label="入金方法" required options={["銀行振込", "クレジットカード", "代金引換", "現金", "コンビニ払い"]} />
          <Field label="振込人名義" placeholder="ヤマダ タロウ" />
          <Field label="振込先口座" placeholder="三井住友 本店 普通 0000000" className="col-span-2" />
          <Select label="入金状態" options={["未入金", "一部入金", "入金済み", "返金済み"]} />
          <Field label="差額" type="number" placeholder="0" />
          <Select label="自動消込" options={["する", "しない"]} />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" />備考</h2>
        <textarea rows={3} placeholder="入金に関する備考..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
      </GlassCard>

      <div className="flex justify-end gap-2 pt-2">
        {isEdit && <button className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">削除</button>}
        <button className="px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "保存"}</button>
      </div>
    </div>
  );
}
