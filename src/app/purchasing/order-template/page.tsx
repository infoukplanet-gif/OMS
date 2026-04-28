"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Save, FileText, Eye, Download, Plus, Trash2 } from "lucide-react";

type Template = {
  id: string;
  name: string;
  language: "日本語" | "English" | "中文";
  paperSize: "A4縦" | "A4横";
  showLogo: boolean;
  showInvoice: boolean;
  showSignature: boolean;
  showTaxBreakdown: boolean;
  active: boolean;
  updatedAt: string;
};

const INITIAL: Template[] = [
  { id: "T-01", name: "標準発注書", language: "日本語", paperSize: "A4縦", showLogo: true, showInvoice: true, showSignature: true, showTaxBreakdown: true, active: true, updatedAt: "2026-04-22" },
  { id: "T-02", name: "海外仕入先向け", language: "English", paperSize: "A4縦", showLogo: true, showInvoice: false, showSignature: true, showTaxBreakdown: false, active: true, updatedAt: "2026-04-15" },
  { id: "T-03", name: "中国仕入先向け", language: "中文", paperSize: "A4縦", showLogo: true, showInvoice: false, showSignature: true, showTaxBreakdown: false, active: true, updatedAt: "2026-04-10" },
  { id: "T-04", name: "簡易版", language: "日本語", paperSize: "A4横", showLogo: false, showInvoice: false, showSignature: false, showTaxBreakdown: true, active: false, updatedAt: "2026-03-20" },
];

export default function PurchasingOrderTemplatePage() {
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[]>(INITIAL);
  const [selectedId, setSelectedId] = useState<string>(INITIAL[0].id);

  const selected = templates.find((t) => t.id === selectedId)!;
  const update = <K extends keyof Template>(key: K, value: Template[K]) => setTemplates(templates.map((t) => (t.id === selectedId ? { ...t, [key]: value } : t)));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">発注書テンプレート設定</h1>
            <HelpHint>
              発注書PDFのレイアウト・言語・帳票要素を仕入先タイプ別に管理します。{"\n"}
              海外仕入先向けには英語/中国語テンプレートが利用できます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">登録: {templates.length} 件 ／ 有効: {templates.filter((t) => t.active).length} 件</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast.show("プレビューを開きました")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
            <Eye className="h-4 w-4" />プレビュー
          </button>
          <PrimaryButton onClick={() => toast.show("発注書テンプレートを保存しました", "success")}>
            <Save className="h-4 w-4" />保存
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">テンプレート一覧</h2>
            <button onClick={() => toast.show("新規テンプレートを作成")} className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />新規
            </button>
          </div>
          <div className="space-y-1.5">
            {templates.map((t) => (
              <button key={t.id} onClick={() => setSelectedId(t.id)} className={cn("w-full text-left p-3 rounded-xl border transition-all", selectedId === t.id ? "bg-blue-500/10 border-blue-300/50" : "bg-white/50 border-white/40 hover:bg-white/70")}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{t.name}</span>
                  {t.active ? <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-500/15 text-emerald-700">有効</span> : <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-gray-500/15 text-gray-600">無効</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t.language} ／ {t.paperSize}</p>
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="lg:col-span-2 space-y-4">
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-800">基本設定</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">テンプレート名</label><input value={selected.name} onChange={(e) => update("name", e.target.value)} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">言語</label><select value={selected.language} onChange={(e) => update("language", e.target.value as Template["language"])} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">{(["日本語", "English", "中文"] as const).map((o) => <option key={o}>{o}</option>)}</select></div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">用紙サイズ</label><select value={selected.paperSize} onChange={(e) => update("paperSize", e.target.value as Template["paperSize"])} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">{(["A4縦", "A4横"] as const).map((o) => <option key={o}>{o}</option>)}</select></div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">最終更新</label><p className="h-9 px-3 py-2 rounded-xl text-sm bg-white/30 border border-white/40 text-gray-500">{selected.updatedAt}</p></div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-gray-800">表示要素</h2>
              <HelpHint>発注書PDFに含める要素のON/OFFを切り替えます。</HelpHint>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Toggle label="社ロゴ画像を表示" checked={selected.showLogo} onChange={(v) => update("showLogo", v)} />
              <Toggle label="インボイス番号を印字" checked={selected.showInvoice} onChange={(v) => update("showInvoice", v)} hint="海外仕入先には不要なケースが多いです。" />
              <Toggle label="社印・担当者印欄" checked={selected.showSignature} onChange={(v) => update("showSignature", v)} />
              <Toggle label="税内訳を表示" checked={selected.showTaxBreakdown} onChange={(v) => update("showTaxBreakdown", v)} hint="海外取引では税表記が異なるためOFF推奨。" />
              <Toggle label="このテンプレートを有効化" checked={selected.active} onChange={(v) => update("active", v)} />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-semibold text-gray-800">操作</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => toast.show("サンプルPDFをダウンロード")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
                <Download className="h-4 w-4" />サンプルPDF
              </button>
              <button onClick={() => toast.show("テンプレートを複製しました", "success")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
                <Plus className="h-4 w-4" />複製
              </button>
              <button onClick={() => toast.show("テンプレートを削除しました", "success")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-300/40 text-red-700 hover:bg-red-500/25">
                <Trash2 className="h-4 w-4" />削除
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
      <span className="flex items-center gap-1.5">{label}{hint && <HelpHint side="right">{hint}</HelpHint>}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-blue-500 w-4 h-4" />
    </label>
  );
}
