"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/interactive";
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

const initialCompanyForm = {
  name: "株式会社サンプル",
  code: "SAMPLE-001",
  representative: "",
  tel: "",
  zip: "",
  fax: "",
  address: "",
  email: "",
  timezone: "Asia/Tokyo",
  currency: "JPY - 日本円",
  taxRate: "10%",
  taxMode: "included" as "included" | "excluded",
};

type CompanyForm = typeof initialCompanyForm;

function CompanySettings() {
  const toast = useToast();
  const [form, setForm] = useState<CompanyForm>(initialCompanyForm);
  const [logoName, setLogoName] = useState("");
  const set = <K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    if (!form.name.trim()) {
      toast.show("企業名を入力してください", "error");
      return;
    }
    toast.show("企業設定を保存しました", "success");
  };

  const reset = () => {
    setForm(initialCompanyForm);
    setLogoName("");
    toast.show("企業設定を初期値に戻しました", "info");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">企業設定</h2>

      {/* Basic Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">基本情報</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="企業名" value={form.name} onChange={(v) => set("name", v)} />
          <Field label="企業コード" value={form.code} onChange={(v) => set("code", v)} />
          <Field label="代表者名" value={form.representative} onChange={(v) => set("representative", v)} placeholder="代表者名を入力" />
          <Field label="電話番号" value={form.tel} onChange={(v) => set("tel", v)} placeholder="03-xxxx-xxxx" />
          <Field label="郵便番号" value={form.zip} onChange={(v) => set("zip", v)} placeholder="100-0001" className="col-span-1" />
          <Field label="FAX" value={form.fax} onChange={(v) => set("fax", v)} placeholder="03-xxxx-xxxx" />
          <Field label="住所" value={form.address} onChange={(v) => set("address", v)} placeholder="東京都千代田区..." className="col-span-2" />
          <Field label="メールアドレス" value={form.email} onChange={(v) => set("email", v)} placeholder="info@example.com" className="col-span-2" />
        </div>
      </section>

      <div className="h-px bg-white/40" />

      {/* Logo */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">ロゴ設定</h3>
        <label className={cn(
          "flex flex-col items-center justify-center gap-2 p-8 rounded-xl",
          "border-2 border-dashed border-gray-300/50",
          "bg-white/30 hover:bg-white/50 transition-colors cursor-pointer"
        )}>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setLogoName(file.name);
              toast.show(`ロゴファイル「${file.name}」を選択しました`, "success");
              e.target.value = "";
            }}
          />
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500">
            {logoName ? `選択中: ${logoName}` : "クリックしてファイルを選択（ドラッグ＆ドロップ対応予定）"}
          </p>
          <p className="text-xs text-gray-400">PNG, JPG, SVG（最大2MB）</p>
        </label>
      </section>

      <div className="h-px bg-white/40" />

      {/* System */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">システム設定</h3>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="タイムゾーン" value={form.timezone} options={["Asia/Tokyo"]} onChange={(v) => set("timezone", v)} />
          <SelectField label="通貨" value={form.currency} options={["JPY - 日本円"]} onChange={(v) => set("currency", v)} />
          <Field label="税率" value={form.taxRate} onChange={(v) => set("taxRate", v)} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">消費税計算</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="tax" checked={form.taxMode === "included"} onChange={() => set("taxMode", "included")} className="accent-blue-500" /> 税込
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="tax" checked={form.taxMode === "excluded"} onChange={() => set("taxMode", "excluded")} className="accent-blue-500" /> 税抜
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={save} className={cn(
          "px-5 py-2.5 rounded-xl text-sm font-medium",
          "bg-blue-500/80 backdrop-blur-xl border border-blue-400/50",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
          "text-white hover:bg-blue-500/90 transition-all"
        )}>
          変更を保存
        </button>
        <button onClick={reset} className={cn(
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

type ShopStatus = "連携中" | "エラー" | "一時停止";

type Shop = {
  name: string;
  status: ShopStatus;
  color: string;
  lastSync: string;
  orders: number;
  autoSync: boolean;
  history: string[];
};

const initialShops: Shop[] = [
  { name: "楽天市場", status: "連携中", color: "bg-red-500", lastSync: "2分前", orders: 547, autoSync: true, history: ["2分前 取込 12件 成功", "32分前 取込 8件 成功", "1時間前 取込 15件 成功"] },
  { name: "Amazon", status: "連携中", color: "bg-orange-400", lastSync: "5分前", orders: 312, autoSync: true, history: ["5分前 取込 6件 成功", "35分前 取込 9件 成功", "1時間前 取込 4件 成功"] },
  { name: "Shopify", status: "連携中", color: "bg-green-500", lastSync: "1分前", orders: 205, autoSync: true, history: ["1分前 取込 3件 成功", "31分前 取込 5件 成功", "1時間前 取込 7件 成功"] },
  { name: "Yahoo!", status: "エラー", color: "bg-purple-500", lastSync: "3時間前", orders: 89, autoSync: false, history: ["3時間前 取込失敗（認証エラー）", "3時間前 取込 2件 成功", "4時間前 取込 5件 成功"] },
];

const shopBadgeStyles: Record<ShopStatus, string> = {
  連携中: "bg-emerald-500/15 text-emerald-700",
  エラー: "bg-red-500/15 text-red-700",
  一時停止: "bg-gray-500/15 text-gray-600",
};

const CUSTOM_SHOP_COLORS = ["bg-blue-500", "bg-teal-500", "bg-pink-500", "bg-indigo-500"];

function ShopSettings() {
  const toast = useToast();
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [openPanel, setOpenPanel] = useState<{ shop: string; panel: "settings" | "history" } | null>(null);

  const updateShop = (name: string, patch: Partial<Shop>) =>
    setShops((prev) => prev.map((s) => (s.name === name ? { ...s, ...patch } : s)));

  const addShop = () => {
    const n = shops.filter((s) => s.name.startsWith("カスタム店舗")).length + 1;
    const newShop: Shop = {
      name: `カスタム店舗 ${n}`,
      status: "連携中",
      color: CUSTOM_SHOP_COLORS[(n - 1) % CUSTOM_SHOP_COLORS.length],
      lastSync: "たった今",
      orders: 0,
      autoSync: true,
      history: ["たった今 初回接続 成功"],
    };
    setShops((prev) => [...prev, newShop]);
    toast.show(`カスタム店舗 ${n} を追加しました`, "success");
  };

  const reconnect = (name: string) => {
    updateShop(name, { status: "連携中", lastSync: "たった今" });
    toast.show(`${name} を再接続しました`, "success");
  };

  const togglePause = (shop: Shop) => {
    const paused = shop.status === "一時停止";
    updateShop(shop.name, { status: paused ? "連携中" : "一時停止", ...(paused ? { lastSync: "たった今" } : {}) });
    toast.show(paused ? `${shop.name} の同期を再開しました` : `${shop.name} の同期を一時停止しました`, "info");
  };

  const togglePanel = (shop: string, panel: "settings" | "history") =>
    setOpenPanel((prev) => (prev?.shop === shop && prev.panel === panel ? null : { shop, panel }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">店舗連携</h2>
        <button onClick={addShop} className={cn(
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
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", shopBadgeStyles[shop.status])}>
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
              <button onClick={() => togglePanel(shop.name, "settings")} className="flex-1 px-2 py-1.5 rounded-lg text-xs text-gray-600 bg-white/60 border border-white/50 hover:bg-white/80 transition-colors">設定</button>
              <button onClick={() => togglePanel(shop.name, "history")} className="flex-1 px-2 py-1.5 rounded-lg text-xs text-gray-600 bg-white/60 border border-white/50 hover:bg-white/80 transition-colors">同期履歴</button>
              {shop.status === "エラー" ? (
                <button onClick={() => reconnect(shop.name)} className="flex-1 px-2 py-1.5 rounded-lg text-xs text-red-700 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">再接続</button>
              ) : (
                <button onClick={() => togglePause(shop)} className="flex-1 px-2 py-1.5 rounded-lg text-xs text-gray-600 bg-white/60 border border-white/50 hover:bg-white/80 transition-colors">
                  {shop.status === "一時停止" ? "再開" : "一時停止"}
                </button>
              )}
            </div>
            {openPanel?.shop === shop.name && openPanel.panel === "settings" && (
              <div className="mt-3 p-3 rounded-lg bg-white/40 border border-white/50 space-y-2">
                <p className="text-xs font-medium text-gray-600">連携設定</p>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shop.autoSync}
                    onChange={(e) => {
                      updateShop(shop.name, { autoSync: e.target.checked });
                      toast.show(`${shop.name} の自動同期を${e.target.checked ? "有効" : "無効"}にしました`, "info");
                    }}
                    className="accent-blue-500"
                  />
                  受注を自動同期する（30分間隔）
                </label>
              </div>
            )}
            {openPanel?.shop === shop.name && openPanel.panel === "history" && (
              <div className="mt-3 p-3 rounded-lg bg-white/40 border border-white/50 space-y-1.5">
                <p className="text-xs font-medium text-gray-600">同期履歴</p>
                {shop.history.map((h) => (
                  <p key={h} className={cn("text-xs", h.includes("失敗") ? "text-red-600" : "text-gray-600")}>{h}</p>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Add new */}
        <button
          onClick={addShop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-6 rounded-xl",
            "border-2 border-dashed border-gray-300/50",
            "bg-white/20 hover:bg-white/40 transition-colors cursor-pointer"
          )}
        >
          <Store className="h-6 w-6 text-gray-400" />
          <p className="text-sm text-gray-500">新しい店舗を追加</p>
        </button>
      </div>
    </div>
  );
}

const initialProviders = [
  { name: "OpenAI", models: "GPT-4o, GPT-4o-mini", connected: false },
  { name: "Anthropic", models: "Claude Opus, Claude Sonnet", connected: false },
  { name: "Google", models: "Gemini Pro, Gemini Flash", connected: false },
];

function AISettings() {
  const toast = useToast();
  const [providers, setProviders] = useState(initialProviders);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [keyDraft, setKeyDraft] = useState("");
  const [autonomy, setAutonomy] = useState("Level 2");

  const startEdit = (name: string) => {
    setEditingProvider((prev) => (prev === name ? null : name));
    setKeyDraft("");
  };

  const saveKey = (name: string) => {
    if (!keyDraft.trim()) {
      toast.show("APIキーを入力してください", "error");
      return;
    }
    setProviders((prev) => prev.map((p) => (p.name === name ? { ...p, connected: true } : p)));
    setEditingProvider(null);
    setKeyDraft("");
    toast.show(`${name} のAPIキーを登録しました`, "success");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">AI設定（BYOAI）</h2>
      <p className="text-sm text-gray-500">お持ちのAI APIキーを登録して、AIエージェント機能を有効化できます。</p>

      <div className="space-y-3">
        {providers.map((p) => (
          <div key={p.name} className={cn("p-4 rounded-xl", "bg-white/50 border border-white/50")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.models}</p>
                </div>
                {p.connected && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">接続済み</span>
                )}
              </div>
              <button onClick={() => startEdit(p.name)} className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium",
                "bg-white/60 border border-white/50",
                "text-gray-700 hover:bg-white/80 transition-all"
              )}>
                {p.connected ? "APIキーを変更" : "APIキーを設定"}
              </button>
            </div>
            {editingProvider === p.name && (
              <div className="flex gap-2 mt-3">
                <input
                  type="password"
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  placeholder={`${p.name} のAPIキーを入力`}
                  className={cn(
                    "flex-1 h-9 px-3 rounded-xl text-sm",
                    "bg-white/50 border border-white/50",
                    "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  )}
                />
                <button onClick={() => saveKey(p.name)} className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium",
                  "bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
                )}>
                  登録
                </button>
                <button onClick={() => setEditingProvider(null)} className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium",
                  "bg-white/60 border border-white/50 text-gray-600 hover:bg-white/80 transition-all"
                )}>
                  キャンセル
                </button>
              </div>
            )}
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
          ].map((l) => (
            <label key={l.level} className={cn(
              "flex items-start gap-3 p-3 rounded-xl cursor-pointer",
              "bg-white/30 hover:bg-white/50 transition-colors"
            )}>
              <input
                type="radio"
                name="autonomy"
                checked={autonomy === l.level}
                onChange={() => {
                  setAutonomy(l.level);
                  toast.show(`エージェント自律度を ${l.level}（${l.label}）に変更しました`, "info");
                }}
                className="mt-0.5 accent-blue-500"
              />
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

function Field({ label, value, onChange, placeholder, className }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
