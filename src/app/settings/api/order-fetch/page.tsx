"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Loader2, Pause, Play, RefreshCw, Save, Search, Settings, X } from "lucide-react";

const nowStamp = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `2026/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

type Channel = {
  id: string;
  name: string;
  endpoint: string;
  schedule: string;
  lastRun: string;
  lastCount: number;
  total24h: number;
  errorCount: number;
  status: "ok" | "warning" | "error" | "disabled";
  shop: string;
  authExpires: string;
};

const initial: Channel[] = [
  { id: "rakuten", name: "楽天市場 受注取得API", endpoint: "/api/rakuten/orders", schedule: "15分間隔", lastRun: "2026/04/30 10:30", lastCount: 12, total24h: 245, errorCount: 0, status: "ok", shop: "楽天店", authExpires: "2026/12/31" },
  { id: "yahoo", name: "Yahoo!ショッピング 受注取得API", endpoint: "/api/yahoo/orders", schedule: "15分間隔", lastRun: "2026/04/30 10:30", lastCount: 5, total24h: 88, errorCount: 0, status: "ok", shop: "Yahoo!店", authExpires: "2026/10/15" },
  { id: "amazon", name: "Amazon 受注取得API", endpoint: "/api/amazon/orders", schedule: "30分間隔", lastRun: "2026/04/30 10:15", lastCount: 8, total24h: 124, errorCount: 1, status: "warning", shop: "Amazon店", authExpires: "2026/06/30" },
  { id: "shopify", name: "Shopify 自社EC 受注取得", endpoint: "/api/shopify/orders", schedule: "Webhookリアルタイム", lastRun: "2026/04/30 10:42", lastCount: 1, total24h: 980, errorCount: 0, status: "ok", shop: "本店", authExpires: "—" },
  { id: "aupay", name: "au PAY マーケット 受注取得API", endpoint: "/api/aupay/orders", schedule: "30分間隔", lastRun: "—", lastCount: 0, total24h: 0, errorCount: 0, status: "disabled", shop: "au PAY マーケット店", authExpires: "—" },
  { id: "qoo10", name: "Qoo10 受注取得API", endpoint: "/api/qoo10/orders", schedule: "60分間隔", lastRun: "2026/04/29 23:00", lastCount: 0, total24h: 12, errorCount: 4, status: "error", shop: "Qoo10店", authExpires: "2026/05/15" },
];

const sb: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-700",
  warning: "bg-amber-500/15 text-amber-700",
  error: "bg-red-500/15 text-red-700",
  disabled: "bg-gray-500/15 text-gray-500",
};
const sbLabel: Record<string, string> = { ok: "正常", warning: "警告", error: "エラー", disabled: "無効" };

export default function OrderFetchApiPage() {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Channel["status"]>("all");

  const [defaultInterval, setDefaultInterval] = useState("15分");
  const [dedupKey, setDedupKey] = useState("受注番号＋モール");
  const [retryMax, setRetryMax] = useState("3");
  const [retryInterval, setRetryInterval] = useState("5");
  const [notifyEmail, setNotifyEmail] = useState("admin@example.com");
  const [lookbackDays, setLookbackDays] = useState("7");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((c) => {
      if (k && !`${c.name} ${c.endpoint} ${c.shop}`.toLowerCase().includes(k)) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      return true;
    });
  }, [items, keyword, statusFilter]);

  const toggle = (id: string) =>
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status: c.status === "disabled" ? "ok" : "disabled" } : c)));

  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [modalChannel, setModalChannel] = useState<Channel | null>(null);

  const runAllChannels = () => {
    if (running) return;
    setRunning(true);
    setTimeout(() => {
      const stamp = nowStamp();
      setItems((prev) =>
        prev.map((c) => (c.status === "disabled" ? c : { ...c, lastRun: stamp })),
      );
      setRunning(false);
      toast.show("全チャネルの受注取得を実行しました", "success");
    }, 1200);
  };

  const runChannel = (id: string) => {
    const stamp = nowStamp();
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, lastRun: stamp } : c)));
    const target = items.find((c) => c.id === id);
    toast.show(`${target?.name ?? "チャネル"} を手動実行しました`, "success");
  };

  const handleSave = () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      toast.show("API共通設定を保存しました", "success");
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">受注取得API処理</h1>
            <HelpHint>各モールの受注APIから定期的に受注データを取得・取込します。取得間隔・リトライ・重複検出ポリシーを設定できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">楽天・Yahoo!・Amazon・Shopify等から自動的に受注を取込み、OMSで一元管理。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={runAllChannels} disabled={running}>
            <span className="inline-flex items-center gap-1.5">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {running ? "実行中…" : "全チャネル実行"}
            </span>
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving}>
            <span className="inline-flex items-center gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saving ? "保存中…" : saved ? "保存済" : "保存"}
            </span>
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録チャネル</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">有効 {items.filter((i) => i.status !== "disabled").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">24時間取得</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{items.reduce((s, i) => s + i.total24h, 0).toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-0.5">受注件数</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">エラー件数</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{items.reduce((s, i) => s + i.errorCount, 0)}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">直近実行</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">10:42</div>
          <div className="text-xs text-gray-500 mt-0.5">Shopify Webhook</div>
        </GlassCard>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">
          共通設定 <HelpHint>各チャネルの個別設定がない場合のデフォルト値。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">取得間隔（デフォルト）</span>
            <select value={defaultInterval} onChange={(e) => setDefaultInterval(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["5分", "15分", "30分", "60分", "Webhookリアルタイム"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">受注番号重複検出</span>
            <select value={dedupKey} onChange={(e) => setDedupKey(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["受注番号", "受注番号＋モール", "受注番号＋店舗"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">リトライ回数</span>
            <input type="number" value={retryMax} onChange={(e) => setRetryMax(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">リトライ間隔（分）</span>
            <input type="number" value={retryInterval} onChange={(e) => setRetryInterval(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">取得失敗時の通知先</span>
            <input type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">過去何日分を取得</span>
            <input type="number" value={lookbackDays} onChange={(e) => setLookbackDays(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="API名・エンドポイント・店舗"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">状態: すべて</option>
            <option value="ok">正常</option>
            <option value="warning">警告</option>
            <option value="error">エラー</option>
            <option value="disabled">無効</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setStatusFilter("all"); }}>クリア</SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {items.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">API名</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">店舗</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">エンドポイント</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">スケジュール</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">最終実行</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">前回件数</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">24h合計</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">エラー</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">認証期限</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-medium text-gray-800">{c.name}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{c.shop}</td>
                <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{c.endpoint}</td>
                <td className="px-3 py-2.5 text-gray-700 text-xs">{c.schedule}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{c.lastRun}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{c.lastCount}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-blue-700">{c.total24h.toLocaleString()}</td>
                <td className={cn("px-3 py-2.5 text-right tabular-nums text-xs", c.errorCount > 0 ? "text-red-600 font-medium" : "text-gray-400")}>{c.errorCount}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{c.authExpires}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[c.status])}>
                    {c.status === "ok" && <CheckCircle2 className="h-3 w-3" />}
                    {c.status === "error" && <AlertCircle className="h-3 w-3" />}
                    {sbLabel[c.status]}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setModalChannel(c)} className="p-1.5 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25" title="設定">
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => runChannel(c.id)} className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25" title="手動実行">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { toggle(c.id); toast.show(c.status === "disabled" ? `${c.name} を有効化` : `${c.name} を一時停止`, "info"); }} className="p-1.5 rounded-lg bg-gray-500/10 text-gray-700 hover:bg-gray-500/20" title="切替">
                      {c.status === "disabled" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {modalChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setModalChannel(null)}>
          <div
            className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-800">{modalChannel.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{modalChannel.shop}</p>
              </div>
              <button onClick={() => setModalChannel(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-500/10 hover:text-gray-600" title="閉じる">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-sm">
              <Row label="エンドポイント" value={modalChannel.endpoint} mono />
              <Row label="取得スケジュール" value={modalChannel.schedule} />
              <Row label="最終実行" value={modalChannel.lastRun} />
              <Row label="前回取得件数" value={`${modalChannel.lastCount} 件`} />
              <Row label="24時間取得" value={`${modalChannel.total24h.toLocaleString()} 件`} />
              <Row label="エラー件数" value={`${modalChannel.errorCount} 件`} />
              <Row label="認証期限" value={modalChannel.authExpires} />
              <Row label="状態" value={sbLabel[modalChannel.status]} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <SecondaryButton onClick={() => { runChannel(modalChannel.id); setModalChannel(null); }}>
                <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-4 w-4" />手動実行</span>
              </SecondaryButton>
              <PrimaryButton onClick={() => setModalChannel(null)}>閉じる</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/50 border border-white/50">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={cn("text-gray-800 text-right break-all", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
