"use client";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Package, DollarSign, Globe, Image as ImageIcon, Upload, Boxes, FileText } from "lucide-react";

const Field = ({ label, required, placeholder, className, type = "text", defaultValue }: { label: string; required?: boolean; placeholder?: string; className?: string; type?: string; defaultValue?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500 text-xs">*必須</span>}</label>
    <input type={type} placeholder={placeholder} defaultValue={defaultValue} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
  </div>
);

const Select = ({ label, required, options, className, value, onChange }: { label: string; required?: boolean; options: string[]; className?: string; value?: string; onChange?: (v: string) => void }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500 text-xs">*必須</span>}</label>
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    >
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  </div>
);

const Toggle = ({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) => (
  <label className="flex items-center justify-between p-2 rounded-lg bg-white/40 hover:bg-white/60 cursor-pointer">
    <span className="text-sm text-gray-700">{label}</span>
    <div className="relative inline-flex items-center">
      <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
      <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
    </div>
  </label>
);

type Component = {
  id: number;
  sku: string;
  name: string;
  variation: string;
  quantity: number;
  unitPrice: number;
  cost: number;
  required: boolean;
};

const initialComponents: Component[] = [
  { id: 1, sku: "WEP-001-BK", name: "ワイヤレスイヤホン Pro", variation: "ブラック", quantity: 1, unitPrice: 12800, cost: 4500, required: true },
  { id: 2, sku: "CASE-003", name: "シリコンケース", variation: "ブラック", quantity: 1, unitPrice: 1200, cost: 300, required: true },
  { id: 3, sku: "CBL-007", name: "USB-Cケーブル 1m", variation: "白", quantity: 1, unitPrice: 980, cost: 220, required: false },
];

export function SetProductForm({ mode }: { mode: "create" | "edit" }) {
  const isEdit = mode === "edit";
  const [components, setComponents] = useState<Component[]>(initialComponents);
  const [setPrice, setSetPrice] = useState<number>(13800);
  const [stockMode, setStockMode] = useState("構成品在庫に連動");

  const totals = useMemo(() => {
    const normalTotal = components.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
    const costTotal = components.reduce((sum, c) => sum + c.cost * c.quantity, 0);
    const discount = normalTotal - setPrice;
    const discountRate = normalTotal > 0 ? Math.round((discount / normalTotal) * 100) : 0;
    const margin = setPrice - costTotal;
    const marginRate = setPrice > 0 ? Math.round((margin / setPrice) * 100) : 0;
    return { normalTotal, costTotal, discount, discountRate, margin, marginRate };
  }, [components, setPrice]);

  function addComponent() {
    setComponents((prev) => [...prev, {
      id: Math.max(0, ...prev.map((c) => c.id)) + 1,
      sku: "", name: "", variation: "", quantity: 1, unitPrice: 0, cost: 0, required: true,
    }]);
  }

  function updateComponent<K extends keyof Component>(id: number, key: K, value: Component[K]) {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: value } : c)));
  }

  function removeComponent(id: number) {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "セット商品編集" : "セット商品登録"}</h1>
        <div className="flex gap-2">
          {isEdit && <button className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">削除</button>}
          <button className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "保存"}</button>
        </div>
      </div>
      {isEdit && <div className="text-xs text-gray-500">ダッシュボード &gt; 商品一覧 &gt; セット商品 &gt; <span className="text-blue-600">スターターパック</span> &gt; 編集</div>}

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Package className="h-4 w-4 text-gray-400" />基本情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="セット商品コード" required placeholder="SET-001" />
          <Field label="JANコード" placeholder="4580123456789" />
          <Field label="セット商品名" required placeholder="スターターパック" className="col-span-2" />
          <Field label="セット商品名カナ" placeholder="スターターパック" className="col-span-2" />
          <Field label="英文商品名" placeholder="Starter Pack" className="col-span-2" />
          <Select label="カテゴリ" required options={["セット・福袋", "ギフトセット", "お試しセット", "定期便"]} />
          <Field label="ブランド" placeholder="SAMPLE BRAND" />
          <Select label="ステータス" required options={["販売中", "停止中", "予約販売", "廃番"]} />
          <Select label="販売チャネル" options={["全チャネル", "EC のみ", "卸のみ", "モール限定"]} />
          <div className="col-span-4 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">セット内容の説明</label>
            <textarea rows={3} placeholder="セット内容の魅力や特徴を説明..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2"><Boxes className="h-4 w-4 text-gray-400" />構成商品</h2>
          <button onClick={addComponent} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"><Plus className="h-4 w-4" />商品を追加</button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品コード</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品名</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">バリエーション</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">数量</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">単価</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">原価</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">小計</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">必須</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {components.map((c) => (
                <tr key={c.id} className="border-t border-white/30">
                  <td className="px-3 py-2">
                    <input value={c.sku} onChange={(e) => updateComponent(c.id, "sku", e.target.value)} className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50" placeholder="WEP-001" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={c.name} onChange={(e) => updateComponent(c.id, "name", e.target.value)} className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50" placeholder="商品名" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={c.variation} onChange={(e) => updateComponent(c.id, "variation", e.target.value)} className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50" placeholder="ブラック" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={1} value={c.quantity} onChange={(e) => updateComponent(c.id, "quantity", Number(e.target.value))} className="h-7 w-16 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-center" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={c.unitPrice} onChange={(e) => updateComponent(c.id, "unitPrice", Number(e.target.value))} className="h-7 w-24 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={c.cost} onChange={(e) => updateComponent(c.id, "cost", Number(e.target.value))} className="h-7 w-24 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right" />
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700 text-xs font-medium">¥{(c.unitPrice * c.quantity).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={c.required} onChange={(e) => updateComponent(c.id, "required", e.target.checked)} className="rounded" />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeComponent(c.id)} aria-label="削除" className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
              {components.length === 0 && (
                <tr><td colSpan={9} className="py-6 text-center text-xs text-gray-500">構成商品を追加してください</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><DollarSign className="h-4 w-4 text-gray-400" />価格設定</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">セット販売価格 <span className="text-red-500 text-xs">*必須</span></label>
            <input type="number" value={setPrice} onChange={(e) => setSetPrice(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <Field label="会員価格" type="number" placeholder="12800" />
          <Field label="卸価格" type="number" placeholder="9800" />
          <Select label="税率" options={["10%（標準）", "8%（軽減）", "0%（非課税）"]} />
          <Field label="ポイント倍率" type="number" defaultValue="1" />
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">販売開始日</label><DatePicker placeholder="開始日" /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">販売終了日</label><DatePicker placeholder="終了日" /></div>
          <Field label="販売数量上限" type="number" placeholder="制限なし" />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/60">
          <div className="p-3 rounded-xl bg-white/60 border border-white/60">
            <div className="text-xs text-gray-500">構成品 通常合計</div>
            <div className="text-lg font-bold text-gray-800 mt-0.5">¥{totals.normalTotal.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-400/40">
            <div className="text-xs text-blue-700">セット割引</div>
            <div className="text-lg font-bold text-blue-700 mt-0.5">
              ¥{totals.discount.toLocaleString()}
              <span className="text-xs ml-1">（{totals.discountRate}%オフ）</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/40">
            <div className="text-xs text-emerald-700">粗利</div>
            <div className="text-lg font-bold text-emerald-700 mt-0.5">
              ¥{totals.margin.toLocaleString()}
              <span className="text-xs ml-1">（粗利率 {totals.marginRate}%）</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">在庫管理</h2>
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="在庫管理方式"
            options={["構成品在庫に連動", "セット独立管理", "ハイブリッド（自動切替）"]}
            value={stockMode}
            onChange={setStockMode}
          />
          {stockMode !== "構成品在庫に連動" && (
            <>
              <Field label="セット独立在庫数" type="number" placeholder="100" />
              <Field label="安全在庫数" type="number" placeholder="10" />
            </>
          )}
          <Select label="構成品欠品時の動作" options={["販売停止", "欠品表示のまま販売", "代替品を自動提案"]} />
          <Select label="引当順序" options={["セット優先", "単品優先"]} />
          <Field label="リードタイム(日)" type="number" placeholder="3" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Globe className="h-4 w-4 text-gray-400" />モール掲載設定</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Toggle label="楽天市場に掲載" defaultChecked />
          <Toggle label="Amazonに掲載" />
          <Toggle label="Yahoo!ショッピングに掲載" />
          <Toggle label="Shopifyに掲載" defaultChecked />
          <Toggle label="自社ECに掲載" defaultChecked />
          <Toggle label="卸売販売" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="楽天商品コード" placeholder="set-001-r" />
          <Field label="Amazon ASIN" placeholder="B0SET001" />
          <Field label="Yahoo!商品コード" placeholder="set001y" />
          <Field label="Shopify SKU" placeholder="set-001" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><ImageIcon className="h-4 w-4 text-gray-400" />セット商品画像</h2>
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300/50 bg-white/30 hover:bg-white/50 transition-colors cursor-pointer">
              <Upload className="h-5 w-5 text-gray-400" />
              <p className="text-[10px] text-gray-400 mt-1">{i === 1 ? "メイン" : `サブ${i - 1}`}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">販売オプション</h2>
        <div className="grid grid-cols-3 gap-2">
          <Toggle label="ギフトラッピング対応" defaultChecked />
          <Toggle label="のし対応" />
          <Toggle label="メッセージカード対応" defaultChecked />
          <Toggle label="領収書発行" defaultChecked />
          <Toggle label="まとめ買い割引対象" />
          <Toggle label="クーポン適用可" defaultChecked />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" />備考・社内メモ</h2>
        <textarea rows={3} placeholder="セット組成の意図、仕入れ先、販促メモなど..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
      </GlassCard>

      <div className="flex justify-end gap-2 pt-2">
        {isEdit && <button className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">削除</button>}
        <button className="px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">{isEdit ? "更新" : "保存"}</button>
      </div>
    </div>
  );
}
