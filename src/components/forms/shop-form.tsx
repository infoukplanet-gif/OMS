"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Store, CreditCard, HelpCircle } from "lucide-react";

const Field = ({ label, required, placeholder, className, type = "text", defaultValue }: { label: string; required?: boolean; placeholder?: string; className?: string; type?: string; defaultValue?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500 text-xs">*必須</span>}</label>
    <input type={type} placeholder={placeholder} defaultValue={defaultValue} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
  </div>
);

const Select = ({ label, required, options, className, defaultValue }: { label: string; required?: boolean; options: string[]; className?: string; defaultValue?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500 text-xs">*必須</span>}</label>
    <select defaultValue={defaultValue} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

interface ShopFormProps {
  mode: "create" | "edit";
}

export function ShopForm({ mode }: ShopFormProps) {
  const isEdit = mode === "edit";
  const [tab, setTab] = useState<"basic" | "payment">("basic");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "店舗編集" : "店舗設定"}</h1>
          <p className="text-sm text-gray-500 mt-1">{isEdit ? "店舗情報を編集します。" : "新規店舗の追加ができます。"}</p>
        </div>
        <div className="flex gap-2">
          {isEdit && <button className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">削除</button>}
          <button className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "店舗を新規登録"}</button>
        </div>
      </div>

      {isEdit && <div className="text-xs text-gray-500">設定 &gt; 店舗設定 &gt; <span className="text-blue-600">楽天市場 サンプルショップ</span> &gt; 編集</div>}

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/40 bg-white/30">
          <h2 className="text-sm font-semibold text-gray-700">店舗情報を{isEdit ? "編集" : "新規登録"}</h2>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 px-5 pt-4 border-b border-white/40">
          <button
            onClick={() => setTab("basic")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm transition-all",
              tab === "basic"
                ? "bg-white/80 border border-white/50 border-b-transparent text-blue-600 font-medium -mb-px"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Store className="h-4 w-4" />基本設定
          </button>
          <button
            onClick={() => setTab("payment")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm transition-all",
              tab === "payment"
                ? "bg-white/80 border border-white/50 border-b-transparent text-blue-600 font-medium -mb-px"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <CreditCard className="h-4 w-4" />決済情報設定
          </button>
        </div>

        <div className="p-5">
          {/* 基本設定タブ */}
          {tab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="店舗名称" required placeholder="例: 楽天市場 サンプルショップ" className="col-span-2" />
                <Field label="店舗略記" required placeholder="例: 楽天" />
                <Field label="店舗かな" placeholder="さんぷるしょっぷ" />
                <Field label="備考" placeholder="店舗に関する備考" className="col-span-2" />
                <Field label="取扱商品" placeholder="例: 電子部品、アクセサリー" className="col-span-2" />
                <Select
                  label="出店モール"
                  required
                  options={[
                    "出店モールを選んでください。",
                    "楽天市場",
                    "Amazon",
                    "Yahoo!ショッピング",
                    "Shopify",
                    "BASE",
                    "STORES",
                    "au PAY マーケット",
                    "Qoo10",
                    "自社EC",
                    "卸売",
                    "電話・FAX受注",
                    "その他",
                  ]}
                  className="col-span-2"
                />
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700">モール設定</label>
                  <div className="p-3 rounded-xl bg-white/40 text-xs text-gray-500">
                    出店モールを選択すると、モール固有の設定項目が表示されます（API キー、店舗ID など）
                  </div>
                </div>
                <label className="col-span-2 flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">ヒット商品お知らせ対象店舗</span>
                </label>
                <label className="col-span-2 flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">インボイス形式を適用</span>
                  <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                </label>
                <Select
                  label="規定の発送方法"
                  required
                  options={["ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運", "ゆうパケット", "メール便"]}
                  className="col-span-2"
                />
                <Select label="税区分" required options={["税込", "税抜"]} />
                <Select label="税計算順序" required options={["商品計で税計算", "単価から税計算"]} />
                <Select label="通貨単位区分" required options={["円", "USD", "EUR", "CNY"]} />
              </div>
            </div>
          )}

          {/* 決済情報設定タブ */}
          {tab === "payment" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">この店舗で利用する決済方法を設定します。</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  "クレジットカード",
                  "銀行振込",
                  "代金引換",
                  "コンビニ決済",
                  "後払い決済",
                  "Amazon Pay",
                  "楽天ペイ",
                  "PayPay",
                  "Apple Pay / Google Pay",
                  "請求書払い（卸用）",
                ].map((m) => (
                  <label key={m} className="flex items-center gap-2 p-3 rounded-xl bg-white/40 hover:bg-white/60 cursor-pointer transition-colors">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">{m}</span>
                  </label>
                ))}
              </div>

              <div className="pt-3 border-t border-white/40 space-y-3">
                <p className="text-sm font-medium text-gray-700">手数料設定</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="代引手数料" type="number" placeholder="330" />
                  <Field label="銀行振込手数料" type="number" placeholder="0" />
                  <Field label="後払い手数料" type="number" placeholder="200" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/40 bg-white/30 flex justify-end gap-2">
          {isEdit && <button className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">削除</button>}
          <button className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "店舗を新規登録"}</button>
        </div>
      </GlassCard>
    </div>
  );
}
