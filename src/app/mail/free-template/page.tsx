"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { downloadCsv } from "@/lib/export/csv";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  mailFreeTemplateStore,
  INITIAL_MAIL_FREE_TEMPLATES,
  type MailFreeTemplateRecord,
} from "@/lib/stores/mail-free-template-store";
import { Copy, Edit, Eye, Plus, Search, Trash2, X } from "lucide-react";

type FreeTemplate = MailFreeTemplateRecord;

const categories = ["お詫び", "問い合わせ", "事務連絡", "営業"];

const todayLabel = () =>
  new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });

export default function MailFreeTemplatePage() {
  const toast = useToast();

  // 永続化（domain: "mail-free-template-settings"）の正規オーナーページ。
  usePersistentStore({
    store: mailFreeTemplateStore,
    domain: "mail-free-template-settings",
    seed: INITIAL_MAIL_FREE_TEMPLATES,
  });
  const items = useSyncExternalStore(
    mailFreeTemplateStore.subscribe,
    mailFreeTemplateStore.getState,
    mailFreeTemplateStore.getState,
  );

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const [shared, setShared] = useState<"all" | "shared" | "personal">("all");
  const [panel, setPanel] = useState<{ id: string; mode: "preview" | "edit" } | null>(null);

  const panelItem = panel ? (items.find((i) => i.id === panel.id) ?? null) : null;
  const idSeqRef = useRef(0);
  const newTemplateId = () => `free-new-${++idSeqRef.current}`;

  const updateItem = (id: string, patch: Partial<FreeTemplate>) => {
    const current = mailFreeTemplateStore.findById(id);
    if (!current) return;
    mailFreeTemplateStore.upsert({ ...current, ...patch, updated: todayLabel() });
  };

  const exportCsv = () => {
    downloadCsv(
      "フリーメールテンプレート.csv",
      ["テンプレート名", "カテゴリ", "件名", "本文", "共有", "作成者", "更新日", "利用回数"],
      items.map((t) => [t.name, t.category, t.subject, t.body, t.shared ? "共有" : "個人", t.createdBy, t.updated, t.uses])
    );
    toast.show(`${items.length} 件のテンプレートをCSVで書き出しました`, "success");
  };

  const addTemplate = () => {
    const id = newTemplateId();
    const item: FreeTemplate = {
      id,
      name: "新規テンプレート",
      category: "事務連絡",
      subject: "",
      body: "",
      signature: "default",
      shared: false,
      updated: todayLabel(),
      createdBy: "管理者",
      uses: 0,
    };
    mailFreeTemplateStore.upsert(item);
    setPanel({ id, mode: "edit" });
    toast.show("新規テンプレートを追加しました。内容を編集してください", "success");
  };

  const duplicateTemplate = (t: FreeTemplate) => {
    const id = newTemplateId();
    mailFreeTemplateStore.upsert({ ...t, id, name: `${t.name}（コピー）`, uses: 0, updated: todayLabel() });
    toast.show(`${t.name} を複製しました`, "success");
  };

  const removeTemplate = (t: FreeTemplate) => {
    mailFreeTemplateStore.remove(t.id);
    setPanel((p) => (p?.id === t.id ? null : p));
    toast.show(`${t.name} を削除しました`, "info");
  };

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((i) => {
      if (k && !`${i.name} ${i.subject} ${i.createdBy}`.toLowerCase().includes(k)) return false;
      if (category !== "all" && i.category !== category) return false;
      if (shared === "shared" && !i.shared) return false;
      if (shared === "personal" && i.shared) return false;
      return true;
    });
  }, [items, keyword, category, shared]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">フリーメールテンプレート</h1>
            <HelpHint>オペレーターが手動送信するメールのテンプレート集。お詫び・キャンセル受付・問い合わせ返信などをカテゴリ別に管理します。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">用途別に分類されたテンプレートからフリーメール送信画面で呼び出して利用します。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={exportCsv}>エクスポート</SecondaryButton>
          <PrimaryButton onClick={addTemplate}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />新規追加</span>
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録テンプレート</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">共有</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{items.filter((i) => i.shared).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">個人</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">{items.filter((i) => !i.shared).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">送信実績合計</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.reduce((s, i) => s + i.uses, 0)}</div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="テンプレート名・件名・作成者"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">カテゴリ: すべて</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={shared}
            onChange={(e) => setShared(e.target.value as typeof shared)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">共有/個人: すべて</option>
            <option value="shared">共有のみ</option>
            <option value="personal">個人のみ</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setCategory("all"); setShared("all"); }}>
            クリア
          </SecondaryButton>
        </div>
      </GlassCard>

      {panelItem && (
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">
                {panel?.mode === "edit" ? "テンプレート編集" : "プレビュー"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700">{panelItem.category}</span>
            </div>
            <div className="flex items-center gap-2">
              {panel?.mode === "preview" && (
                <SecondaryButton onClick={() => setPanel({ id: panelItem.id, mode: "edit" })}>編集する</SecondaryButton>
              )}
              <button
                onClick={() => setPanel(null)}
                className="p-1.5 rounded-lg bg-gray-500/10 text-gray-700 hover:bg-gray-500/20"
                title="閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {panel?.mode === "edit" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">テンプレート名</label>
                  <input
                    value={panelItem.name}
                    onChange={(e) => updateItem(panelItem.id, { name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">カテゴリ</label>
                  <select
                    value={panelItem.category}
                    onChange={(e) => updateItem(panelItem.id, { category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                  >
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">共有設定</label>
                  <select
                    value={panelItem.shared ? "shared" : "personal"}
                    onChange={(e) => updateItem(panelItem.id, { shared: e.target.value === "shared" })}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                  >
                    <option value="shared">共有</option>
                    <option value="personal">個人</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">件名</label>
                <input
                  value={panelItem.subject}
                  onChange={(e) => updateItem(panelItem.id, { subject: e.target.value })}
                  placeholder="例: 【お詫び】商品発送遅延について（{{order_id}}）"
                  className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">本文</label>
                <textarea
                  value={panelItem.body}
                  onChange={(e) => updateItem(panelItem.id, { body: e.target.value })}
                  rows={6}
                  placeholder="{{customer_name}} 様 などの差込変数が使えます"
                  className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                />
              </div>
              <div className="flex justify-end">
                <PrimaryButton
                  onClick={() => {
                    setPanel(null);
                    toast.show(`${panelItem.name} を保存しました`, "success");
                  }}
                >
                  保存して閉じる
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-800 font-mono">{panelItem.subject || "（件名未設定）"}</div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap rounded-xl bg-white/50 border border-white/60 p-3">
                {panelItem.body || "（本文未設定）"}
              </div>
              <div className="text-xs text-gray-400">作成者: {panelItem.createdBy} ／ 更新: {panelItem.updated} ／ 利用回数: {panelItem.uses}</div>
            </div>
          )}
        </GlassCard>
      )}

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {items.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">テンプレート名</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">カテゴリ</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">件名</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">共有</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">作成者</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">更新</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">利用回数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-gray-800">{t.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{t.body.split("\n")[0]}</div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700">{t.category}</span>
                </td>
                <td className="px-3 py-2.5 text-gray-700 text-xs font-mono truncate max-w-[280px]">{t.subject}</td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      t.shared ? "bg-emerald-500/15 text-emerald-700" : "bg-violet-500/15 text-violet-700"
                    )}
                  >
                    {t.shared ? "共有" : "個人"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{t.createdBy}</td>
                <td className="px-3 py-2.5 text-center text-gray-500 text-xs">{t.updated}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{t.uses}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setPanel({ id: t.id, mode: "preview" })}
                      className="p-1.5 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                      title="プレビュー"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => duplicateTemplate(t)}
                      className="p-1.5 rounded-lg bg-gray-500/10 text-gray-700 hover:bg-gray-500/20"
                      title="複製"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setPanel({ id: t.id, mode: "edit" })}
                      className="p-1.5 rounded-lg bg-gray-500/10 text-gray-700 hover:bg-gray-500/20"
                      title="編集"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeTemplate(t)}
                      className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25"
                      title="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-400">該当するテンプレートがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
