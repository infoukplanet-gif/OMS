"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Save, Settings2, ImageIcon, Bell, History, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

type Rule = {
  id: string;
  name: string;
  source: string;
  enabled: boolean;
  lastRun: string;
  count: number;
  duplicates: number;
};

const INITIAL_RULES: Rule[] = [
  { id: "R-01", name: "楽天→商品マスタ自動作成", source: "楽天市場", enabled: true, lastRun: "2026-04-25 09:00", count: 12, duplicates: 3 },
  { id: "R-02", name: "Yahoo→商品マスタ自動作成", source: "Yahoo!ショッピング", enabled: true, lastRun: "2026-04-25 09:00", count: 5, duplicates: 1 },
  { id: "R-03", name: "Amazon→商品マスタ自動作成", source: "Amazon", enabled: false, lastRun: "2026-04-10 09:00", count: 0, duplicates: 0 },
  { id: "R-04", name: "自社EC→商品マスタ自動作成", source: "自社EC（Shopify）", enabled: true, lastRun: "2026-04-25 09:00", count: 3, duplicates: 0 },
  { id: "R-05", name: "卸先EDI→商品マスタ自動作成", source: "卸先EDI", enabled: false, lastRun: "—", count: 0, duplicates: 0 },
];

const HISTORY = [
  { id: 1, at: "2026-04-25 09:00", source: "楽天市場", created: 12, skipped: 3, status: "正常" },
  { id: 2, at: "2026-04-25 09:00", source: "Yahoo!ショッピング", created: 5, skipped: 1, status: "正常" },
  { id: 3, at: "2026-04-25 09:00", source: "自社EC（Shopify）", created: 3, skipped: 0, status: "正常" },
  { id: 4, at: "2026-04-24 09:00", source: "楽天市場", created: 8, skipped: 2, status: "正常" },
  { id: 5, at: "2026-04-23 09:00", source: "楽天市場", created: 0, skipped: 0, status: "失敗" },
];

export default function ProductAutoCreatePage() {
  const toast = useToast();
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
  const [autoDetect, setAutoDetect] = useState(true);
  const [downloadImage, setDownloadImage] = useState(true);
  const [notifyAdmin, setNotifyAdmin] = useState(false);
  const [skipConflict, setSkipConflict] = useState(true);
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [defaultMargin, setDefaultMargin] = useState(30);

  const toggleRule = (id: string) => setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">商品情報自動作成</h1>
            <HelpHint>
              受注取込時に未登録の商品を検出したら、モール情報から自動的に商品マスタを作成します。{"\n"}
              画像・カテゴリ・原価マージンも自動補完できます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            有効ルール: <span className="font-semibold text-emerald-700">{rules.filter((r) => r.enabled).length}</span> ／ 今月作成数:{" "}
            <span className="font-semibold">{rules.reduce((s, r) => s + r.count, 0)}件</span>
          </p>
        </div>
        <PrimaryButton onClick={() => toast.show("自動作成設定を保存しました", "success")}>
          <Save className="h-4 w-4" />設定を保存
        </PrimaryButton>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">グローバル設定</h2>
          <HelpHint>すべての自動作成ルールに共通する基本設定です。</HelpHint>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Toggle label="未登録商品を自動検出する" checked={autoDetect} onChange={setAutoDetect} hint="OFFの場合、未登録商品は受注エラー扱いとなります。" />
          <Toggle label="商品画像を自動ダウンロード" checked={downloadImage} onChange={setDownloadImage} hint="モール公開画像をローカル保存します。" />
          <Toggle label="作成時に管理者へ通知メール送信" checked={notifyAdmin} onChange={setNotifyAdmin} />
          <Toggle label="既存コードと衝突する場合はスキップ" checked={skipConflict} onChange={setSkipConflict} hint="OFFの場合、既存マスタを上書きします。" />
          <Toggle label="モールカテゴリから自社カテゴリへ自動マッピング" checked={autoCategorize} onChange={setAutoCategorize} hint="カテゴリマッピングマスタを使用します。" />
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              デフォルト原価率
              <HelpHint side="right">原価が取得できないモールでは、販売価格 × (1 - 原価率) を原価として設定します。</HelpHint>
            </label>
            <div className="relative">
              <input
                type="number"
                value={defaultMargin}
                onChange={(e) => setDefaultMargin(Number(e.target.value))}
                className="w-full h-9 px-3 pr-10 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">取得元別ルール</h2>
          <HelpHint>各モール・チャネルごとに自動作成のON/OFFを切り替えられます。</HelpHint>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ルール名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">取得元</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">最終実行</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">作成件数</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">スキップ</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{r.source}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleRule(r.id)}
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                        r.enabled ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25" : "bg-gray-400/15 text-gray-500 hover:bg-gray-400/25"
                      )}
                    >
                      {r.enabled ? "有効" : "無効"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.lastRun}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">{r.count}</td>
                  <td className={cn("px-4 py-3 text-right tabular-nums text-xs", r.duplicates > 0 ? "text-amber-700" : "text-gray-400")}>{r.duplicates}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toast.show(`${r.name} の詳細設定を開きました`)}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                    >
                      設定
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">実行履歴</h2>
          <HelpHint>過去のバッチ実行ログ。失敗時は詳細から原因を確認できます。</HelpHint>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">日時</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">取得元</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">作成</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">スキップ</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">結果</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h) => (
                <tr key={h.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2 text-xs text-gray-700 tabular-nums">{h.at}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{h.source}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{h.created}</td>
                  <td className={cn("px-3 py-2 text-right tabular-nums", h.skipped > 0 ? "text-amber-700" : "text-gray-400")}>{h.skipped}</td>
                  <td className="px-3 py-2 text-center">
                    {h.status === "正常" ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />正常
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-700">
                        <AlertTriangle className="h-3 w-3" />失敗
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">自動補完される項目</h2>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          {[
            "商品コード（モール商品IDから生成）",
            "商品名・サブタイトル・カナ",
            "商品画像（メイン＋サブ最大5枚）",
            "販売価格（モール価格を初期値）",
            "原価（販売価格×デフォルト原価率）",
            "重量・サイズ（モールから取得可能な場合）",
            "JANコード／メーカーコード",
            "カテゴリ（カテゴリマッピングを使用）",
            "在庫定数・発注点（システム既定値）",
            "課税区分（モール設定をそのまま継承）",
          ].map((s) => (
            <li key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50">
              <RefreshCw className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </GlassCard>
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
