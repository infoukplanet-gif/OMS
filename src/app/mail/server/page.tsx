"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { CheckCircle2, Plus, Send, Server, Shield, Trash2 } from "lucide-react";

type Smtp = {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  encryption: "none" | "ssl" | "tls";
  fromAddress: string;
  fromName: string;
  isPrimary: boolean;
  status: "ok" | "warning" | "error";
  lastChecked: string;
  daily: number;
  monthly: number;
};

const initialSmtp: Smtp[] = [
  {
    id: "smtp-primary",
    name: "メイン送信サーバ（SendGrid）",
    host: "smtp.sendgrid.net",
    port: 587,
    username: "apikey",
    encryption: "tls",
    fromAddress: "info@example.com",
    fromName: "OMSショップ",
    isPrimary: true,
    status: "ok",
    lastChecked: "2026/04/30 09:30",
    daily: 8240,
    monthly: 124530,
  },
  {
    id: "smtp-fallback",
    name: "フォールバック（Amazon SES）",
    host: "email-smtp.ap-northeast-1.amazonaws.com",
    port: 587,
    username: "AKIAxxxxxxxxxxxx",
    encryption: "tls",
    fromAddress: "info@example.com",
    fromName: "OMSショップ",
    isPrimary: false,
    status: "ok",
    lastChecked: "2026/04/30 08:00",
    daily: 0,
    monthly: 1230,
  },
  {
    id: "smtp-newsletter",
    name: "メルマガ専用（Postmark）",
    host: "smtp.postmarkapp.com",
    port: 587,
    username: "postmark-token",
    encryption: "tls",
    fromAddress: "newsletter@example.com",
    fromName: "OMSショップ お得情報",
    isPrimary: false,
    status: "warning",
    lastChecked: "2026/04/29 22:00",
    daily: 0,
    monthly: 5400,
  },
];

const sb: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-700",
  warning: "bg-amber-500/15 text-amber-700",
  error: "bg-red-500/15 text-red-700",
};

const sbLabel: Record<string, string> = {
  ok: "正常",
  warning: "警告",
  error: "エラー",
};

export default function MailServerPage() {
  const toast = useToast();
  const [servers, setServers] = useState(initialSmtp);
  const [activeId, setActiveId] = useState(initialSmtp[0].id);
  const [testTarget, setTestTarget] = useState("");

  const active = servers.find((s) => s.id === activeId) || servers[0];
  const update = (patch: Partial<Smtp>) =>
    setServers((prev) => prev.map((s) => (s.id === active.id ? { ...s, ...patch } : s)));

  const setPrimary = (id: string) =>
    setServers((prev) => prev.map((s) => ({ ...s, isPrimary: s.id === id })));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">メールサーバ設定</h1>
            <HelpHint>送信に使う SMTP サーバを管理します。複数のリレー先を登録し、メイン／フォールバックを切り替えられます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">SMTP・SPF/DKIM・送信元・接続テストを統合管理。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => toast.show("接続テストを開始しました", "info")}>
            <span className="inline-flex items-center gap-1.5"><Send className="h-4 w-4" />接続テスト</span>
          </SecondaryButton>
          <PrimaryButton onClick={() => toast.show("SMTP 設定を保存しました", "success")}>保存</PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">登録サーバ</div>
            <Server className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{servers.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">本日送信数</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{servers.reduce((s, x) => s + x.daily, 0).toLocaleString()}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">今月送信数</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{servers.reduce((s, x) => s + x.monthly, 0).toLocaleString()}</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-3 py-3 border-b border-white/40 bg-white/40 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-800">送信サーバ一覧</div>
            <button
              onClick={() => toast.show("新規 SMTP サーバを追加します", "info")}
              className="p-1 rounded-lg hover:bg-white/60 text-blue-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-white/40">
            {servers.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={cn(
                  "w-full text-left px-3 py-3 hover:bg-white/40 transition-colors",
                  active.id === s.id && "bg-blue-500/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 text-sm">{s.name}</span>
                  {s.isPrimary && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-blue-500/15 text-blue-700">メイン</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 font-mono truncate">{s.host}:{s.port}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className={cn("px-1.5 py-0.5 rounded-md text-[10px]", sb[s.status])}>{sbLabel[s.status]}</span>
                  <span className="text-[10px] text-gray-400">{s.lastChecked}</span>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2">
                {active.name}
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[active.status])}>{sbLabel[active.status]}</span>
              </h2>
              <div className="flex gap-2">
                {!active.isPrimary && (
                  <SecondaryButton onClick={() => { setPrimary(active.id); toast.show(`${active.name} をメイン送信に設定`, "success"); }}>
                    メインに設定
                  </SecondaryButton>
                )}
                <button
                  onClick={() => { setServers((prev) => prev.filter((s) => s.id !== active.id)); toast.show("サーバを削除しました", "info"); }}
                  disabled={active.isPrimary}
                  className="p-2 rounded-xl bg-red-500/15 text-red-700 hover:bg-red-500/25 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs text-gray-500">サーバ表示名</span>
                <input
                  type="text"
                  value={active.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-500">SMTPホスト</span>
                <input
                  type="text"
                  value={active.host}
                  onChange={(e) => update({ host: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-500">ポート</span>
                <input
                  type="number"
                  value={active.port}
                  onChange={(e) => update({ port: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-500">ユーザー名</span>
                <input
                  type="text"
                  value={active.username}
                  onChange={(e) => update({ username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-500">パスワード</span>
                <input
                  type="password"
                  defaultValue="********"
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-500">暗号化方式</span>
                <select
                  value={active.encryption}
                  onChange={(e) => update({ encryption: e.target.value as Smtp["encryption"] })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                >
                  <option value="tls">STARTTLS</option>
                  <option value="ssl">SSL/TLS</option>
                  <option value="none">なし</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-500">タイムアウト（秒）</span>
                <input type="number" defaultValue={30} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-500">送信元アドレス</span>
                <input
                  type="email"
                  value={active.fromAddress}
                  onChange={(e) => update({ fromAddress: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-500">送信元表示名</span>
                <input
                  type="text"
                  value={active.fromName}
                  onChange={(e) => update({ fromName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                />
              </label>
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-sm font-semibold text-gray-800 mb-3 inline-flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />送信認証 / レピュテーション <HelpHint>SPF・DKIM・DMARCの設定状況。設定されていない場合、迷惑メール扱いになる可能性があります。</HelpHint>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              {[
                { label: "SPFレコード", status: "OK", value: "v=spf1 include:sendgrid.net -all" },
                { label: "DKIM署名", status: "OK", value: "selector1._domainkey.example.com" },
                { label: "DMARCポリシー", status: "WARN", value: "p=none; rua=mailto:dmarc@example.com" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-white/50 border border-white/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{s.label}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded-md text-[10px] inline-flex items-center gap-1",
                        s.status === "OK" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"
                      )}
                    >
                      {s.status === "OK" && <CheckCircle2 className="h-3 w-3" />}
                      {s.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-700 font-mono break-all">{s.value}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-sm font-semibold text-gray-800 mb-3 inline-flex items-center gap-2">
              送信テスト <HelpHint>指定アドレスにテストメールを送信して、設定の正常性を確認します。</HelpHint>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="email"
                value={testTarget}
                onChange={(e) => setTestTarget(e.target.value)}
                placeholder="テスト送信先アドレス"
                className="flex-1 min-w-[240px] px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
              <PrimaryButton
                onClick={() => {
                  if (!testTarget) { toast.show("送信先を入力してください", "error"); return; }
                  toast.show(`${testTarget} へテスト送信しました`, "success");
                }}
              >
                <span className="inline-flex items-center gap-1.5"><Send className="h-4 w-4" />送信</span>
              </PrimaryButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
