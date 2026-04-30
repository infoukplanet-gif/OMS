"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";

type FieldDef = {
  key: string;
  label: string;
  type: "select" | "text" | "number";
  options?: string[];
  hint?: string;
  defaultValue: string;
};

const orderFields: FieldDef[] = [
  { key: "shop", label: "デフォルト店舗", type: "select", options: ["本店", "楽天店", "Yahoo!店", "Amazon店", "au PAY マーケット店"], defaultValue: "本店", hint: "新規受注作成時に自動選択される店舗" },
  { key: "warehouse", label: "デフォルト出荷倉庫", type: "select", options: ["東京本社倉庫", "大阪倉庫", "福岡倉庫", "RSL（楽天）", "FBA（Amazon）"], defaultValue: "東京本社倉庫", hint: "店舗別で上書きされない場合の引当倉庫" },
  { key: "kbn", label: "デフォルト受注区分", type: "select", options: ["一般", "卸売", "サンプル", "社内"], defaultValue: "一般" },
  { key: "payment", label: "デフォルト支払方法", type: "select", options: ["クレジットカード", "代金引換", "銀行振込（前払い）", "コンビニ後払い", "Amazon Pay", "PayPay"], defaultValue: "クレジットカード" },
  { key: "shipping", label: "デフォルト配送方法", type: "select", options: ["ヤマト運輸", "佐川急便", "ゆうパック", "ゆうパケット", "西濃"], defaultValue: "ヤマト運輸" },
  { key: "shipMethod", label: "デフォルト発送方法", type: "select", options: ["通常", "翌日配達", "メール便", "代引"], defaultValue: "通常" },
  { key: "tax", label: "デフォルト税率", type: "select", options: ["10%", "8%（軽減）", "0%（免税）"], defaultValue: "10%" },
  { key: "shippingFee", label: "デフォルト送料（円）", type: "number", defaultValue: "880", hint: "店舗別の送料設定がない場合の既定" },
];

const productFields: FieldDef[] = [
  { key: "sales", label: "デフォルト販売区分", type: "select", options: ["通常販売", "予約販売", "受注生産", "生産終了"], defaultValue: "通常販売" },
  { key: "taxKbn", label: "デフォルト税区分", type: "select", options: ["内税", "外税", "免税"], defaultValue: "内税" },
  { key: "stockWh", label: "デフォルト引当倉庫", type: "select", options: ["東京本社倉庫", "大阪倉庫", "福岡倉庫"], defaultValue: "東京本社倉庫" },
  { key: "stockManage", label: "在庫管理区分", type: "select", options: ["管理する", "管理しない（無制限販売）"], defaultValue: "管理する" },
  { key: "leadtime", label: "標準リードタイム（営業日）", type: "number", defaultValue: "1" },
  { key: "minStock", label: "デフォルト発注点", type: "number", defaultValue: "10", hint: "在庫がこの数値を下回ると発注アラート" },
  { key: "category", label: "デフォルトカテゴリ", type: "select", options: ["未分類", "アパレル", "雑貨", "食品", "コスメ", "家電"], defaultValue: "未分類" },
];

const customerFields: FieldDef[] = [
  { key: "type", label: "デフォルト顧客区分", type: "select", options: ["一般顧客", "VIP顧客", "卸売", "業者", "従業員"], defaultValue: "一般顧客" },
  { key: "term", label: "デフォルト取引条件", type: "select", options: ["先払い", "後払い", "都度請求"], defaultValue: "先払い" },
  { key: "closing", label: "デフォルト締日", type: "select", options: ["月末", "10日", "15日", "20日", "25日"], defaultValue: "月末" },
  { key: "paymentSite", label: "デフォルト支払サイト", type: "select", options: ["翌月末", "翌々月末", "翌月10日", "翌月20日"], defaultValue: "翌月末" },
  { key: "credit", label: "デフォルト与信限度額（円）", type: "number", defaultValue: "100000" },
  { key: "rank", label: "新規登録時のランク", type: "select", options: ["未設定", "ブロンズ", "シルバー", "ゴールド"], defaultValue: "未設定" },
];

const purchaseFields: FieldDef[] = [
  { key: "supplier", label: "デフォルト仕入先", type: "select", options: ["未設定", "メーカーA", "問屋B", "輸入商社C"], defaultValue: "未設定" },
  { key: "currency", label: "デフォルト通貨", type: "select", options: ["JPY", "USD", "EUR", "CNY"], defaultValue: "JPY" },
  { key: "deliveryTerms", label: "デフォルト納入条件", type: "select", options: ["国内倉庫納入", "FOB", "CIF", "EXW"], defaultValue: "国内倉庫納入" },
  { key: "leadtime", label: "標準納期（日）", type: "number", defaultValue: "14" },
];

export default function DefaultsPage() {
  const toast = useToast();
  const [orderVals, setOrderVals] = useState<Record<string, string>>(Object.fromEntries(orderFields.map((f) => [f.key, f.defaultValue])));
  const [productVals, setProductVals] = useState<Record<string, string>>(Object.fromEntries(productFields.map((f) => [f.key, f.defaultValue])));
  const [customerVals, setCustomerVals] = useState<Record<string, string>>(Object.fromEntries(customerFields.map((f) => [f.key, f.defaultValue])));
  const [purchaseVals, setPurchaseVals] = useState<Record<string, string>>(Object.fromEntries(purchaseFields.map((f) => [f.key, f.defaultValue])));

  const renderField = (
    f: FieldDef,
    values: Record<string, string>,
    setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) => (
    <div key={f.key}>
      <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1">
        {f.label}
        {f.hint && <HelpHint>{f.hint}</HelpHint>}
      </label>
      {f.type === "select" ? (
        <select
          value={values[f.key]}
          onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
        >
          {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={f.type}
          value={values[f.key]}
          onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">既定値（デフォルト）設定</h1>
            <HelpHint>受注・商品・顧客・発注の各フォームでの初期表示値を設定します。新規登録時の入力工数を削減します。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">受注作成・商品登録・顧客登録の入力初期値をここで集中管理。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton
            onClick={() => {
              setOrderVals(Object.fromEntries(orderFields.map((f) => [f.key, f.defaultValue])));
              setProductVals(Object.fromEntries(productFields.map((f) => [f.key, f.defaultValue])));
              setCustomerVals(Object.fromEntries(customerFields.map((f) => [f.key, f.defaultValue])));
              setPurchaseVals(Object.fromEntries(purchaseFields.map((f) => [f.key, f.defaultValue])));
            }}
          >
            初期値に戻す
          </SecondaryButton>
          <PrimaryButton onClick={() => toast.show("既定値設定を保存しました", "success")}>変更を保存</PrimaryButton>
        </div>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">
          受注の既定値 <HelpHint>新規受注を作成する際に初期表示される項目。受注画面・モール取込で利用されます。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orderFields.map((f) => renderField(f, orderVals, setOrderVals))}
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">
          商品の既定値 <HelpHint>商品マスタ新規登録時に初期表示される項目。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productFields.map((f) => renderField(f, productVals, setProductVals))}
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">
          顧客の既定値 <HelpHint>顧客マスタ新規登録時に初期表示される項目。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customerFields.map((f) => renderField(f, customerVals, setCustomerVals))}
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">
          発注の既定値 <HelpHint>発注書作成・自動発注で利用される既定値。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchaseFields.map((f) => renderField(f, purchaseVals, setPurchaseVals))}
        </div>
      </GlassCard>
    </div>
  );
}
