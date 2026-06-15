"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { productStore, type ProductRecord } from "@/lib/stores/product";
import { Upload, Plus, Trash2, Package, Tag, DollarSign, Box, Truck, Image as ImageIcon, Globe, FileText } from "lucide-react";

const Field = ({ label, required, placeholder, className, type = "text", value, onChange }: { label: string; required?: boolean; placeholder?: string; className?: string; type?: string; value: string; onChange: (v: string) => void }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500 text-xs">*必須</span>}
    </label>
    <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
  </div>
);

const Select = ({ label, required, options, className, value, onChange }: { label: string; required?: boolean; options: string[]; className?: string; value: string; onChange: (v: string) => void }) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500 text-xs">*必須</span>}
    </label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between p-2 rounded-lg bg-white/40 hover:bg-white/60 cursor-pointer">
    <span className="text-sm text-gray-700">{label}</span>
    <div className="relative inline-flex items-center">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
    </div>
  </label>
);

/** SKU バリエーション 1 行。 */
interface SkuRow {
  id: number;
  skuCode: string;
  variationName: string;
  jan: string;
  price: string;
  cost: string;
  wholesalePrice: string;
  stock: string;
}

const emptySku = (id: number): SkuRow => ({ id, skuCode: "", variationName: "", jan: "", price: "", cost: "", wholesalePrice: "", stock: "" });

/** ISO 文字列 → Date（DatePicker 初期値用）。空なら undefined。 */
const toDate = (s: string): Date | undefined => (s ? new Date(s) : undefined);

interface ProductFormProps {
  mode: "create" | "edit";
  /** edit モード時: URL の [id] セグメント（商品コードに対応）。 */
  productCode?: string;
}

export function ProductForm({ mode, productCode }: ProductFormProps) {
  const isEdit = mode === "edit";
  const toast = useToast();
  const router = useRouter();

  // edit モードで既存商品データを store から初期値としてロードする。
  // store への初回アクセスは render 時（SSR ではなく CSR 専用コンポーネント）に行う。
  const existing = isEdit && productCode
    ? productStore.findByCode(productCode)
    : undefined;

  // 既存レコードの extra フィールド（unknown）を文字列/真偽値として安全に取り出すヘルパ。
  const ex = (key: string, fallback = ""): string =>
    existing && typeof existing[key] === "string" ? (existing[key] as string) : fallback;
  const exBool = (key: string, fallback = false): boolean =>
    existing && typeof existing[key] === "boolean" ? (existing[key] as boolean) : fallback;

  // 必須項目（コード/商品名/カテゴリ/単価/原価/状態）。
  const [code, setCode] = useState(existing?.code ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState<string>(existing?.category ?? "オーディオ");
  const [price, setPrice] = useState<string>(existing?.price != null ? String(existing.price) : "");
  const [cost, setCost] = useState<string>(existing?.cost != null ? String(existing.cost) : "");
  const [status, setStatus] = useState<ProductRecord["status"]>(existing?.status ?? "販売中");

  // 装飾項目（テキスト/セレクト/日付）。すべて controlled にして保存時に productStore へ流す。
  const [extra, setExtraState] = useState<Record<string, string>>(() => ({
    janCode: ex("janCode"),
    nameKana: ex("nameKana"),
    nameEn: ex("nameEn"),
    shortDesc: ex("shortDesc"),
    longDesc: ex("longDesc"),
    subCategory: ex("subCategory", "イヤホン"),
    brand: ex("brand"),
    maker: ex("maker"),
    origin: ex("origin"),
    modelNumber: ex("modelNumber"),
    series: ex("series"),
    searchKeywords: ex("searchKeywords"),
    retailPrice: ex("retailPrice"),
    referencePrice: ex("referencePrice"),
    wholesaleA: ex("wholesaleA"),
    wholesaleS: ex("wholesaleS"),
    wholesaleB: ex("wholesaleB"),
    wholesaleC: ex("wholesaleC"),
    salePrice: ex("salePrice"),
    saleStart: ex("saleStart"),
    saleEnd: ex("saleEnd"),
    pointRate: ex("pointRate", "1"),
    taxRate: ex("taxRate", "10%（標準）"),
    priceDisplay: ex("priceDisplay", "税込"),
    pointGrantRate: ex("pointGrantRate"),
    shippingSetting: ex("shippingSetting"),
    weight: ex("weight"),
    width: ex("width"),
    depth: ex("depth"),
    height: ex("height"),
    packWeight: ex("packWeight"),
    packSize: ex("packSize"),
    capacity: ex("capacity"),
    material: ex("material"),
    deliveryCategory: ex("deliveryCategory", "小型"),
    combinable: ex("combinable", "可"),
    tempControl: ex("tempControl", "常温"),
    packQuantity: ex("packQuantity"),
    stockMethod: ex("stockMethod", "管理する"),
    safetyStock: ex("safetyStock"),
    reorderPoint: ex("reorderPoint"),
    perUnit: ex("perUnit"),
    lotSize: ex("lotSize"),
    expiryManagement: ex("expiryManagement", "なし"),
    expiryDays: ex("expiryDays"),
    leadTime: ex("leadTime"),
    priorityWarehouse: ex("priorityWarehouse", "東京本社倉庫"),
    salesStartDate: ex("salesStartDate"),
    salesEndDate: ex("salesEndDate"),
    minPurchase: ex("minPurchase", "1"),
    maxPurchase: ex("maxPurchase"),
    purchaseLimit: ex("purchaseLimit"),
    memberRankLimit: ex("memberRankLimit"),
    rakutenCode: ex("rakutenCode"),
    amazonAsin: ex("amazonAsin"),
    yahooCode: ex("yahooCode"),
    shopifySku: ex("shopifySku"),
    individualShipping: ex("individualShipping", "利用しない"),
    individualShippingFee: ex("individualShippingFee"),
    freeShippingThreshold: ex("freeShippingThreshold"),
    deliveryMethodLimit: ex("deliveryMethodLimit", "制限なし"),
    deliveryEstimate: ex("deliveryEstimate"),
    overseasShipping: ex("overseasShipping", "不可"),
    codAvailable: ex("codAvailable", "可"),
    customTags: ex("customTags"),
    relatedProducts: ex("relatedProducts"),
    customAttr1: ex("customAttr1"),
    customAttr2: ex("customAttr2"),
    customAttr3: ex("customAttr3"),
    customAttr4: ex("customAttr4"),
    notes: ex("notes"),
  }));
  const setExtra = (key: string, value: string) => setExtraState((p) => ({ ...p, [key]: value }));

  // 真偽値項目（販売設定トグル・モール掲載）。
  const [toggles, setTogglesState] = useState<Record<string, boolean>>(() => ({
    singleSale: exBool("singleSale", true),
    setSale: exBool("setSale", false),
    subscription: exBool("subscription", false),
    gift: exBool("gift", true),
    noshi: exBool("noshi", false),
    receipt: exBool("receipt", true),
    mallRakuten: exBool("mallRakuten", true),
    mallAmazon: exBool("mallAmazon", true),
    mallYahoo: exBool("mallYahoo", false),
    mallShopify: exBool("mallShopify", true),
    mallOwnEc: exBool("mallOwnEc", true),
    mallWholesale: exBool("mallWholesale", false),
  }));
  const setToggle = (key: string, value: boolean) => setTogglesState((p) => ({ ...p, [key]: value }));

  // SKU バリエーション行。
  const [skuRows, setSkuRows] = useState<SkuRow[]>(() => {
    if (existing && Array.isArray(existing.skuRows) && existing.skuRows.length > 0) {
      return existing.skuRows as SkuRow[];
    }
    return [emptySku(1), emptySku(2)];
  });
  const addSku = () => setSkuRows((rows) => [...rows, emptySku((rows.at(-1)?.id ?? 0) + 1)]);
  const removeSku = (id: number) => setSkuRows((rows) => rows.filter((r) => r.id !== id));
  const updateSku = (id: number, key: keyof SkuRow, value: string) =>
    setSkuRows((rows) => rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const handleSave = () => {
    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    if (!trimmedCode) {
      toast.show("商品コードを入力してください", "error");
      return;
    }
    if (!trimmedName) {
      toast.show("商品名を入力してください", "error");
      return;
    }
    const record: ProductRecord = {
      ...(existing ?? {}),
      ...extra,
      ...toggles,
      skuRows,
      code: trimmedCode,
      name: trimmedName,
      category,
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      status,
    };
    const r = productStore.upsert(record);
    toast.show(
      `${trimmedName}（${trimmedCode}）を${r.created ? "登録" : "更新"}しました`,
      "success",
    );
    router.push("/products");
  };

  const handleDelete = () => {
    const targetCode = existing?.code ?? productCode ?? code.trim();
    if (!targetCode) {
      toast.show("削除対象の商品コードが特定できません", "error");
      return;
    }
    const targetName = existing?.name ?? (name.trim() || targetCode);
    if (!window.confirm(`${targetName}（${targetCode}）を商品マスタから削除します。よろしいですか？`)) return;
    if (!productStore.remove(targetCode)) {
      toast.show(`商品コード ${targetCode} はマスタに見つかりませんでした`, "error");
      return;
    }
    toast.show(`${targetName}（${targetCode}）を削除しました`, "success");
    router.push("/products");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "商品編集" : "商品登録"}</h1>
        <div className="flex gap-2">
          {isEdit && <button onClick={handleDelete} className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25 transition-all">削除</button>}
          <button
            onClick={() => router.push("/products")}
            className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
          >
            {isEdit ? "更新" : "保存"}
          </button>
        </div>
      </div>
      {isEdit && (
        <div className="text-xs text-gray-500">
          ダッシュボード &gt; 商品一覧 &gt;{" "}
          <span className="text-blue-600">{existing?.name ?? productCode ?? "商品"}</span> &gt; 編集
        </div>
      )}

      {/* 基本情報 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Package className="h-4 w-4 text-gray-400" />基本情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">商品コード <span className="text-red-500 text-xs">*必須</span></label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="WEP-001"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <Field label="JANコード" placeholder="4901234567890" value={extra.janCode} onChange={(v) => setExtra("janCode", v)} />
          <div className="space-y-1.5 col-span-2">
            <label className="text-sm font-medium text-gray-700">商品名 <span className="text-red-500 text-xs">*必須</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ワイヤレスイヤホン Pro"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <Field label="商品名カナ" placeholder="ワイヤレスイヤホン プロ" className="col-span-2" value={extra.nameKana} onChange={(v) => setExtra("nameKana", v)} />
          <Field label="英文商品名" placeholder="Wireless Earphones Pro" className="col-span-2" value={extra.nameEn} onChange={(v) => setExtra("nameEn", v)} />
          <div className="col-span-4 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">簡易説明（一覧表示用）</label>
            <input type="text" placeholder="ノイズキャンセリング搭載のプレミアムワイヤレスイヤホン" value={extra.shortDesc} onChange={(e) => setExtra("shortDesc", e.target.value)} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="col-span-4 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">詳細説明（商品ページ用）</label>
            <textarea rows={4} placeholder="商品の詳細な説明文..." value={extra.longDesc} onChange={(e) => setExtra("longDesc", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>
        </div>
      </GlassCard>

      {/* カテゴリ・分類 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Tag className="h-4 w-4 text-gray-400" />カテゴリ・分類</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">カテゴリ <span className="text-red-500 text-xs">*必須</span></label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["オーディオ", "充電器", "ケーブル", "アクセサリー", "スマホ周辺", "家電", "雑貨", "アパレル"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <Select label="サブカテゴリ" options={["イヤホン", "ヘッドホン", "スピーカー"]} value={extra.subCategory} onChange={(v) => setExtra("subCategory", v)} />
          <Field label="ブランド" placeholder="SAMPLE BRAND" value={extra.brand} onChange={(v) => setExtra("brand", v)} />
          <Field label="メーカー" placeholder="株式会社サンプル" value={extra.maker} onChange={(v) => setExtra("maker", v)} />
          <Field label="原産国" placeholder="日本/中国/韓国" value={extra.origin} onChange={(v) => setExtra("origin", v)} />
          <Field label="型番" placeholder="SP-WEP-001" value={extra.modelNumber} onChange={(v) => setExtra("modelNumber", v)} />
          <Field label="シリーズ" placeholder="Proシリーズ" value={extra.series} onChange={(v) => setExtra("series", v)} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">ステータス <span className="text-red-500 text-xs">*必須</span></label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductRecord["status"])}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {(["販売中", "停止中", "廃番"] as const).map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <Field label="検索キーワード" placeholder="ワイヤレス,イヤホン,Bluetooth,ノイキャン" className="col-span-4" value={extra.searchKeywords} onChange={(v) => setExtra("searchKeywords", v)} />
        </div>
      </GlassCard>

      {/* SKUバリエーション */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">SKU / バリエーション</h2>
          <button onClick={addSku} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"><Plus className="h-4 w-4" />SKUを追加</button>
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
            <tbody>{skuRows.map((row) => (
              <tr key={row.id} className="border-t border-white/30">
                <td className="px-3 py-2"><input value={row.skuCode} onChange={(e) => updateSku(row.id, "skuCode", e.target.value)} className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50" placeholder={`WEP-001-${row.id}`} /></td>
                <td className="px-3 py-2"><input value={row.variationName} onChange={(e) => updateSku(row.id, "variationName", e.target.value)} className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50" placeholder="ブラック" /></td>
                <td className="px-3 py-2"><input value={row.jan} onChange={(e) => updateSku(row.id, "jan", e.target.value)} className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50" placeholder="49000000" /></td>
                <td className="px-3 py-2"><input value={row.price} onChange={(e) => updateSku(row.id, "price", e.target.value)} className="h-7 w-20 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right" placeholder="12,800" /></td>
                <td className="px-3 py-2"><input value={row.cost} onChange={(e) => updateSku(row.id, "cost", e.target.value)} className="h-7 w-20 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right" placeholder="4,500" /></td>
                <td className="px-3 py-2"><input value={row.wholesalePrice} onChange={(e) => updateSku(row.id, "wholesalePrice", e.target.value)} className="h-7 w-20 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right" placeholder="8,000" /></td>
                <td className="px-3 py-2"><input value={row.stock} onChange={(e) => updateSku(row.id, "stock", e.target.value)} className="h-7 w-16 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-center" placeholder="100" /></td>
                <td className="px-3 py-2"><button onClick={() => removeSku(row.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </GlassCard>

      {/* 価格設定 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><DollarSign className="h-4 w-4 text-gray-400" />価格設定</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">標準販売価格 <span className="text-red-500 text-xs">*必須</span></label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="12800"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">原価</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="4500"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <Field label="希望小売価格" type="number" placeholder="14800" value={extra.retailPrice} onChange={(v) => setExtra("retailPrice", v)} />
          <Field label="参考価格" type="number" placeholder="13800" value={extra.referencePrice} onChange={(v) => setExtra("referencePrice", v)} />
          <Field label="卸価格 A" type="number" placeholder="8000" value={extra.wholesaleA} onChange={(v) => setExtra("wholesaleA", v)} />
          <Field label="卸価格 S" type="number" placeholder="7500" value={extra.wholesaleS} onChange={(v) => setExtra("wholesaleS", v)} />
          <Field label="卸価格 B" type="number" placeholder="9000" value={extra.wholesaleB} onChange={(v) => setExtra("wholesaleB", v)} />
          <Field label="卸価格 C" type="number" placeholder="10000" value={extra.wholesaleC} onChange={(v) => setExtra("wholesaleC", v)} />
          <Field label="セール価格" type="number" placeholder="9800" value={extra.salePrice} onChange={(v) => setExtra("salePrice", v)} />
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">セール開始日</label><DatePicker placeholder="開始日" value={toDate(extra.saleStart)} onChange={(d) => setExtra("saleStart", d ? d.toISOString() : "")} /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">セール終了日</label><DatePicker placeholder="終了日" value={toDate(extra.saleEnd)} onChange={(d) => setExtra("saleEnd", d ? d.toISOString() : "")} /></div>
          <Field label="ポイント倍率" type="number" placeholder="1" value={extra.pointRate} onChange={(v) => setExtra("pointRate", v)} />
          <Select label="税率" options={["10%（標準）", "8%（軽減）", "0%（非課税）"]} value={extra.taxRate} onChange={(v) => setExtra("taxRate", v)} />
          <Select label="価格表示" options={["税込", "税抜"]} value={extra.priceDisplay} onChange={(v) => setExtra("priceDisplay", v)} />
          <Field label="ポイント付与率(%)" type="number" placeholder="1" value={extra.pointGrantRate} onChange={(v) => setExtra("pointGrantRate", v)} />
          <Field label="送料設定" placeholder="個別送料" value={extra.shippingSetting} onChange={(v) => setExtra("shippingSetting", v)} />
        </div>
      </GlassCard>

      {/* 物理情報 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Box className="h-4 w-4 text-gray-400" />物理情報</h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="重量(g)" type="number" placeholder="150" value={extra.weight} onChange={(v) => setExtra("weight", v)} />
          <Field label="幅(mm)" type="number" placeholder="80" value={extra.width} onChange={(v) => setExtra("width", v)} />
          <Field label="奥行(mm)" type="number" placeholder="60" value={extra.depth} onChange={(v) => setExtra("depth", v)} />
          <Field label="高さ(mm)" type="number" placeholder="30" value={extra.height} onChange={(v) => setExtra("height", v)} />
          <Field label="梱包重量(g)" type="number" placeholder="200" value={extra.packWeight} onChange={(v) => setExtra("packWeight", v)} />
          <Field label="梱包サイズ" placeholder="100×80×50" value={extra.packSize} onChange={(v) => setExtra("packSize", v)} />
          <Field label="容量" placeholder="500ml" value={extra.capacity} onChange={(v) => setExtra("capacity", v)} />
          <Field label="材質" placeholder="ABS樹脂" value={extra.material} onChange={(v) => setExtra("material", v)} />
          <Select label="配送カテゴリ" options={["小型", "中型", "大型", "メール便", "宅急便コンパクト"]} value={extra.deliveryCategory} onChange={(v) => setExtra("deliveryCategory", v)} />
          <Select label="同梱可否" options={["可", "不可（単独配送）"]} value={extra.combinable} onChange={(v) => setExtra("combinable", v)} />
          <Select label="温度管理" options={["常温", "冷蔵", "冷凍"]} value={extra.tempControl} onChange={(v) => setExtra("tempControl", v)} />
          <Field label="梱包数量" type="number" placeholder="1" value={extra.packQuantity} onChange={(v) => setExtra("packQuantity", v)} />
        </div>
      </GlassCard>

      {/* 在庫管理 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">在庫管理</h2>
        <div className="grid grid-cols-4 gap-4">
          <Select label="在庫管理方法" options={["管理する", "管理しない", "予約販売"]} value={extra.stockMethod} onChange={(v) => setExtra("stockMethod", v)} />
          <Field label="安全在庫数" type="number" placeholder="10" value={extra.safetyStock} onChange={(v) => setExtra("safetyStock", v)} />
          <Field label="発注点" type="number" placeholder="20" value={extra.reorderPoint} onChange={(v) => setExtra("reorderPoint", v)} />
          <Field label="入数" type="number" placeholder="1" value={extra.perUnit} onChange={(v) => setExtra("perUnit", v)} />
          <Field label="ロット数" type="number" placeholder="10" value={extra.lotSize} onChange={(v) => setExtra("lotSize", v)} />
          <Select label="賞味期限管理" options={["なし", "あり"]} value={extra.expiryManagement} onChange={(v) => setExtra("expiryManagement", v)} />
          <Field label="期限日数" type="number" placeholder="365" value={extra.expiryDays} onChange={(v) => setExtra("expiryDays", v)} />
          <Field label="リードタイム(日)" type="number" placeholder="7" value={extra.leadTime} onChange={(v) => setExtra("leadTime", v)} />
          <Select label="優先引当拠点" options={["東京本社倉庫", "大阪倉庫", "福岡倉庫"]} value={extra.priorityWarehouse} onChange={(v) => setExtra("priorityWarehouse", v)} />
        </div>
      </GlassCard>

      {/* 販売設定 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">販売設定</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">販売開始日</label><DatePicker placeholder="開始日" value={toDate(extra.salesStartDate)} onChange={(d) => setExtra("salesStartDate", d ? d.toISOString() : "")} /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">販売終了日</label><DatePicker placeholder="終了日" value={toDate(extra.salesEndDate)} onChange={(d) => setExtra("salesEndDate", d ? d.toISOString() : "")} /></div>
          <Field label="最小購入数" type="number" value={extra.minPurchase} onChange={(v) => setExtra("minPurchase", v)} />
          <Field label="最大購入数" type="number" placeholder="制限なし" value={extra.maxPurchase} onChange={(v) => setExtra("maxPurchase", v)} />
          <Field label="購入回数制限" type="number" placeholder="制限なし" value={extra.purchaseLimit} onChange={(v) => setExtra("purchaseLimit", v)} />
          <Field label="会員ランク制限" placeholder="シルバー以上" value={extra.memberRankLimit} onChange={(v) => setExtra("memberRankLimit", v)} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Toggle label="単品販売可" checked={toggles.singleSale} onChange={(v) => setToggle("singleSale", v)} />
          <Toggle label="セット販売可" checked={toggles.setSale} onChange={(v) => setToggle("setSale", v)} />
          <Toggle label="定期購入対応" checked={toggles.subscription} onChange={(v) => setToggle("subscription", v)} />
          <Toggle label="ギフト対応" checked={toggles.gift} onChange={(v) => setToggle("gift", v)} />
          <Toggle label="のし対応" checked={toggles.noshi} onChange={(v) => setToggle("noshi", v)} />
          <Toggle label="領収書発行" checked={toggles.receipt} onChange={(v) => setToggle("receipt", v)} />
        </div>
      </GlassCard>

      {/* モール掲載設定 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Globe className="h-4 w-4 text-gray-400" />モール掲載設定</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Toggle label="楽天市場に掲載" checked={toggles.mallRakuten} onChange={(v) => setToggle("mallRakuten", v)} />
          <Toggle label="Amazonに掲載" checked={toggles.mallAmazon} onChange={(v) => setToggle("mallAmazon", v)} />
          <Toggle label="Yahoo!ショッピングに掲載" checked={toggles.mallYahoo} onChange={(v) => setToggle("mallYahoo", v)} />
          <Toggle label="Shopifyに掲載" checked={toggles.mallShopify} onChange={(v) => setToggle("mallShopify", v)} />
          <Toggle label="自社ECに掲載" checked={toggles.mallOwnEc} onChange={(v) => setToggle("mallOwnEc", v)} />
          <Toggle label="卸売販売" checked={toggles.mallWholesale} onChange={(v) => setToggle("mallWholesale", v)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="楽天商品コード" placeholder="wep-001-r" value={extra.rakutenCode} onChange={(v) => setExtra("rakutenCode", v)} />
          <Field label="Amazon ASIN" placeholder="B0WEP001" value={extra.amazonAsin} onChange={(v) => setExtra("amazonAsin", v)} />
          <Field label="Yahoo!商品コード" placeholder="wep001y" value={extra.yahooCode} onChange={(v) => setExtra("yahooCode", v)} />
          <Field label="Shopify SKU" placeholder="wep-001" value={extra.shopifySku} onChange={(v) => setExtra("shopifySku", v)} />
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
          <Select label="個別送料" options={["利用しない", "利用する"]} value={extra.individualShipping} onChange={(v) => setExtra("individualShipping", v)} />
          <Field label="個別送料額" type="number" placeholder="800" value={extra.individualShippingFee} onChange={(v) => setExtra("individualShippingFee", v)} />
          <Field label="送料無料条件(円)" type="number" placeholder="10000" value={extra.freeShippingThreshold} onChange={(v) => setExtra("freeShippingThreshold", v)} />
          <Select label="配送方法限定" options={["制限なし", "宅配便のみ", "メール便のみ"]} value={extra.deliveryMethodLimit} onChange={(v) => setExtra("deliveryMethodLimit", v)} />
          <Field label="納期目安" placeholder="3-5営業日" className="col-span-2" value={extra.deliveryEstimate} onChange={(v) => setExtra("deliveryEstimate", v)} />
          <Select label="海外発送" options={["不可", "可"]} value={extra.overseasShipping} onChange={(v) => setExtra("overseasShipping", v)} />
          <Select label="代引き可否" options={["可", "不可"]} value={extra.codAvailable} onChange={(v) => setExtra("codAvailable", v)} />
        </div>
      </GlassCard>

      {/* カスタム属性・タグ */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">カスタム属性・タグ</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="独自タグ" placeholder="新商品,おすすめ,人気" className="col-span-2" value={extra.customTags} onChange={(v) => setExtra("customTags", v)} />
          <Field label="関連商品コード" placeholder="WEP-002, CHG-007" className="col-span-2" value={extra.relatedProducts} onChange={(v) => setExtra("relatedProducts", v)} />
          <Field label="カスタム属性1" placeholder="自由項目" value={extra.customAttr1} onChange={(v) => setExtra("customAttr1", v)} />
          <Field label="カスタム属性2" placeholder="自由項目" value={extra.customAttr2} onChange={(v) => setExtra("customAttr2", v)} />
          <Field label="カスタム属性3" placeholder="自由項目" value={extra.customAttr3} onChange={(v) => setExtra("customAttr3", v)} />
          <Field label="カスタム属性4" placeholder="自由項目" value={extra.customAttr4} onChange={(v) => setExtra("customAttr4", v)} />
        </div>
      </GlassCard>

      {/* 備考 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" />備考・社内メモ</h2>
        <textarea rows={4} placeholder="商品の特記事項、注意事項、社内向けメモなど..." value={extra.notes} onChange={(e) => setExtra("notes", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
      </GlassCard>

      <div className="flex justify-end gap-2 pt-2">
        {isEdit && <button onClick={handleDelete} className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25 transition-all">削除</button>}
        <button onClick={() => router.push("/products")} className="px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all">キャンセル</button>
        <button onClick={handleSave} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">{isEdit ? "更新" : "保存"}</button>
      </div>
    </div>
  );
}
