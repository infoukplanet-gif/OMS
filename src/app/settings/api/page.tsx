"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { CheckCircle2, Copy, Eye, EyeOff, KeyRound, Plus, RefreshCw, Trash2 } from "lucide-react";

type ApiKey = {
  id: string;
  label: string;
  scope: string;
  keyMasked: string;
  createdAt: string;
  lastUsed: string;
  enabled: boolean;
  ipWhitelist: string;
};

type Connection = {
  id: string;
  name: string;
  endpoint: string;
  authType: "api-key" | "oauth" | "basic";
  status: "ok" | "warning" | "error";
  lastSync: string;
};

const initialKeys: ApiKey[] = [
  { id: "key-prod", label: "本番（外部連携用）", scope: "受注/在庫/出荷 読取・書込", keyMasked: "sk_live_********************a91f", createdAt: "2025/12/01", lastUsed: "2026/04/30 10:12", enabled: true, ipWhitelist: "203.0.113.10/32" },
  { id: "key-stg", label: "ステージング", scope: "受注 読取のみ", keyMasked: "sk_test_********************42b0", createdAt: "2026/01/15", lastUsed: "2026/04/29 18:00", enabled: true, ipWhitelist: "—" },
  { id: "key-bi", label: "BI（読取専用）", scope: "売上 / 在庫 読取", keyMasked: "sk_read_********************77e3", createdAt: "2026/02/10", lastUsed: "2026/04/30 02:00", enabled: true, ipWhitelist: "10.0.0.0/8" },
  { id: "key-old", label: "旧本番（無効化済）", scope: "受注 読取・書込", keyMasked: "sk_live_********************0011", createdAt: "2024/06/01", lastUsed: "2025/11/30 12:00", enabled: false, ipWhitelist: "—" },
];

const connections: Connection[] = [
  { id: "rakuten", name: "楽天市場 RMS API", endpoint: "https://api.rms.rakuten.co.jp", authType: "oauth", status: "ok", lastSync: "2026/04/30 10:00" },
  { id: "yahoo", name: "Yahoo!ショッピング API", endpoint: "https://circus.shopping.yahooapis.jp", authType: "oauth", status: "ok", lastSync: "2026/04/30 09:50" },
  { id: "amazon", name: "Amazon SP-API", endpoint: "https://sellingpartnerapi-fe.amazon.com", authType: "oauth", status: "warning", lastSync: "2026/04/30 04:00" },
  { id: "yamato", name: "ヤマト B2 クラウド", endpoint: "https://bmypage.kuronekoyamato.co.jp", authType: "api-key", status: "ok", lastSync: "2026/04/30 09:30" },
  { id: "sagawa", name: "佐川急便 e飛伝", endpoint: "https://e-hiden.sagawa-exp.co.jp", authType: "basic", status: "error", lastSync: "2026/04/29 18:00" },
];

const sb: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-700",
  warning: "bg-amber-500/15 text-amber-700",
  error: "bg-red-500/15 text-red-700",
};
const sbLabel: Record<string, string> = { ok: "正常", warning: "警告", error: "エラー" };

export default function SettingsApiPage() {
  const toast = useToast();
  const [keys, setKeys] = useState(initialKeys);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [rateLimit, setRateLimit] = useState(60);
  const [allowCors, setAllowCors] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.example.com/oms/events");
  const [webhookEnabled, setWebhookEnabled] = useState(true);

  const toggleReveal = (id: string) => setReveal((p) => ({ ...p, [id]: !p[id] }));
  const updateKey = (id: string, patch: Partial<ApiKey>) =>
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, ...patch } : k)));

  const stats = useMemo(
    () => ({
      total: keys.length,
      active: keys.filter((k) => k.enabled).length,
      inactive: keys.filter((k) => !k.enabled).length,
      connOk: connections.filter((c) => c.status === "ok").length,
    }),
    [keys]
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">API設定</h1>
            <HelpHint>外部システム連携用のAPIキーと外部API接続情報を管理します。発行・無効化・IP制限・Webhook設定が可能です。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">基幹システム連携や外部モール・配送業者の接続をここから管理。</p>
        </div>
        <PrimaryButton onClick={() => toast.show("API設定を保存しました", "success")}>保存</PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録APIキー</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">有効</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">無効化済</div>
          <div className="text-2xl font-bold text-gray-400 mt-1">{stats.inactive}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">外部接続 正常</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.connOk} / {connections.length}</div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-blue-600" />APIキー <HelpHint>OMSへ外部からアクセスする際のキー。発行時のみ秘密鍵を表示します。</HelpHint>
          </h2>
          <SecondaryButton onClick={() => toast.show("新規APIキーを発行しました", "success")}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />キー発行</span>
          </SecondaryButton>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ラベル</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">スコープ</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">キー</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">IP制限</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">最終利用</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-gray-800">{k.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">作成: {k.createdAt}</div>
                </td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{k.scope}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded-lg bg-white/60 text-xs font-mono">
                      {reveal[k.id] ? k.keyMasked.replace(/\*/g, "x") : k.keyMasked}
                    </code>
                    <button onClick={() => toggleReveal(k.id)} className="p-1 rounded-lg hover:bg-white/60 text-gray-400" title="表示切替">
                      {reveal[k.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => toast.show("キーをコピーしました", "info")} className="p-1 rounded-lg hover:bg-white/60 text-gray-400" title="コピー">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-gray-600 text-xs font-mono">{k.ipWhitelist}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{k.lastUsed}</td>
                <td className="px-3 py-2.5 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={k.enabled} onChange={(e) => updateKey(k.id, { enabled: e.target.checked })} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => toast.show(`${k.label} をローテーションしました`, "success")} className="p-1.5 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25" title="ローテーション">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setKeys((p) => p.filter((x) => x.id !== k.id)); toast.show("キーを削除しました", "info"); }} className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25" title="削除">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-sm font-semibold text-gray-800">
          外部API接続（モール・配送業者）
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">サービス名</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">エンドポイント</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">認証方式</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">最終同期</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((c) => (
              <tr key={c.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-medium text-gray-800">{c.name}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-gray-600">{c.endpoint}</td>
                <td className="px-3 py-2.5 text-center text-xs text-gray-600 uppercase">{c.authType}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[c.status])}>
                    {c.status === "ok" && <CheckCircle2 className="h-3 w-3" />}
                    {sbLabel[c.status]}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{c.lastSync}</td>
                <td className="px-3 py-2.5 text-center">
                  <button onClick={() => toast.show(`${c.name} と再接続しました`, "success")} className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">
                    再接続
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3 inline-flex items-center gap-2">
          グローバル設定 <HelpHint>レート制限、CORS、Webhook通知の動作を全体に適用します。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs text-gray-500">レートリミット（req/分）</span>
            <input type="number" value={rateLimit} onChange={(e) => setRateLimit(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">CORS（外部Web連携）</span>
            <select value={allowCors ? "yes" : "no"} onChange={(e) => setAllowCors(e.target.value === "yes")} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              <option value="no">無効（同一オリジンのみ）</option>
              <option value="yes">有効（許可ドメイン制限）</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">最大ペイロードサイズ（MB）</span>
            <input type="number" defaultValue={10} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs text-gray-500">Webhook通知URL（受注/在庫イベント）</span>
            <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">Webhook</span>
            <select value={webhookEnabled ? "on" : "off"} onChange={(e) => setWebhookEnabled(e.target.value === "on")} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              <option value="on">有効</option>
              <option value="off">無効</option>
            </select>
          </label>
        </div>
      </GlassCard>
    </div>
  );
}
