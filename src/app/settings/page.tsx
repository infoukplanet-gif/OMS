"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import {
  Building2,
  Store,
  Users,
  ShoppingCart,
  Tag,
  Mail,
  Bot,
  Key,
  Upload,
} from "lucide-react";

const settingCategories = [
  { icon: Building2, label: "企業設定", value: "company" },
  { icon: Store, label: "店舗連携", value: "shops" },
  { icon: Users, label: "担当者・権限", value: "users" },
  { icon: ShoppingCart, label: "受注設定", value: "orders" },
  { icon: Tag, label: "商品設定", value: "products" },
  { icon: Mail, label: "メール設定", value: "mail" },
  { icon: Bot, label: "AI設定", value: "ai" },
  { icon: Key, label: "API設定", value: "api" },
];

const navMap: Record<string, string> = {
  users: "/settings/users",
  orders: "/settings/order-rules",
  products: "/products",
  mail: "/mail/server",
  api: "/settings/api",
};

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState("company");

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">設定</h1>

      <div className="flex gap-4">
        {/* Category Nav */}
        <div className="w-48 shrink-0 space-y-1">
          {settingCategories.map((cat) => {
            const isLink = navMap[cat.value];
            if (isLink) {
              return (
                <Link
                  key={cat.value}
                  href={isLink}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-white/50 transition-all duration-200"
                >
                  <cat.icon className="h-4.5 w-4.5 shrink-0" />
                  {cat.label}
                </Link>
              );
            }
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  activeCategory === cat.value
                    ? "bg-white/90 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_rgba(59,130,246,0.1)] text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-white/50"
                )}
              >
                <cat.icon className="h-4.5 w-4.5 shrink-0" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <GlassCard className="flex-1">
          {activeCategory === "company" && <CompanySettings />}
          {activeCategory === "shops" && <ShopSettings />}
          {activeCategory === "ai" && <AISettings />}
        </GlassCard>
      </div>
    </div>
  );
}

function CompanySettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">企業設定</h2>

      {/* Basic Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">基本情報</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="企業名" defaultValue="株式会社サンプル" />
          <Field label="企業コード" defaultValue="SAMPLE-001" />
          <Field label="代表者名" placeholder="代表者名を入力" />
          <Field label="電話番号" placeholder="03-xxxx-xxxx" />
          <Field label="郵便番号" placeholder="100-0001" className="col-span-1" />
          <Field label="FAX" placeholder="03-xxxx-xxxx" />
          <Field label="住所" placeholder="東京都千代田区..." className="col-span-2" />
          <Field label="メールアドレス" placeholder="info@example.com" className="col-span-2" />
        </div>
      </section>

      <div className="h-px bg-white/40" />

      {/* Logo */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">ロゴ設定</h3>
        <div className={cn(
          "flex flex-col items-center justify-center gap-2 p-8 rounded-xl",
          "border-2 border-dashed border-gray-300/50",
          "bg-white/30 hover:bg-white/50 transition-colors cursor-pointer"
        )}>
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500">ファイルをドラッグ＆ドロップ</p>
          <p className="text-xs text-gray-400">PNG, JPG, SVG（最大2MB）</p>
        </div>
      </section>

      <div className="h-px bg-white/40" />

      {/* System */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">システム設定</h3>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="タイムゾーン" value="Asia/Tokyo" options={["Asia/Tokyo"]} />
          <SelectField label="通貨" value="JPY - 日本円" options={["JPY - 日本円"]} />
          <Field label="税率" defaultValue="10%" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">消費税計算</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="tax" defaultChecked className="accent-blue-500" /> 税込
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="tax" className="accent-blue-500" /> 税抜
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button className={cn(
          "px-5 py-2.5 rounded-xl text-sm font-medium",
          "bg-blue-500/80 backdrop-blur-xl border border-blue-400/50",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
          "text-white hover:bg-blue-500/90 transition-all"
        )}>
          変更を保存
        </button>
        <button className={cn(
          "px-5 py-2.5 rounded-xl text-sm font-medium",
          "bg-white/60 backdrop-blur-xl border border-white/50",
          "text-gray-600 hover:bg-white/80 transition-all"
        )}>
          リセット
        </button>
      </div>
    </div>
  );
}

function ShopSettings() {
  const shops = [
    { name: "楽天市場", status: "連携中", color: "bg-red-500", lastSync: "2分前", orders: 547 },
    { name: "Amazon", status: "連携中", color: "bg-orange-400", lastSync: "5分前", orders: 312 },
    { name: "Shopify", status: "連携中", color: "bg-green-500", lastSync: "1分前", orders: 205 },
    { name: "Yahoo!", status: "エラー", color: "bg-purple-500", lastSync: "3時間前", orders: 89 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">店舗連携</h2>
        <button className={cn(
          "px-4 py-2 rounded-xl text-sm font-medium",
          "bg-blue-500/80 backdrop-blur-xl border border-blue-400/50",
          "text-white hover:bg-blue-500/90 transition-all"
        )}>
          店舗を追加
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {shops.map((shop) => (
          <div
            key={shop.name}
            className={cn(
              "p-4 rounded-xl",
              "bg-white/50 backdrop-blur-xl border border-white/50",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
              "hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={cn("h-3 w-3 rounded-full", shop.color)} />
                <span className="font-medium text-gray-800">{shop.name}</span>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                shop.status === "連携中" ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"
              )}>
                {shop.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-500">最終同期</div>
              <div className="text-gray-700 text-right">{shop.lastSync}</div>
              <div className="text-gray-500">受注取込数</div>
              <div className="text-gray-700 text-right">{shop.orders}件</div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 px-2 py-1.5 rounded-lg text-xs text-gray-600 bg-white/60 border border-white/50 hover:bg-white/80 transition-colors">設定</button>
              <button className="flex-1 px-2 py-1.5 rounded-lg text-xs text-gray-600 bg-white/60 border border-white/50 hover:bg-white/80 transition-colors">同期履歴</button>
              {shop.status === "エラー" ? (
                <button className="flex-1 px-2 py-1.5 rounded-lg text-xs text-red-700 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">再接続</button>
              ) : (
                <button className="flex-1 px-2 py-1.5 rounded-lg text-xs text-gray-600 bg-white/60 border border-white/50 hover:bg-white/80 transition-colors">一時停止</button>
              )}
            </div>
          </div>
        ))}

        {/* Add new */}
        <div className={cn(
          "flex flex-col items-center justify-center gap-2 p-6 rounded-xl",
          "border-2 border-dashed border-gray-300/50",
          "bg-white/20 hover:bg-white/40 transition-colors cursor-pointer"
        )}>
          <Store className="h-6 w-6 text-gray-400" />
          <p className="text-sm text-gray-500">新しい店舗を追加</p>
        </div>
      </div>
    </div>
  );
}

function AISettings() {
  const providers = [
    { name: "OpenAI", models: "GPT-4o, GPT-4o-mini", connected: false },
    { name: "Anthropic", models: "Claude Opus, Claude Sonnet", connected: false },
    { name: "Google", models: "Gemini Pro, Gemini Flash", connected: false },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">AI設定（BYOAI）</h2>
      <p className="text-sm text-gray-500">お持ちのAI APIキーを登録して、AIエージェント機能を有効化できます。</p>

      <div className="space-y-3">
        {providers.map((p) => (
          <div key={p.name} className={cn(
            "flex items-center justify-between p-4 rounded-xl",
            "bg-white/50 border border-white/50"
          )}>
            <div>
              <p className="font-medium text-gray-800">{p.name}</p>
              <p className="text-xs text-gray-500">{p.models}</p>
            </div>
            <button className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium",
              "bg-white/60 border border-white/50",
              "text-gray-700 hover:bg-white/80 transition-all"
            )}>
              APIキーを設定
            </button>
          </div>
        ))}
      </div>

      <div className="h-px bg-white/40" />

      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">エージェント自律度</h3>
        <div className="space-y-2">
          {[
            { level: "Level 1", label: "通知のみ", desc: "エージェントは検知結果を通知するだけ" },
            { level: "Level 2", label: "提案＋承認", desc: "エージェントが提案し、承認後に実行" },
            { level: "Level 3", label: "完全自動", desc: "エージェントが自律的に判断・実行" },
          ].map((l, i) => (
            <label key={l.level} className={cn(
              "flex items-start gap-3 p-3 rounded-xl cursor-pointer",
              "bg-white/30 hover:bg-white/50 transition-colors"
            )}>
              <input type="radio" name="autonomy" defaultChecked={i === 1} className="mt-0.5 accent-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">{l.level}: {l.label}</p>
                <p className="text-xs text-gray-500">{l.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, defaultValue, placeholder, className }: { label: string; defaultValue?: string; placeholder?: string; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={cn(
          "w-full h-9 px-3 rounded-xl text-sm",
          "bg-white/50 border border-white/50",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
          "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        )}
      />
    </div>
  );
}

function SelectField({ label, value, options }: { label: string; value: string; options: string[] }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        defaultValue={value}
        className={cn(
          "w-full h-9 px-3 rounded-xl text-sm",
          "bg-white/50 border border-white/50",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        )}
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
