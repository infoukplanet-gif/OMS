"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { Upload, Plus, Trash2, Package, Tag, DollarSign, Box, Truck, Image as ImageIcon, Globe, FileText } from "lucide-react";

const Field = ({ label, required, placeholder, className, type = "text", defaultValue }: { label: string; required?: boolean; placeholder?: string; className?: string; type?: string; defaultValue?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500 text-xs">*必須</span>}
    </label>
    <input type={type} placeholder={placeholder} defaultValue={defaultValue} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
  </div>
);

const Select = ({ label, required, options, className }: { label: string; required?: boolean; options: string[]; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500 text-xs">*必須</span>}
    </label>
    <select className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20">
      {options.map(o => <option key={o}>{o}</option>)}
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

interface ProductFormProps {
  mode: "create" | "edit";
}

export function ProductForm({ mode }: ProductFormProps) {
  const isEdit = mode === "edit";
  const [skus, setSkus] = useState([1, 2]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "商品編集" : "商品登録"}</h1>
        <div className="flex gap-2">
          {isEdit && <button className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25 transition-all">削除</button>}
          <button className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all">キャンセル</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">{isEdit ? "更新" : "保存"}</button>
        </div>
      </div>
      {isEdit && <div className="text-xs text-gray-500">ダッシュボード &gt; 商品一覧 &gt; <span className="text-blue-600">ワイヤレスイヤホン Pro</span> &gt; 編集</div>}

      {/* 基本情報 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Package className="h-4 w-4 text-gray-400" />基本情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="商品コード" required placeholder="WEP-001" />
          <Field label="JANコード" placeholder="4901234567890" />
          <Field label="商品名" required placeholder="ワイヤレスイヤホン Pro" className="col-span-2" />
          <Field label="商品名カナ" placeholder="ワイヤレスイヤホン プロ" className="col-span-2" />
          <Field label="英文商品名" placeholder="Wireless Earphones Pro" className="col-span-2" />
          <div className="col-span-4 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">簡易説明（一覧表示用）</label>
            <input type="text" placeholder="ノイズキャンセリング搭載のプレミアムワイヤレスイヤホン" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="col-span-4 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">詳細説明（商品ページ用）</label>
            <textarea rows={4} placeholder="商品の詳細な説明文..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>
        </div>
      </GlassCard>

      {/* カテゴリ・分類 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Tag className="h-4 w-4 text-gray-400" />カテゴリ・分類</h2>
        <div className="grid grid-cols-4 gap-4">
          <Select label="カテゴリ" required options={["オーディオ", "充電器", "ケーブル", "アクセサリー", "スマホ周辺"]} />
          <Select label="サブカテゴリ" options={["イヤホン", "ヘッドホン", "スピーカー"]} />
          <Field label="ブランド" placeholder="SAMPLE BRAND" />
          <Field label="メーカー" placeholder="株式会社サンプル" />
          <Field label="原産国" placeholder="日本/中国/韓国" />
          <Field label="型番" placeholder="SP-WEP-001" />
          <Field label="シリーズ" placeholder="Proシリーズ" />
          <Select label="ステータス" required options={["販売中", "停止中", "廃番", "予約販売"]} />
          <Field label="検索キーワード" placeholder="ワイヤレス,イヤホン,Bluetooth,ノイキャン" className="col-span-4" />
        </div>
      </GlassCard>

      {/* SKUバリエーション */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">SKU / バリエーション</h2>
          <button onClick={() => setSkus([...skus, skus.length + 1])} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"><Plus className="h-4 w-4" />SKUを追加</button>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead><tr className="bg-white/50">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SKUコード</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">バリエーション名</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">JAN</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">販売価格</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">原価</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">卸価格</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">在庫</th>
              <th className="w-10" />
            </tr></thead>
            <tbody>{skus.map(i => (
              <tr key={i} className="border-t border-white/30">
                <td className="px-3 py-2"><input className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50" placeholder={`WEP-001-${i}`} /></td>
                <td className="px-3 py-2"><input className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50" placeholder="ブラック" /></td>
                <td className="px-3 py-2"><input className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50" placeholder="49000000" /></td>
                <td className="px-3 py-2"><input className="h-7 w-20 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right" placeholder="12,800" /></td>
                <td className="px-3 py-2"><input className="h-7 w-20 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right" placeholder="4,500" /></td>
                <td className="px-3 py-2"><input className="h-7 w-20 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right" placeholder="8,000" /></td>
                <td className="px-3 py-2"><input className="h-7 w-16 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-center" placeholder="100" /></td>
                <td className="px-3 py-2"><button onClick={() => setSkus(skus.filter(n => n !== i))} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </GlassCard>

      {/* 価格設定 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><DollarSign className="h-4 w-4 text-gray-400" />価格設定</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="標準販売価格" required type="number" placeholder="12800" />
          <Field label="原価" type="number" placeholder="4500" />
          <Field label="希望小売価格" type="number" placeholder="14800" />
          <Field label="参考価格" type="number" placeholder="13800" />
          <Field label="卸価格 A" type="number" placeholder="8000" />
          <Field label="卸価格 S" type="number" placeholder="7500" />
          <Field label="卸価格 B" type="number" placeholder="9000" />
          <Field label="卸価格 C" type="number" placeholder="10000" />
          <Field label="セール価格" type="number" placeholder="9800" />
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">セール開始日</label><DatePicker placeholder="開始日" /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">セール終了日</label><DatePicker placeholder="終了日" /></div>
          <Field label="ポイント倍率" type="number" placeholder="1" defaultValue="1" />
          <Select label="税率" options={["10%（標準）", "8%（軽減）", "0%（非課税）"]} />
          <Select label="価格表示" options={["税込", "税抜"]} />
          <Field label="ポイント付与率(%)" type="number" placeholder="1" />
          <Field label="送料設定" placeholder="個別送料" />
        </div>
      </GlassCard>

      {/* 物理情報 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Box className="h-4 w-4 text-gray-400" />物理情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="重量(g)" type="number" placeholder="150" />
          <Field label="幅(mm)" type="number" placeholder="80" />
          <Field label="奥行(mm)" type="number" placeholder="60" />
          <Field label="高さ(mm)" type="number" placeholder="30" />
          <Field label="梱包重量(g)" type="number" placeholder="200" />
          <Field label="梱包サイズ" placeholder="100×80×50" />
          <Field label="容量" placeholder="500ml" />
          <Field label="材質" placeholder="ABS樹脂" />
          <Select label="配送カテゴリ" options={["小型", "中型", "大型", "メール便", "宅急便コンパクト"]} />
          <Select label="同梱可否" options={["可", "不可（単独配送）"]} />
          <Select label="温度管理" options={["常温", "冷蔵", "冷凍"]} />
          <Field label="梱包数量" type="number" placeholder="1" />
        </div>
      </GlassCard>

      {/* 在庫管理 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">在庫管理</h2>
        <div className="grid grid-cols-4 gap-4">
          <Select label="在庫管理方法" options={["管理する", "管理しない", "予約販売"]} />
          <Field label="安全在庫数" type="number" placeholder="10" />
          <Field label="発注点" type="number" placeholder="20" />
          <Field label="入数" type="number" placeholder="1" />
          <Field label="ロット数" type="number" placeholder="10" />
          <Select label="賞味期限管理" options={["なし", "あり"]} />
          <Field label="期限日数" type="number" placeholder="365" />
          <Field label="リードタイム(日)" type="number" placeholder="7" />
          <Select label="優先引当拠点" options={["東京本社倉庫", "大阪倉庫", "福岡倉庫"]} />
        </div>
      </GlassCard>

      {/* 販売設定 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">販売設定</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">販売開始日</label><DatePicker placeholder="開始日" /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">販売終了日</label><DatePicker placeholder="終了日" /></div>
          <Field label="最小購入数" type="number" defaultValue="1" />
          <Field label="最大購入数" type="number" placeholder="制限なし" />
          <Field label="購入回数制限" type="number" placeholder="制限なし" />
          <Field label="会員ランク制限" placeholder="シルバー以上" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Toggle label="単品販売可" defaultChecked />
          <Toggle label="セット販売可" />
          <Toggle label="定期購入対応" />
          <Toggle label="ギフト対応" defaultChecked />
          <Toggle label="のし対応" />
          <Toggle label="領収書発行" defaultChecked />
        </div>
      </GlassCard>

      {/* モール掲載設定 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Globe className="h-4 w-4 text-gray-400" />モール掲載設定</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Toggle label="楽天市場に掲載" defaultChecked />
          <Toggle label="Amazonに掲載" defaultChecked />
          <Toggle label="Yahoo!ショッピングに掲載" />
          <Toggle label="Shopifyに掲載" defaultChecked />
          <Toggle label="自社ECに掲載" defaultChecked />
          <Toggle label="卸売販売" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="楽天商品コード" placeholder="wep-001-r" />
          <Field label="Amazon ASIN" placeholder="B0WEP001" />
          <Field label="Yahoo!商品コード" placeholder="wep001y" />
          <Field label="Shopify SKU" placeholder="wep-001" />
        </div>
      </GlassCard>

      {/* 画像 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><ImageIcon className="h-4 w-4 text-gray-400" />画像</h2>
        <div className="grid grid-cols-5 gap-3">
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
            <div key={i} className={cn("aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300/50 bg-white/30 hover:bg-white/50 transition-colors cursor-pointer")}>
              <Upload className="h-5 w-5 text-gray-400" />
              <p className="text-[10px] text-gray-400 mt-1">{i === 1 ? "メイン" : `サブ${i-1}`}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* 配送 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Truck className="h-4 w-4 text-gray-400" />配送設定</h2>
        <div className="grid grid-cols-4 gap-4">
          <Select label="個別送料" options={["利用しない", "利用する"]} />
          <Field label="個別送料額" type="number" placeholder="800" />
          <Field label="送料無料条件(円)" type="number" placeholder="10000" />
          <Select label="配送方法限定" options={["制限なし", "宅配便のみ", "メール便のみ"]} />
          <Field label="納期目安" placeholder="3-5営業日" className="col-span-2" />
          <Select label="海外発送" options={["不可", "可"]} />
          <Select label="代引き可否" options={["可", "不可"]} />
        </div>
      </GlassCard>

      {/* カスタム属性・タグ */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">カスタム属性・タグ</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="独自タグ" placeholder="新商品,おすすめ,人気" className="col-span-2" />
          <Field label="関連商品コード" placeholder="WEP-002, CHG-007" className="col-span-2" />
          <Field label="カスタム属性1" placeholder="自由項目" />
          <Field label="カスタム属性2" placeholder="自由項目" />
          <Field label="カスタム属性3" placeholder="自由項目" />
          <Field label="カスタム属性4" placeholder="自由項目" />
        </div>
      </GlassCard>

      {/* 備考 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" />備考・社内メモ</h2>
        <textarea rows={4} placeholder="商品の特記事項、注意事項、社内向けメモなど..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
      </GlassCard>

      <div className="flex justify-end gap-2 pt-2">
        {isEdit && <button className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25 transition-all">削除</button>}
        <button className="px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all">キャンセル</button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">{isEdit ? "更新" : "保存"}</button>
      </div>
    </div>
  );
}
