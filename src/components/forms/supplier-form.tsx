"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { Building2, MapPin, CreditCard, Truck, FileText } from "lucide-react";

const Field = ({ label, required, placeholder, className, type = "text", defaultValue }: { label: string; required?: boolean; placeholder?: string; className?: string; type?: string; defaultValue?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500 text-xs">*必須</span>}</label>
    <input type={type} placeholder={placeholder} defaultValue={defaultValue} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
  </div>
);

const Select = ({ label, required, options, className }: { label: string; required?: boolean; options: string[]; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500 text-xs">*必須</span>}</label>
    <select className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

export function SupplierForm({ mode }: { mode: "create" | "edit" }) {
  const isEdit = mode === "edit";
  const d = isEdit ? { code: "SUP-001", name: "株式会社ABC電子", contact: "鈴木 直子" } : {} as Record<string, string>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "仕入先編集" : "仕入先登録"}</h1>
        <div className="flex gap-2">
          {isEdit && <button className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">削除</button>}
          <button className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "保存"}</button>
        </div>
      </div>

      {isEdit && <div className="text-xs text-gray-500">ダッシュボード &gt; 仕入先マスタ &gt; <span className="text-blue-600">{d.name}</span> &gt; 編集</div>}

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Building2 className="h-4 w-4 text-gray-400" />基本情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="仕入先コード" required placeholder="SUP-001" defaultValue={d.code} />
          <Field label="仕入先名" required placeholder="株式会社ABC電子" defaultValue={d.name} className="col-span-2" />
          <Field label="仕入先名カナ" placeholder="カブシキガイシャエービーシーデンシ" />
          <Field label="法人番号" placeholder="1234567890123" />
          <Field label="インボイス登録番号" placeholder="T1234567890123" />
          <Field label="代表者名" placeholder="佐藤 一郎" />
          <Field label="業種" placeholder="電子部品商社" />
          <Field label="主な取扱商品" placeholder="電子部品、ケーブル類" className="col-span-2" />
          <Field label="Webサイト" placeholder="https://example.com" className="col-span-2" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">担当者情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="担当者名" required placeholder="鈴木 直子" defaultValue={d.contact} />
          <Field label="担当者カナ" placeholder="スズキ ナオコ" />
          <Field label="部署名" placeholder="営業部" />
          <Field label="役職" placeholder="課長" />
          <Field label="担当者電話" placeholder="090-0000-0000" type="tel" />
          <Field label="担当者メール" placeholder="suzuki@example.com" type="email" />
          <Field label="副担当者" placeholder="田中 次郎" />
          <Field label="副担当者連絡先" placeholder="03-0000-0000" type="tel" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" />連絡先・住所</h2>
        <div className="grid grid-cols-6 gap-4">
          <Field label="代表電話" required placeholder="03-0000-0000" className="col-span-2" type="tel" />
          <Field label="FAX" placeholder="03-0000-0000" className="col-span-2" type="tel" />
          <Field label="代表メール" placeholder="info@example.com" className="col-span-2" type="email" />
          <Field label="郵便番号" placeholder="100-0001" className="col-span-1" />
          <Select label="都道府県" options={["選択してください", "東京都", "大阪府"]} className="col-span-1" />
          <Field label="市区町村" placeholder="千代田区" className="col-span-2" />
          <Field label="番地" placeholder="千代田1-1-1" className="col-span-2" />
          <Field label="建物名・部屋番号" placeholder="サンプルビル 10F" className="col-span-6" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-400" />取引条件</h2>
        <div className="grid grid-cols-4 gap-4">
          <Select label="取引区分" required options={["買取", "委託", "預り在庫"]} />
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">取引開始日</label><DatePicker placeholder="取引開始日を選択" /></div>
          <Select label="通貨" options={["JPY - 日本円", "USD - 米ドル", "EUR - ユーロ", "CNY - 人民元"]} />
          <Select label="課税区分" options={["課税", "免税", "輸入"]} />
          <Select label="締日" options={["毎月末日", "毎月10日", "毎月15日", "毎月20日", "毎月25日"]} />
          <Select label="支払方法" options={["銀行振込", "現金", "小切手", "手形"]} />
          <Select label="支払サイト" options={["翌月末払い", "翌々月末払い", "30日後", "60日後", "90日後"]} />
          <Field label="最低発注金額" type="number" placeholder="50000" />
          <Field label="発注リードタイム（日）" type="number" placeholder="7" />
          <Field label="最小ロット数" type="number" placeholder="10" />
          <Field label="送料負担" placeholder="自社負担/仕入先負担" />
          <Select label="評価ランク" options={["A", "B", "C", "D"]} />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">振込先情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="銀行名" placeholder="三菱UFJ銀行" />
          <Field label="支店名" placeholder="新宿支店" />
          <Select label="口座種別" options={["普通", "当座", "貯蓄"]} />
          <Field label="口座番号" placeholder="0000000" />
          <Field label="口座名義" placeholder="カ）エービーシーデンシ" className="col-span-2" />
          <Field label="SWIFT/BIC（海外）" placeholder="BOTKJPJT" className="col-span-2" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Truck className="h-4 w-4 text-gray-400" />配送・物流</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="出荷元住所" placeholder="東京都品川区..." className="col-span-2" />
          <Select label="主要配送業者" options={["ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運"]} />
          <Field label="出荷曜日" placeholder="月・水・金" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" />備考・社内メモ</h2>
        <textarea rows={4} placeholder="取引履歴、品質情報、社内向けメモなど..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
      </GlassCard>

      <div className="flex justify-end gap-2 pt-2">
        {isEdit && <button className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">削除</button>}
        <button className="px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "保存"}</button>
      </div>
    </div>
  );
}
