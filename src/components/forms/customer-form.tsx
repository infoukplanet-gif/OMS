"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { Plus, Trash2, User, Phone, MapPin, FileText } from "lucide-react";

const Field = ({ label, required, placeholder, className, type = "text", defaultValue }: { label: string; required?: boolean; placeholder?: string; className?: string; type?: string; defaultValue?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500 text-xs">*必須</span>}
    </label>
    <input type={type} placeholder={placeholder} defaultValue={defaultValue} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
  </div>
);

const Select = ({ label, required, options, className, defaultValue }: { label: string; required?: boolean; options: string[]; className?: string; defaultValue?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500 text-xs">*必須</span>}
    </label>
    <select defaultValue={defaultValue} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

interface CustomerFormProps {
  mode: "create" | "edit";
  initialData?: Record<string, unknown>;
}

export function CustomerForm({ mode, initialData }: CustomerFormProps) {
  const [shippingAddresses, setShippingAddresses] = useState([1, 2]);
  const isEdit = mode === "edit";

  const addAddress = () => {
    if (shippingAddresses.length < 5) setShippingAddresses([...shippingAddresses, shippingAddresses.length + 1]);
  };

  const removeAddress = (i: number) => {
    setShippingAddresses(shippingAddresses.filter(n => n !== i));
  };

  // Sample data for edit mode
  const d = isEdit ? {
    code: "CUS-0001", name: "山田 太郎", kana: "ヤマダ タロウ", email: "yamada@example.com", tel: "090-1234-5678",
  } : {} as Record<string, string>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "顧客編集" : "顧客登録"}</h1>
        <div className="flex gap-2">
          {isEdit && <button className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25 transition-all">削除</button>}
          <button className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all">キャンセル</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">{isEdit ? "更新" : "保存"}</button>
        </div>
      </div>

      {isEdit && (
        <div className="text-xs text-gray-500">
          ダッシュボード &gt; 顧客一覧 &gt; <span className="text-blue-600">{d.name}</span> &gt; 編集
        </div>
      )}

      {/* 基本情報 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><User className="h-4 w-4 text-gray-400" />基本情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="顧客コード" required placeholder="CUS-0001" defaultValue={d.code} />
          <Field label="顧客名" required placeholder="山田 太郎" defaultValue={d.name} />
          <Field label="顧客名カナ" placeholder="ヤマダ タロウ" defaultValue={d.kana} />
          <Select label="性別" options={["未設定", "男性", "女性", "その他"]} />
          <Field label="ニックネーム" placeholder="タロちゃん" />
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">生年月日</label><DatePicker placeholder="生年月日を選択" /></div>
          <Field label="会社名" placeholder="株式会社サンプル" />
          <Field label="部署名" placeholder="営業部" />
          <Field label="役職" placeholder="部長" />
          <Select label="顧客区分" options={["一般", "VIP", "法人", "取引先"]} />
          <Select label="ランク" options={["通常", "シルバー", "ゴールド", "プラチナ"]} />
          <Field label="紹介元" placeholder="Webサイト/知人紹介など" />
        </div>
      </GlassCard>

      {/* 連絡先 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" />連絡先</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="電話番号1" placeholder="03-0000-0000" type="tel" defaultValue={d.tel} />
          <Field label="電話番号2" placeholder="090-0000-0000" type="tel" />
          <Field label="電話番号3" placeholder="予備" type="tel" />
          <Field label="FAX" placeholder="03-0000-0000" type="tel" />
          <Field label="メールアドレス1" required placeholder="example@mail.com" type="email" defaultValue={d.email} />
          <Field label="メールアドレス2" placeholder="予備" type="email" />
          <Field label="LINE ID" placeholder="@yamada" />
          <Field label="Webサイト" placeholder="https://example.com" />
        </div>
      </GlassCard>

      {/* 請求先住所 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" />請求先住所</h2>
        <div className="grid grid-cols-6 gap-4">
          <Field label="郵便番号" placeholder="100-0001" className="col-span-1" />
          <Select label="都道府県" options={["選択してください", "東京都", "大阪府", "北海道"]} className="col-span-1" />
          <Field label="市区町村" placeholder="千代田区" className="col-span-2" />
          <Field label="番地" placeholder="千代田1-1-1" className="col-span-2" />
          <Field label="建物名・部屋番号" placeholder="サンプルビル 10F" className="col-span-6" />
        </div>
      </GlassCard>

      {/* 送付先住所 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" />送付先住所（{shippingAddresses.length}/5件）</h2>
          {shippingAddresses.length < 5 && (
            <button onClick={addAddress} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"><Plus className="h-4 w-4" />送付先を追加</button>
          )}
        </div>
        {shippingAddresses.map((i) => (
          <GlassCard key={i}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">送付先 {i}</h3>
              <button onClick={() => removeAddress(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-6 gap-4">
              <Field label="送付先名" placeholder="山田 太郎" className="col-span-2" />
              <Field label="送付先名カナ" placeholder="ヤマダ タロウ" className="col-span-2" />
              <Field label="電話番号" placeholder="090-0000-0000" className="col-span-2" type="tel" />
              <Field label="郵便番号" placeholder="100-0001" className="col-span-1" />
              <Select label="都道府県" options={["選択してください", "東京都", "大阪府"]} className="col-span-1" />
              <Field label="市区町村" placeholder="千代田区" className="col-span-2" />
              <Field label="番地・建物" placeholder="千代田1-1-1 ビル10F" className="col-span-2" />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* 取引・配送設定 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">取引・配送設定</h2>
        <div className="grid grid-cols-3 gap-4">
          <Select label="デフォルト支払方法" options={["クレジットカード", "銀行振込", "代金引換", "請求書払い"]} />
          <Select label="デフォルト配送方法" options={["ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運"]} />
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">取引開始日</label><DatePicker placeholder="取引開始日を選択" /></div>
          <Field label="購入回数" type="number" defaultValue={isEdit ? "24" : "0"} />
          <Field label="累計購入金額" type="number" defaultValue={isEdit ? "384200" : "0"} />
          <Select label="メール配信" options={["希望する", "希望しない"]} />
        </div>
      </GlassCard>

      {/* 備考 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" />備考・社内メモ</h2>
        <div className="space-y-4">
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">顧客向け備考</label><textarea rows={2} placeholder="顧客にも表示される備考..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">社内連絡欄（顧客非表示）</label><textarea rows={3} placeholder="社内スタッフのみが閲覧できるメモ..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" /></div>
        </div>
      </GlassCard>

      <div className="flex justify-end gap-2 pt-2">
        {isEdit && <button className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25 transition-all">削除</button>}
        <button className="px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all">キャンセル</button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">{isEdit ? "更新" : "保存"}</button>
      </div>
    </div>
  );
}
