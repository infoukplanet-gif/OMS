"use client";

/**
 * 納品書テンプレート設定（出荷 > 納品書テンプレート設定）。
 *
 * 共有ストア deliveryNoteTemplateStore を読み書きする唯一のオーナー画面。
 * ここでの保存/新規/複製/削除/有効化が、出荷一覧の「納品書発行モーダル」の
 * テンプレート選択肢に即時連動する。
 */

import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton, SecondaryButton, Modal } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Save, FileText, Eye, Download, Plus, Trash2, FileImage } from "lucide-react";
import {
  deliveryNoteTemplateStore,
  type DeliveryNoteTemplate,
} from "@/lib/stores/shipment-templates";
import { INITIAL_DELIVERY_NOTE_TEMPLATES } from "@/lib/seeds/shipment-templates";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  buildDeliveryNoteDocument,
  type DeliveryNoteTemplateConfig,
  type DeliveryNoteSource,
} from "@/lib/documents/delivery-note-document";
import { renderDeliveryNoteHtml } from "@/lib/documents/delivery-note-html";
import { printDocumentHtml } from "@/lib/documents/print-document";
import { COMPANY_ISSUER } from "@/lib/seeds/company";

function toConfig(t: DeliveryNoteTemplate): DeliveryNoteTemplateConfig {
  return {
    paperSize: t.paperSize,
    forUse: t.forUse,
    showLogo: t.showLogo,
    showInvoice: t.showInvoice,
    showPriceBreakdown: t.showPriceBreakdown,
    showSignature: t.showSignature,
  };
}

/** プレビュー/サンプルPDF 用の固定サンプル出荷。 */
const SAMPLE_SOURCE: DeliveryNoteSource = {
  id: "ORD-2026-09001",
  customer: "山田 太郎",
  shipDate: "2026-05-02",
  carrier: "ヤマト運輸",
  shop: "本店",
  amount: 14800,
  lines: [
    { sku: "TS-WH-M", name: "オーガニックコットンTシャツ ホワイト M", qty: 2, unitPrice: 4400 },
    { sku: "JK-NV-L", name: "リネンジャケット ネイビー L", qty: 1, unitPrice: 6000 },
  ],
};

function nextTemplateId(existing: ReadonlyArray<DeliveryNoteTemplate>): string {
  const max = existing.reduce((m, t) => {
    const match = /^D-(\d+)$/.exec(t.id);
    return match ? Math.max(m, parseInt(match[1], 10)) : m;
  }, 0);
  return `D-${String(max + 1).padStart(2, "0")}`;
}

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export default function ShipmentsDeliveryNoteTemplatePage() {
  const toast = useToast();

  // このページが delivery-note-templates ストアの正規オーナー（永続化はここで 1 回だけ張る）。
  usePersistentStore({
    store: deliveryNoteTemplateStore,
    domain: "delivery-note-templates",
    seed: INITIAL_DELIVERY_NOTE_TEMPLATES,
  });

  const templates = useSyncExternalStore(
    (cb) => deliveryNoteTemplateStore.subscribe(cb),
    () => deliveryNoteTemplateStore.getState(),
    () => INITIAL_DELIVERY_NOTE_TEMPLATES,
  ) as ReadonlyArray<DeliveryNoteTemplate>;

  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? "");
  const [draft, setDraft] = useState<DeliveryNoteTemplate | null>(templates[0] ?? null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const updateDraft = <K extends keyof DeliveryNoteTemplate>(
    key: K,
    value: DeliveryNoteTemplate[K],
  ) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  function selectTemplate(t: DeliveryNoteTemplate) {
    setSelectedId(t.id);
    setDraft(t);
  }

  function handleSave() {
    if (!draft) return;
    const saved = { ...draft, updatedAt: todayString() };
    deliveryNoteTemplateStore.upsert(saved);
    setDraft(saved);
    toast.show(`「${saved.name}」を保存しました`, "success");
  }

  function handleNew() {
    const id = nextTemplateId(templates);
    const created: DeliveryNoteTemplate = {
      id,
      name: "新規テンプレート",
      forUse: "汎用",
      paperSize: "A4縦",
      showLogo: true,
      showInvoice: true,
      showPriceBreakdown: true,
      showSignature: false,
      active: false,
      updatedAt: todayString(),
    };
    deliveryNoteTemplateStore.upsert(created);
    setSelectedId(id);
    setDraft(created);
    toast.show("新規テンプレートを作成しました", "success");
  }

  function handleClone() {
    if (!draft) return;
    const id = nextTemplateId(templates);
    const cloned: DeliveryNoteTemplate = {
      ...draft,
      id,
      name: `${draft.name}（複製）`,
      active: false,
      updatedAt: todayString(),
    };
    deliveryNoteTemplateStore.upsert(cloned);
    setSelectedId(id);
    setDraft(cloned);
    toast.show("テンプレートを複製しました", "success");
  }

  function handleDelete() {
    if (!draft) return;
    if (templates.length <= 1) {
      toast.show("最後のテンプレートは削除できません", "error");
      return;
    }
    const removingId = draft.id;
    deliveryNoteTemplateStore.remove(removingId);
    const next = templates.find((t) => t.id !== removingId) ?? null;
    setSelectedId(next?.id ?? "");
    setDraft(next);
    toast.show("テンプレートを削除しました", "success");
  }

  const previewHtml = useMemo(() => {
    if (!draft) return "";
    return renderDeliveryNoteHtml(
      buildDeliveryNoteDocument(SAMPLE_SOURCE, toConfig(draft)),
      COMPANY_ISSUER,
    );
  }, [draft]);

  function handleSamplePdf() {
    if (!previewHtml || !draft) return;
    const ok = printDocumentHtml(previewHtml, `${draft.name} サンプル納品書`);
    if (!ok) {
      toast.show("ポップアップがブロックされました。ブラウザの設定を確認してください", "error");
      return;
    }
    toast.show("サンプル納品書を出力しました", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">納品書テンプレート設定</h1>
            <HelpHint>
              用途別（汎用・卸先・VIP・個人顧客）の納品書レイアウトを管理します。{"\n"}
              ロゴ・インボイス番号・税内訳・担当者印の表示有無を細かく設定できます。{"\n"}
              有効化したテンプレートのみ発行モーダルに表示されます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            登録: {templates.length} 件 ／ 有効: {templates.filter((t) => t.active).length} 件
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPreviewOpen(true)}
            disabled={!draft}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 disabled:opacity-40"
          >
            <Eye className="h-4 w-4" />プレビュー
          </button>
          <PrimaryButton onClick={handleSave} disabled={!draft}>
            <Save className="h-4 w-4" />保存
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">テンプレート一覧</h2>
            <button
              onClick={handleNew}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />新規
            </button>
          </div>
          <div className="space-y-1.5">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all",
                  selectedId === t.id
                    ? "bg-blue-500/10 border-blue-300/50"
                    : "bg-white/50 border-white/40 hover:bg-white/70",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{t.name}</span>
                  {t.active ? (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-500/15 text-emerald-700">有効</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-gray-500/15 text-gray-600">無効</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t.forUse} ／ {t.paperSize}</p>
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="lg:col-span-2 space-y-4">
          {!draft ? (
            <GlassCard>
              <p className="text-sm text-gray-500 py-8 text-center">
                テンプレートが選択されていません。「新規」から作成してください。
              </p>
            </GlassCard>
          ) : (
            <>
              <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <h2 className="text-base font-semibold text-gray-800">基本設定</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">テンプレート名</label>
                    <input
                      value={draft.name}
                      onChange={(e) => updateDraft("name", e.target.value)}
                      className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">用途区分</label>
                    <select
                      value={draft.forUse}
                      onChange={(e) => updateDraft("forUse", e.target.value as DeliveryNoteTemplate["forUse"])}
                      className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {(["汎用", "個人顧客", "卸先", "VIP"] as const).map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">用紙サイズ</label>
                    <select
                      value={draft.paperSize}
                      onChange={(e) => updateDraft("paperSize", e.target.value as DeliveryNoteTemplate["paperSize"])}
                      className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {(["A4縦", "A4横", "B5", "B5横"] as const).map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">最終更新</label>
                    <p className="h-9 px-3 py-2 rounded-xl text-sm bg-white/30 border border-white/40 text-gray-500">
                      {draft.updatedAt}
                    </p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                  <FileImage className="h-4 w-4 text-gray-400" />
                  <h2 className="text-base font-semibold text-gray-800">表示要素</h2>
                  <HelpHint>納品書PDFに含める要素のON/OFFを切り替えます。</HelpHint>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Toggle
                    label="会社ロゴを表示"
                    checked={draft.showLogo}
                    onChange={(v) => updateDraft("showLogo", v)}
                    hint="発行元のロゴを納品書右上に表示します。"
                  />
                  <Toggle
                    label="適格請求書番号を表示"
                    checked={draft.showInvoice}
                    onChange={(v) => updateDraft("showInvoice", v)}
                    hint="インボイス制度対応。卸先向けには必須となるケースがほとんどです。"
                  />
                  <Toggle
                    label="金額・税内訳を表示"
                    checked={draft.showPriceBreakdown}
                    onChange={(v) => updateDraft("showPriceBreakdown", v)}
                    hint="単価・小計・消費税・合計の内訳列を表示します。"
                  />
                  <Toggle
                    label="担当者印欄を表示"
                    checked={draft.showSignature}
                    onChange={(v) => updateDraft("showSignature", v)}
                    hint="右下に押印スペースを設けます。VIP・卸先向けに使用します。"
                  />
                  <Toggle
                    label="このテンプレートを有効化"
                    checked={draft.active}
                    onChange={(v) => updateDraft("active", v)}
                    hint="有効化したテンプレートのみ発行モーダルの選択肢に出ます。"
                  />
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <h2 className="text-base font-semibold text-gray-800">操作</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSamplePdf}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
                  >
                    <Download className="h-4 w-4" />サンプルPDF
                  </button>
                  <button
                    onClick={handleClone}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
                  >
                    <Plus className="h-4 w-4" />複製
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-300/40 text-red-700 hover:bg-red-500/25"
                  >
                    <Trash2 className="h-4 w-4" />削除
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  ※ 編集内容は「保存」を押すまで反映されません。プレビュー/サンプルPDFは編集中の内容で出力します。
                </p>
              </GlassCard>
            </>
          )}
        </div>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={draft ? `プレビュー — ${draft.name}` : "プレビュー"}
        size="lg"
        footer={
          <>
            <SecondaryButton onClick={() => setPreviewOpen(false)}>閉じる</SecondaryButton>
            <PrimaryButton onClick={handleSamplePdf} disabled={!previewHtml}>
              <Download className="h-4 w-4" />サンプルPDF出力
            </PrimaryButton>
          </>
        }
      >
        <div className="rounded-xl border border-white/60 bg-white overflow-hidden shadow-inner">
          <iframe title="納品書プレビュー" srcDoc={previewHtml} className="w-full h-[55vh] border-0 bg-white" />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          サンプル出荷データで描画したプレビューです。実際の発行もこのレイアウトになります。
        </p>
      </Modal>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
      <span className="flex items-center gap-1.5">
        {label}
        {hint && <HelpHint side="right">{hint}</HelpHint>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-blue-500 w-4 h-4"
      />
    </label>
  );
}
