"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Copy, Edit, Eye, FileText, MoreHorizontal, Plus, Search, Star, Trash2 } from "lucide-react";

type Template = {
  id: string;
  name: string;
  type: "納品書" | "出荷指示書" | "ピッキングリスト" | "送り状" | "請求書" | "見積書";
  paperSize: "A4縦" | "A4横" | "A5" | "A6" | "ハガキ" | "サーマル76mm" | "サーマル100mm";
  shop: string;
  isDefault: boolean;
  usage: number;
  lastUpdated: string;
  enabled: boolean;
  description: string;
};

const initial: Template[] = [
  { id: "t-001", name: "標準納品書（A4縦）", type: "納品書", paperSize: "A4縦", shop: "全店舗共通", isDefault: true, usage: 1245, lastUpdated: "2026/04/01", enabled: true, description: "通常の宅配伝票同梱用納品書" },
  { id: "t-002", name: "卸売向け納品書", type: "納品書", paperSize: "A4縦", shop: "本店", isDefault: false, usage: 56, lastUpdated: "2026/03/15", enabled: true, description: "卸先用、税抜表示・取引区分明記" },
  { id: "t-003", name: "ギフト用納品書（金額非表示）", type: "納品書", paperSize: "A5", shop: "全店舗共通", isDefault: false, usage: 320, lastUpdated: "2026/02/20", enabled: true, description: "ギフト発送時の金額レス納品書" },
  { id: "t-004", name: "出荷指示書A", type: "出荷指示書", paperSize: "A4横", shop: "全店舗共通", isDefault: true, usage: 890, lastUpdated: "2026/03/28", enabled: true, description: "標準フォーマット、QRコード付き" },
  { id: "t-005", name: "簡易出荷指示", type: "出荷指示書", paperSize: "A5", shop: "全店舗共通", isDefault: false, usage: 234, lastUpdated: "2026/03/10", enabled: true, description: "メール便用簡易版" },
  { id: "t-006", name: "ピッキングリスト（ロケーション順）", type: "ピッキングリスト", paperSize: "A4縦", shop: "全店舗共通", isDefault: true, usage: 720, lastUpdated: "2026/04/10", enabled: true, description: "倉庫ロケ順にソート、バーコード付き" },
  { id: "t-007", name: "ヤマト送り状（B2クラウド）", type: "送り状", paperSize: "A6", shop: "全店舗共通", isDefault: true, usage: 4520, lastUpdated: "2026/04/05", enabled: true, description: "ヤマトB2クラウド連携用" },
  { id: "t-008", name: "佐川e飛伝送り状", type: "送り状", paperSize: "A6", shop: "全店舗共通", isDefault: false, usage: 1240, lastUpdated: "2026/04/03", enabled: true, description: "佐川急便e飛伝専用フォーマット" },
  { id: "t-009", name: "請求書（インボイス対応）", type: "請求書", paperSize: "A4縦", shop: "本店", isDefault: true, usage: 124, lastUpdated: "2026/04/01", enabled: true, description: "適格請求書発行事業者番号入り" },
  { id: "t-010", name: "見積書（標準）", type: "見積書", paperSize: "A4縦", shop: "本店", isDefault: true, usage: 88, lastUpdated: "2026/03/20", enabled: true, description: "見積有効期限・条件入り" },
];

const typeBadge: Record<string, string> = {
  納品書: "bg-blue-500/15 text-blue-700",
  出荷指示書: "bg-violet-500/15 text-violet-700",
  ピッキングリスト: "bg-emerald-500/15 text-emerald-700",
  送り状: "bg-orange-500/15 text-orange-700",
  請求書: "bg-rose-500/15 text-rose-700",
  見積書: "bg-amber-500/15 text-amber-700",
};

export default function TemplatesPage() {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [shopFilter, setShopFilter] = useState("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((t) => {
      if (k && !`${t.name} ${t.description}`.toLowerCase().includes(k)) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (shopFilter !== "all" && t.shop !== shopFilter && t.shop !== "全店舗共通") return false;
      return true;
    });
  }, [items, keyword, typeFilter, shopFilter]);

  const shops = Array.from(new Set(items.map((i) => i.shop)));
  const setDefault = (id: string, type: string) =>
    setItems((prev) => prev.map((t) => (t.type === type ? { ...t, isDefault: t.id === id } : t)));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">帳票テンプレート設定</h1>
            <HelpHint>納品書・送り状・出荷指示書など、印刷帳票のテンプレートを管理します。種類ごとに既定テンプレートを設定可能です。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">店舗別・用紙サイズ別にテンプレートを管理し、出荷フローで自動選択します。</p>
        </div>
        <PrimaryButton onClick={() => toast.show("新規テンプレートを追加します", "info")}>
          <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />新規テンプレート</span>
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録テンプレート</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">有効</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.filter((i) => i.enabled).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">既定設定</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{items.filter((i) => i.isDefault).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">月間印刷回数</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">{items.reduce((s, i) => s + i.usage, 0).toLocaleString()}</div>
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
              placeholder="テンプレート名・説明"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">種別: すべて</option>
            {Object.keys(typeBadge).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">店舗: すべて</option>
            {shops.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setTypeFilter("all"); setShopFilter("all"); }}>クリア</SecondaryButton>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <GlassCard key={t.id} className={cn("hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-shadow", !t.enabled && "opacity-60")}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="font-medium text-gray-800">{t.name}</h3>
                    {t.isDefault && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                </div>
              </div>
              <button className="p-1 rounded-lg hover:bg-white/60 text-gray-400">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={cn("px-2 py-0.5 rounded-md font-medium", typeBadge[t.type])}>{t.type}</span>
              <span className="px-2 py-0.5 rounded-md bg-white/60 text-gray-600">{t.paperSize}</span>
              <span className="px-2 py-0.5 rounded-md bg-white/60 text-gray-600">{t.shop}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
              <span>印刷実績: <span className="text-gray-800 font-medium">{t.usage.toLocaleString()} 回</span></span>
              <span>更新: {t.lastUpdated}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => toast.show(`${t.name} をプレビューします`, "info")} className="flex-1 px-2 py-1.5 rounded-lg text-xs text-gray-700 bg-white/60 border border-white/50 hover:bg-white/80 inline-flex items-center justify-center gap-1">
                <Eye className="h-3 w-3" />プレビュー
              </button>
              <button onClick={() => toast.show(`${t.name} を編集します`, "info")} className="flex-1 px-2 py-1.5 rounded-lg text-xs text-blue-700 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 inline-flex items-center justify-center gap-1">
                <Edit className="h-3 w-3" />編集
              </button>
              <button onClick={() => toast.show(`${t.name} を複製しました`, "success")} className="px-2 py-1.5 rounded-lg text-xs text-gray-700 bg-white/60 border border-white/50 hover:bg-white/80">
                <Copy className="h-3 w-3" />
              </button>
              {!t.isDefault && (
                <button onClick={() => { setDefault(t.id, t.type); toast.show(`${t.name} を既定に設定`, "success"); }} className="px-2 py-1.5 rounded-lg text-xs text-amber-700 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25" title="既定に設定">
                  <Star className="h-3 w-3" />
                </button>
              )}
              <button onClick={() => { setItems((p) => p.filter((x) => x.id !== t.id)); toast.show("テンプレートを削除しました", "info"); }} disabled={t.isDefault} className="px-2 py-1.5 rounded-lg text-xs bg-red-500/15 text-red-700 hover:bg-red-500/25 disabled:opacity-30 disabled:cursor-not-allowed">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
