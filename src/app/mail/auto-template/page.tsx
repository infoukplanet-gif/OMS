"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  mailAutoTemplateStore,
  INITIAL_MAIL_AUTO_TEMPLATES,
  type MailAutoTemplateRecord,
} from "@/lib/stores/mail-auto-template-store";
import { Copy, Eye, Plus, Search, X } from "lucide-react";

const SAMPLE_VALUES: Record<string, string> = {
  "{{shop_name}}": "OMSショップ",
  "{{customer_name}}": "山田 太郎",
  "{{order_id}}": "ORD-2026-00851",
  "{{order_date}}": "2026/06/13",
  "{{total_amount}}": "32,400",
  "{{payment_method}}": "クレジットカード",
  "{{payment_deadline}}": "2026/06/20",
  "{{shipping_carrier}}": "ヤマト運輸",
  "{{tracking_number}}": "4567-8901-2345",
  "{{delivery_date}}": "2026/06/15",
  "{{product_list}}": "オーガニックコットンTシャツ ×2",
  "{{shipping_address}}": "東京都渋谷区〇〇1-2-3",
};

function applySampleValues(text: string): string {
  return text.replace(/\{\{[a-z_]+\}\}/g, (m) => SAMPLE_VALUES[m] ?? m);
}

type Template = MailAutoTemplateRecord;

const variables = [
  "{{shop_name}}", "{{customer_name}}", "{{order_id}}", "{{order_date}}",
  "{{total_amount}}", "{{payment_method}}", "{{payment_deadline}}",
  "{{shipping_carrier}}", "{{tracking_number}}", "{{delivery_date}}",
  "{{product_list}}", "{{shipping_address}}",
];

export default function MailAutoTemplatePage() {
  const toast = useToast();

  // 永続化（domain: "mail-auto-template-settings"）の正規オーナーページ。
  usePersistentStore({
    store: mailAutoTemplateStore,
    domain: "mail-auto-template-settings",
    seed: INITIAL_MAIL_AUTO_TEMPLATES,
  });
  const records = useSyncExternalStore(
    mailAutoTemplateStore.subscribe,
    mailAutoTemplateStore.getState,
    mailAutoTemplateStore.getState,
  );

  // 編集中は store のスナップショットを下書き（items）として保持し、
  // 復元（hydrate）で records の identity が変わったらレンダー中に同期する
  // （effect 内 setState を避ける React 公式パターン）。
  const [items, setItems] = useState<Template[]>(records as Template[]);
  const [syncedRecords, setSyncedRecords] = useState(records);
  if (syncedRecords !== records) {
    setSyncedRecords(records);
    setItems(records as Template[]);
  }

  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [activeId, setActiveId] = useState(records[0]?.id ?? INITIAL_MAIL_AUTO_TEMPLATES[0].id);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const saveTemplates = () => {
    mailAutoTemplateStore.setItems(items);
    const now = new Date();
    setSavedAt(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    toast.show("テンプレートを保存しました", "success");
  };

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((i) => {
      if (k && !`${i.name} ${i.trigger} ${i.subject}`.toLowerCase().includes(k)) return false;
      if (filter === "enabled" && !i.enabled) return false;
      if (filter === "disabled" && i.enabled) return false;
      return true;
    });
  }, [items, keyword, filter]);

  const active = items.find((i) => i.id === activeId) || items[0];

  const update = (patch: Partial<Template>) =>
    setItems((prev) => prev.map((i) => (i.id === active.id ? { ...i, ...patch } : i)));

  const addTemplate = () => {
    const id = `tpl-${Date.now()}`;
    const today = new Date();
    const next: Template = {
      id,
      name: "新規テンプレート",
      trigger: "手動送信",
      subject: "{{shop_name}}：",
      body: "{{customer_name}} 様\n\n",
      updated: `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}`,
      uses: 0,
      enabled: false,
    };
    setItems((prev) => [...prev, next]);
    setActiveId(id);
    toast.show("新規テンプレートを追加しました。右側で内容を編集してください", "success");
  };

  const copyVariable = async (v: string) => {
    try {
      await navigator.clipboard.writeText(v);
      toast.show(`${v} をコピーしました`, "info");
    } catch {
      toast.show("クリップボードへのコピーに失敗しました", "error");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">自動送信メールテンプレート</h1>
            <HelpHint>受注フローに自動送信されるメールの本文・件名テンプレートを編集します。差込変数はリストから選んで挿入できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">サンクスメール・出荷通知・入金催促・フォロー等のテンプレートを統合管理。</p>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && <span className="text-xs text-emerald-700">保存済み {savedAt}</span>}
          <SecondaryButton onClick={() => setPreviewOpen(true)}>
            <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" />プレビュー</span>
          </SecondaryButton>
          <PrimaryButton onClick={saveTemplates}>保存</PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-3 border-b border-white/40 bg-white/40 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                type="text"
                placeholder="テンプレート検索"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            >
              <option value="all">すべて</option>
              <option value="enabled">有効のみ</option>
              <option value="disabled">無効のみ</option>
            </select>
            <button
              onClick={addTemplate}
              className="w-full px-3 py-2 rounded-xl text-sm font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />新規テンプレート
            </button>
          </div>
          <div className="max-h-[480px] overflow-y-auto divide-y divide-white/40">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "w-full text-left px-3 py-3 hover:bg-white/40 transition-colors",
                  active.id === t.id && "bg-blue-500/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 text-sm">{t.name}</span>
                  <span className={cn("px-1.5 py-0.5 rounded-md text-[10px]", t.enabled ? "bg-emerald-500/15 text-emerald-700" : "bg-gray-500/10 text-gray-500")}>
                    {t.enabled ? "有効" : "無効"}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{t.trigger}</div>
                <div className="text-xs text-gray-400 mt-0.5">送信実績: {t.uses.toLocaleString()} 件 / 更新 {t.updated}</div>
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs text-gray-500">テンプレート名</span>
                <input
                  type="text"
                  value={active.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-500">トリガー</span>
                <input
                  type="text"
                  value={active.trigger}
                  onChange={(e) => update({ trigger: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-500">状態</span>
                <select
                  value={active.enabled ? "enabled" : "disabled"}
                  onChange={(e) => update({ enabled: e.target.value === "enabled" })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                >
                  <option value="enabled">有効</option>
                  <option value="disabled">無効</option>
                </select>
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs text-gray-500">件名</span>
                <input
                  type="text"
                  value={active.subject}
                  onChange={(e) => update({ subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono text-xs"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs text-gray-500">本文</span>
                <textarea
                  value={active.body}
                  onChange={(e) => update({ body: e.target.value })}
                  rows={14}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono text-xs leading-relaxed"
                />
              </label>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-gray-800">差込変数</h2>
              <HelpHint>クリックでクリップボードにコピーできます。本文・件名にペーストして利用してください。</HelpHint>
            </div>
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <button
                  key={v}
                  onClick={() => copyVariable(v)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/60 border border-white/60 hover:bg-blue-500/10 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />{v}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-sm p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/50 sticky top-0 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-800">プレビュー：{active.name}</h2>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="p-1 rounded-lg hover:bg-white/60 text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-500">差込変数にサンプル値を当てはめた送信イメージです。</p>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">件名</span>
                <div className="px-3 py-2 rounded-xl bg-white/70 border border-white/60 text-sm font-medium text-gray-800">
                  {applySampleValues(active.subject)}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">本文</span>
                <div className="px-4 py-3 rounded-xl bg-white/70 border border-white/60 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {applySampleValues(active.body)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
