"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/interactive";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  companySettingsStore,
  INITIAL_COMPANY_SETTINGS,
  DEFAULT_COMPANY_SETTINGS,
  type CompanySettingsFields,
} from "@/lib/stores/company-settings-store";
import {
  aiSettingsStore,
  INITIAL_AI_SETTINGS,
} from "@/lib/stores/ai-settings-store";
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
  shops: "/settings/shops",
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
          {activeCategory === "ai" && <AISettings />}
        </GlassCard>
      </div>
    </div>
  );
}

type CompanyForm = Omit<CompanySettingsFields, "logoName">;

function toCompanyForm(record: CompanySettingsFields): CompanyForm {
  const { logoName, ...rest } = record;
  void logoName;
  return rest;
}

const initialCompanyForm = toCompanyForm(DEFAULT_COMPANY_SETTINGS);

function CompanySettings() {
  const toast = useToast();

  // 永続化オーナー（企業設定タブ）
  usePersistentStore({
    store: companySettingsStore,
    domain: "company-settings",
    seed: INITIAL_COMPANY_SETTINGS,
  });

  const items = useSyncExternalStore(
    companySettingsStore.subscribe,
    companySettingsStore.getState,
    companySettingsStore.getState,
  );
  const config = items[0] ?? INITIAL_COMPANY_SETTINGS[0];

  const [form, setForm] = useState<CompanyForm>(() => toCompanyForm(config));
  const [logoName, setLogoName] = useState(config.logoName);
  const set = <K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ストアが復元されたらドラフトを同期
  useEffect(() => {
    setForm(toCompanyForm(config));
    setLogoName(config.logoName);
  }, [config]);

  const save = () => {
    if (!form.name.trim()) {
      toast.show("企業名を入力してください", "error");
      return;
    }
    companySettingsStore.upsert({ id: "config", ...form, logoName });
    toast.show("企業設定を保存しました", "success");
  };

  const reset = () => {
    setForm(initialCompanyForm);
    setLogoName("");
    toast.show("企業設定を初期値に戻しました（保存で確定）", "info");
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

function AISettings() {
  const toast = useToast();

  // 永続化オーナー（AI設定タブ）。⚠ APIキー実体は保存しない（接続フラグ＋自律度のみ）
  usePersistentStore({
    store: aiSettingsStore,
    domain: "ai-settings",
    seed: INITIAL_AI_SETTINGS,
  });

  const items = useSyncExternalStore(
    aiSettingsStore.subscribe,
    aiSettingsStore.getState,
    aiSettingsStore.getState,
  );
  const config = items[0] ?? INITIAL_AI_SETTINGS[0];
  const providers = config.providers;
  const autonomy = config.autonomy;

  // APIキー入力は ephemeral（ストア／スナップショットには絶対に載せない）
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [keyDraft, setKeyDraft] = useState("");

  const startEdit = (name: string) => {
    setEditingProvider((prev) => (prev === name ? null : name));
    setKeyDraft("");
  };

  const saveKey = (name: string) => {
    if (!keyDraft.trim()) {
      toast.show("APIキーを入力してください", "error");
      return;
    }
    // 接続フラグのみ永続化（キー実体は破棄）
    aiSettingsStore.upsert({
      id: "config",
      autonomy,
      providers: providers.map((p) => (p.name === name ? { ...p, connected: true } : p)),
    });
    setEditingProvider(null);
    setKeyDraft("");
    toast.show(`${name} のAPIキーを登録しました`, "success");
  };

  const changeAutonomy = (level: string, label: string) => {
    aiSettingsStore.upsert({
      id: "config",
      autonomy: level,
      providers: providers.map((p) => ({ ...p })),
    });
    toast.show(`エージェント自律度を ${level}（${label}）に変更しました`, "info");
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
                onChange={() => changeAutonomy(l.level, l.label)}
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
