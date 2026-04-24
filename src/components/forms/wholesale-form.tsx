"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { Building2, MapPin, CreditCard, FileText } from "lucide-react";

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

export function WholesaleForm({ mode }: { mode: "create" | "edit" }) {
  const isEdit = mode === "edit";
  const d = isEdit ? { code: "WS-001", name: "株式会社ABC商事", contact: "山本部長" } : {} as Record<string, string>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "卸先編集" : "卸先登録"}</h1>
        <div className="flex gap-2">
          {isEdit && <button className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">削除</button>}
          <button className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "保存"}</button>
        </div>
      </div>

      {isEdit && <div className="text-xs text-gray-500">ダッシュボード &gt; 卸先マスタ &gt; <span className="text-blue-600">{d.name}</span> &gt; 編集</div>}

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Building2 className="h-4 w-4 text-gray-400" />基本情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="取引先コード" required placeholder="WS-001" defaultValue={d.code} />
          <Field label="屋号・通称" placeholder="サンプル商店" />
          <Field label="法人名" required placeholder="株式会社サンプル" defaultValue={d.name} className="col-span-2" />
          <Field label="法人名カナ" placeholder="カブシキガイシャサンプル" className="col-span-2" />
          <Field label="法人番号" placeholder="1234567890123" />
          <Field label="インボイス登録番号" placeholder="T1234567890123" />
          <Field label="代表者名" placeholder="山田 太郎" />
          <Field label="業種" placeholder="小売業" />
          <Field label="Webサイト" placeholder="https://example.com" className="col-span-2" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">担当者情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="担当者名" required placeholder="田中 花子" defaultValue={d.contact} />
          <Field label="担当者カナ" placeholder="タナカ ハナコ" />
          <Field label="部署名" placeholder="仕入部" />
          <Field label="役職" placeholder="主任" />
          <Field label="担当者電話" placeholder="090-0000-0000" type="tel" />
          <Field label="担当者メール" placeholder="tanaka@example.com" type="email" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" />連絡先・住所</h2>
        <div className="grid grid-cols-6 gap-4">
          <Field label="電話番号" required placeholder="03-0000-0000" className="col-span-2" type="tel" />
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
          <Select label="取引区分" required options={["掛売", "前払い", "都度払い", "委託"]} />
          <Select label="価格グループ" options={["A（標準卸）", "S（特別卸）", "B（大口）", "C（小口）"]} />
          <Field label="与信限度額" type="number" placeholder="500000" />
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">取引開始日</label><DatePicker placeholder="取引開始日を選択" /></div>
          <Select label="締日" options={["毎月末日", "毎月10日", "毎月15日", "毎月20日", "毎月25日"]} />
          <Select label="支払方法" options={["銀行振込", "現金", "小切手", "手形"]} />
          <Select label="支払サイト" options={["翌月末払い", "翌々月末払い", "30日後", "60日後", "90日後"]} />
          <Select label="課税区分" options={["課税", "非課税", "免税"]} />
          <Field label="最低発注金額" type="number" placeholder="10000" />
          <Field label="送料負担" placeholder="自社負担/客先負担" />
          <Field label="手数料率" type="number" placeholder="0" />
          <Select label="割引率" options={["0%", "5%", "10%", "15%", "20%"]} />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">振込先情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="銀行名" placeholder="三井住友銀行" />
          <Field label="支店名" placeholder="本店" />
          <Select label="口座種別" options={["普通", "当座", "貯蓄"]} />
          <Field label="口座番号" placeholder="0000000" />
          <Field label="口座名義" placeholder="カ）サンプル" className="col-span-2" />
          <Field label="口座名義カナ" placeholder="カブシキガイシャサンプル" className="col-span-2" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">配送設定</h2>
        <div className="grid grid-cols-4 gap-4">
          <Select label="デフォルト配送方法" options={["ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運"]} />
          <Field label="配送先名" placeholder="サンプル商店 倉庫" />
          <Field label="配送先電話" placeholder="03-0000-0000" type="tel" />
          <Field label="配送先郵便番号" placeholder="100-0001" />
          <Field label="配送先住所" placeholder="東京都千代田区..." className="col-span-3" />
          <div className="space-y-1.5 col-span-4"><label className="text-sm font-medium text-gray-700">配送時の注意事項</label><textarea rows={2} placeholder="納品時間指定、搬入口の場所など..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" /></div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" />備考・社内メモ</h2>
        <textarea rows={4} placeholder="取引履歴、注意事項、社内向けメモなど..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
      </GlassCard>

      <div className="flex justify-end gap-2 pt-2">
        {isEdit && <button className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">削除</button>}
        <button className="px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "保存"}</button>
      </div>
    </div>
  );
}
