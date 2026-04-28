"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Save, FileText, Eye, Download, Plus, Trash2, Barcode, Truck } from "lucide-react";

type Template = {
  id: string;
  name: string;
  forWarehouse: "本社倉庫" | "外部委託" | "楽天スーパーロジ" | "汎用";
  paperSize: "A4縦" | "A4横" | "ピッキングリスト形式";
  showBarcode: boolean;
  showLocation: boolean;
  showLot: boolean;
  showSetSplit: boolean;
  active: boolean;
  updatedAt: string;
};

const INITIAL: Template[] = [
  { id: "I-01", name: "本社倉庫 標準", forWarehouse: "本社倉庫", paperSize: "A4縦", showBarcode: true, showLocation: true, showLot: true, showSetSplit: true, active: true, updatedAt: "2026-04-22" },
  { id: "I-02", name: "外部委託 簡易版", forWarehouse: "外部委託", paperSize: "A4縦", showBarcode: true, showLocation: false, showLot: false, showSetSplit: true, active: true, updatedAt: "2026-04-18" },
  { id: "I-03", name: "楽天スーパーロジ連携", forWarehouse: "楽天スーパーロジ", paperSize: "ピッキングリスト形式", showBarcode: true, showLocation: true, showLot: false, showSetSplit: false, active: true, updatedAt: "2026-04-15" },
  { id: "I-04", name: "汎用ピッキング", forWarehouse: "汎用", paperSize: "A4横", showBarcode: false, showLocation: true, showLot: true, showSetSplit: true, active: false, updatedAt: "2026-03-30" },
];

export default function ShipmentsInstructionTemplatePage() {
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
            <h1 className="text-2xl font-bold text-gray-800">出荷指示書テンプレート設定</h1>
            <HelpHint>
              倉庫向けの出荷指示書（ピッキングリスト）レイアウトを管理します。{"\n"}
              バーコード・ロケ番号・ロット・セット分割の表示有無を倉庫別にカスタマイズできます。
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
                  selectedId === t.id ? "bg-blue-500/10 border-blue-300/50" : "bg-white/50 border-white/40 hover:bg-white/70"
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
                <p className="text-xs text-gray-500 mt-1">{t.forWarehouse} ／ {t.paperSize}</p>
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
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">テンプレート名</label>
                <input
                  value={selected.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">対応倉庫</label>
                <select
                  value={selected.forWarehouse}
                  onChange={(e) => updateField("forWarehouse", e.target.value as Template["forWarehouse"])}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {(["汎用", "本社倉庫", "外部委託", "楽天スーパーロジ"] as const).map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">用紙サイズ</label>
                <select
                  value={selected.paperSize}
                  onChange={(e) => updateField("paperSize", e.target.value as Template["paperSize"])}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {(["A4縦", "A4横", "ピッキングリスト形式"] as const).map((o) => <option key={o}>{o}</option>)}
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
              <Barcode className="h-4 w-4 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-800">表示要素</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Toggle label="バーコード（SKU/受注）を表示" checked={selected.showBarcode} onChange={(v) => updateField("showBarcode", v)} hint="バーコード検品で使うために必須となるケースが多いです。" />
              <Toggle label="ロケーション番号を表示" checked={selected.showLocation} onChange={(v) => updateField("showLocation", v)} hint="本社倉庫のように棚番管理している場合にON。" />
              <Toggle label="ロット番号を表示" checked={selected.showLot} onChange={(v) => updateField("showLot", v)} hint="食品・化粧品など、ロット管理が必要な業態で使用。" />
              <Toggle label="セット分割明細を表示" checked={selected.showSetSplit} onChange={(v) => updateField("showSetSplit", v)} hint="セット商品の構成品ごとにピッキング指示を分けます。" />
              <Toggle label="このテンプレートを有効化" checked={selected.active} onChange={(v) => updateField("active", v)} />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-4 w-4 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-800">操作</h2>
            </div>
            <div className="flex flex-wrap gap-2">
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
