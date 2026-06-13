"use client";

import { useMemo, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Copy, Edit, Eye, FileText, Plus, Search, Star, Trash2, X } from "lucide-react";

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

const INITIAL: Template[] = [
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

const EMPTY_TEMPLATE: Omit<Template, "id"> = {
  name: "",
  type: "納品書",
  paperSize: "A4縦",
  shop: "全店舗共通",
  isDefault: false,
  usage: 0,
  lastUpdated: "",
  enabled: true,
  description: "",
};

const SHOPS = ["全店舗共通", "本店", "楽天店", "Yahoo!店", "Amazon店", "au PAY マーケット店"];

function TemplateModal({
  template,
  onSave,
  onClose,
}: {
  template: Template | null;
  onSave: (t: Template) => void;
  onClose: () => void;
}) {
  const isEdit = template !== null;
  const [form, setForm] = useState<Template>(() =>
    template ?? { ...EMPTY_TEMPLATE, id: `t-${Date.now()}` }
  );
  const set = (patch: Partial<Template>) => setForm((prev) => ({ ...prev, ...patch }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-xl mx-4">
        <GlassCard className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/40 bg-white/30">
            <h2 className="text-base font-semibold text-gray-800">{isEdit ? "テンプレートを編集" : "テンプレートを新規追加"}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/60 text-gray-400">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">テンプレート名 <span className="text-red-500">*必須</span></label>
              <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="例: 卸売向け出荷指示書" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">種別</label>
                <select value={form.type} onChange={(e) => set({ type: e.target.value as Template["type"] })} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  {Object.keys(typeBadge).map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">用紙サイズ</label>
                <select value={form.paperSize} onChange={(e) => set({ paperSize: e.target.value as Template["paperSize"] })} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  {(["A4縦", "A4横", "A5", "A6", "ハガキ", "サーマル76mm", "サーマル100mm"] as Template["paperSize"][]).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">適用店舗</label>
                <select value={form.shop} onChange={(e) => set({ shop: e.target.value })} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  {SHOPS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="rounded accent-blue-500" />
                  <span className="text-sm text-gray-700">有効</span>
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">説明</label>
              <input value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="テンプレートの用途・特徴" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div className="px-5 py-3 border-t border-white/40 bg-white/30 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
            <button onClick={() => onSave(form)} className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">
              {isEdit ? "更新" : "追加"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

const PREVIEW_ROWS = [
  { code: "AP-1024", name: "オーガニックコットンT 白 M", qty: 2, price: 2480 },
  { code: "AP-2210", name: "リネンワイドパンツ ベージュ L", qty: 1, price: 5980 },
  { code: "AC-0087", name: "本革ミニ財布 キャメル", qty: 1, price: 8800 },
];

function TemplatePreviewModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const subtotal = PREVIEW_ROWS.reduce((s, r) => s + r.qty * r.price, 0);
  const tax = Math.round(subtotal * 0.1);
  const showAmount = template.type !== "ピッキングリスト" && !template.name.includes("金額非表示");
  const isInvoice = template.type === "請求書" || template.type === "見積書";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-800 inline-flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />プレビュー
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{template.name}（{template.paperSize}）</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/60 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 紙面プレビュー */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-inner p-6 text-gray-800">
          <div className="flex items-start justify-between border-b-2 border-gray-800 pb-3 mb-4">
            <div>
              <div className="text-xl font-bold tracking-wide">{template.type}</div>
              <div className="text-xs text-gray-500 mt-1">発行日: 2026/06/13　No. SAMPLE-0001</div>
            </div>
            <div className="text-right text-xs text-gray-600">
              <div className="font-semibold text-sm text-gray-800">サンプル商店 株式会社</div>
              <div>〒100-0001 東京都千代田区1-1-1</div>
              <div>TEL: 03-0000-0000</div>
              {isInvoice && <div className="mt-1">登録番号: T1234567890123</div>}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm font-semibold border-b border-gray-300 pb-1 mb-1 inline-block">サンプル 太郎 様</div>
            <div className="text-xs text-gray-500">〒150-0002 東京都渋谷区サンプル2-3-4</div>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-300">
                <th className="text-left px-2 py-1.5 font-medium">商品コード</th>
                <th className="text-left px-2 py-1.5 font-medium">商品名</th>
                <th className="text-right px-2 py-1.5 font-medium">数量</th>
                {showAmount && <th className="text-right px-2 py-1.5 font-medium">単価</th>}
                {showAmount && <th className="text-right px-2 py-1.5 font-medium">金額</th>}
              </tr>
            </thead>
            <tbody>
              {PREVIEW_ROWS.map((r) => (
                <tr key={r.code} className="border-b border-gray-200">
                  <td className="px-2 py-1.5 font-mono">{r.code}</td>
                  <td className="px-2 py-1.5">{r.name}</td>
                  <td className="px-2 py-1.5 text-right">{r.qty}</td>
                  {showAmount && <td className="px-2 py-1.5 text-right">¥{r.price.toLocaleString()}</td>}
                  {showAmount && <td className="px-2 py-1.5 text-right">¥{(r.qty * r.price).toLocaleString()}</td>}
                </tr>
              ))}
            </tbody>
          </table>

          {showAmount && (
            <div className="flex justify-end mt-3">
              <div className="w-48 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">小計</span><span>¥{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">消費税(10%)</span><span>¥{tax.toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-gray-300 pt-1 font-bold text-sm"><span>合計</span><span>¥{(subtotal + tax).toLocaleString()}</span></div>
              </div>
            </div>
          )}

          {template.type === "送り状" && (
            <div className="mt-4 flex items-center gap-3 border border-gray-300 rounded p-3">
              <div className="h-10 w-28 bg-[repeating-linear-gradient(90deg,#111_0_2px,transparent_2px_4px)]" aria-hidden />
              <div className="text-xs text-gray-600">お問い合わせ伝票番号: 0000-1111-2222</div>
            </div>
          )}

          {template.type === "ピッキングリスト" && (
            <div className="mt-3 text-xs text-gray-500">ロケーション順ソート / バーコードスキャン対応</div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div>用紙: <span className="text-gray-800">{template.paperSize}</span></div>
          <div>対象店舗: <span className="text-gray-800">{template.shop}</span></div>
          <div>使用回数: <span className="text-gray-800">{template.usage.toLocaleString()}</span></div>
          <div>最終更新: <span className="text-gray-800">{template.lastUpdated || "—"}</span></div>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">※ サンプルデータによる表示イメージです。実際の帳票は受注内容に応じて出力されます。</p>

        <div className="flex justify-end mt-4">
          <SecondaryButton onClick={onClose}>閉じる</SecondaryButton>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const toast = useToast();
  const [items, setItems] = useState<Template[]>(INITIAL);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [shopFilter, setShopFilter] = useState("all");
  // false = closed, null = new, Template = editing
  const [modalTarget, setModalTarget] = useState<Template | null | false>(false);
  const [previewTarget, setPreviewTarget] = useState<Template | null>(null);

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

  const dupSeq = useRef(0);
  const handleDuplicate = (t: Template) => {
    dupSeq.current += 1;
    const newItem: Template = { ...t, id: `t-copy-${dupSeq.current}`, name: `${t.name}（複製）`, isDefault: false, usage: 0 };
    setItems((prev) => [...prev, newItem]);
    toast.show(`「${t.name}」を複製しました`, "success");
  };

  const handleSave = (t: Template) => {
    if (!t.name.trim()) { toast.show("テンプレート名は必須です", "error"); return; }
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      if (idx >= 0) return prev.map((x) => (x.id === t.id ? t : x));
      return [...prev, { ...t, lastUpdated: new Date().toLocaleDateString("ja-JP").replace(/\//g, "/") }];
    });
    toast.show(modalTarget !== null ? `「${t.name}」を更新しました` : `「${t.name}」を追加しました`, "success");
    setModalTarget(false);
  };

  return (
    <div className="space-y-5">
      {modalTarget !== false && (
        <TemplateModal template={modalTarget} onSave={handleSave} onClose={() => setModalTarget(false)} />
      )}

      {previewTarget && (
        <TemplatePreviewModal template={previewTarget} onClose={() => setPreviewTarget(null)} />
      )}

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">帳票テンプレート設定</h1>
            <HelpHint>納品書・送り状・出荷指示書など、印刷帳票のテンプレートを管理します。種類ごとに既定テンプレートを設定可能です。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">店舗別・用紙サイズ別にテンプレートを管理し、出荷フローで自動選択します。</p>
        </div>
        <PrimaryButton onClick={() => setModalTarget(null)}>
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
              <button onClick={() => setPreviewTarget(t)} className="flex-1 px-2 py-1.5 rounded-lg text-xs text-gray-700 bg-white/60 border border-white/50 hover:bg-white/80 inline-flex items-center justify-center gap-1">
                <Eye className="h-3 w-3" />プレビュー
              </button>
              <button onClick={() => setModalTarget(t)} className="flex-1 px-2 py-1.5 rounded-lg text-xs text-blue-700 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 inline-flex items-center justify-center gap-1">
                <Edit className="h-3 w-3" />編集
              </button>
              <button onClick={() => handleDuplicate(t)} className="px-2 py-1.5 rounded-lg text-xs text-gray-700 bg-white/60 border border-white/50 hover:bg-white/80" title="複製">
                <Copy className="h-3 w-3" />
              </button>
              {!t.isDefault && (
                <button onClick={() => { setDefault(t.id, t.type); toast.show(`「${t.name}」を既定に設定`, "success"); }} className="px-2 py-1.5 rounded-lg text-xs text-amber-700 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25" title="既定に設定">
                  <Star className="h-3 w-3" />
                </button>
              )}
              <button onClick={() => { setItems((p) => p.filter((x) => x.id !== t.id)); toast.show("テンプレートを削除しました", "info"); }} disabled={t.isDefault} className="px-2 py-1.5 rounded-lg text-xs bg-red-500/15 text-red-700 hover:bg-red-500/25 disabled:opacity-30 disabled:cursor-not-allowed" title="削除">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
