"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Save, FileText, ImageIcon, Eye, Download, Plus, Trash2 } from "lucide-react";

type Template = {
  id: string;
  name: string;
  forUse: "個人顧客" | "卸先" | "VIP" | "汎用";
  paperSize: "A4縦" | "A4横" | "B5" | "B5横";
  showLogo: boolean;
  showInvoice: boolean;
  showPriceBreakdown: boolean;
  showSignature: boolean;
  active: boolean;
  updatedAt: string;
};

const INITIAL: Template[] = [
  { id: "T-01", name: "標準納品書", forUse: "汎用", paperSize: "A4縦", showLogo: true, showInvoice: true, showPriceBreakdown: true, showSignature: false, active: true, updatedAt: "2026-04-15" },
  { id: "T-02", name: "卸先専用 (A4横)", forUse: "卸先", paperSize: "A4横", showLogo: true, showInvoice: true, showPriceBreakdown: true, showSignature: true, active: true, updatedAt: "2026-04-12" },
  { id: "T-03", name: "VIP高級紙対応", forUse: "VIP", paperSize: "A4縦", showLogo: true, showInvoice: true, showPriceBreakdown: false, showSignature: true, active: true, updatedAt: "2026-03-28" },
  { id: "T-04", name: "簡易納品書 (B5)", forUse: "個人顧客", paperSize: "B5", showLogo: false, showInvoice: false, showPriceBreakdown: true, showSignature: false, active: false, updatedAt: "2026-02-14" },
];

export default function ShipmentsDeliveryNoteTemplatePage() {
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[]>(INITIAL);
  const [selectedId, setSelectedId] = useState<string>(INITIAL[0].id);

  const selected = templates.find((t) => t.id === selectedId)!;

  const updateField = <K extends keyof Template>(key: K, value: Template[K]) => {
    setTemplates(templates.map((t) => (t.id === selectedId ? { ...t, [key]: value } : t)));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">納品書テンプレート</h1>
            <HelpHint>
              用途別（汎用・卸先・VIP・個人）の納品書レイアウトを管理します。{"\n"}
              テンプレートはPDF複数ダウンロード画面で選択して使用できます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            登録テンプレート: {templates.length} 件 ／ 有効: {templates.filter((t) => t.active).length} 件
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.show("プレビューを開きました")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
          >
            <Eye className="h-4 w-4" />プレビュー
          </button>
          <PrimaryButton onClick={() => toast.show("テンプレート設定を保存しました", "success")}>
            <Save className="h-4 w-4" />保存
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* テンプレートリスト */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">テンプレート一覧</h2>
            <button
              onClick={() => toast.show("新規テンプレート作成モーダルを開きました")}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />新規
            </button>
          </div>
          <div className="space-y-1.5">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all",
                  selectedId === t.id
                    ? "bg-blue-500/10 border-blue-300/50"
                    : "bg-white/50 border-white/40 hover:bg-white/70"
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
                <p className="text-xs text-gray-500 mt-1">
                  {t.forUse} ／ {t.paperSize} ／ 更新 {t.updatedAt}
                </p>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* 編集パネル */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-800">基本設定</h2>
              <HelpHint>テンプレート名・用途・用紙サイズを編集します。</HelpHint>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">テンプレート名</label>
                <input
                  value={selected.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">用途</label>
                <select
                  value={selected.forUse}
                  onChange={(e) => updateField("forUse", e.target.value as Template["forUse"])}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {(["汎用", "個人顧客", "卸先", "VIP"] as const).map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">用紙サイズ</label>
                <select
                  value={selected.paperSize}
                  onChange={(e) => updateField("paperSize", e.target.value as Template["paperSize"])}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {(["A4縦", "A4横", "B5", "B5横"] as const).map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">最終更新</label>
                <p className="h-9 px-3 py-2 rounded-xl text-sm bg-white/30 border border-white/40 text-gray-500">{selected.updatedAt}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-4 w-4 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-800">表示要素</h2>
              <HelpHint>納品書PDFに含める要素のON/OFFを切り替えます。</HelpHint>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Toggle label="社ロゴ画像を表示" checked={selected.showLogo} onChange={(v) => updateField("showLogo", v)} hint="ロゴ画像はシステム設定でアップロードします。" />
              <Toggle label="インボイス番号を印字" checked={selected.showInvoice} onChange={(v) => updateField("showInvoice", v)} hint="適格請求書発行事業者の登録番号を印字します。" />
              <Toggle label="金額の内訳を表示" checked={selected.showPriceBreakdown} onChange={(v) => updateField("showPriceBreakdown", v)} hint="税抜・税額・送料・手数料の明細を表示。" />
              <Toggle label="担当者印・署名欄を設置" checked={selected.showSignature} onChange={(v) => updateField("showSignature", v)} hint="BtoB卸先などで必要なケース。" />
              <Toggle label="このテンプレートを有効化" checked={selected.active} onChange={(v) => updateField("active", v)} />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">操作</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => toast.show("サンプルPDFをダウンロードしました")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
              >
                <Download className="h-4 w-4" />サンプルPDF
              </button>
              <button
                onClick={() => toast.show("テンプレートを複製しました", "success")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
              >
                <Plus className="h-4 w-4" />複製
              </button>
              <button
                onClick={() => toast.show("テンプレートを削除しました", "success")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-300/40 text-red-700 hover:bg-red-500/25"
              >
                <Trash2 className="h-4 w-4" />削除
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
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
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-blue-500 w-4 h-4" />
    </label>
  );
}
