"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  fromAddressStore,
  INITIAL_FROM_ADDRESSES,
  type FromAddressRecord,
} from "@/lib/stores/from-address-store";
import {
  mailSignatureStore,
  INITIAL_MAIL_SIGNATURES,
  type MailSignatureRecord,
} from "@/lib/stores/mail-signature-store";
import { cn } from "@/lib/utils";
import { CheckCircle2, Mail, Plus, Save, Trash2, User } from "lucide-react";

const sb: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-700",
  warning: "bg-amber-500/15 text-amber-700",
  error: "bg-red-500/15 text-red-700",
};

export default function MailSignaturePage() {
  const toast = useToast();

  // 永続化オーナー（送信元アドレス・署名の正規オーナーページ）
  usePersistentStore({ store: fromAddressStore, domain: "from-addresses", seed: INITIAL_FROM_ADDRESSES });
  usePersistentStore({ store: mailSignatureStore, domain: "mail-signatures", seed: INITIAL_MAIL_SIGNATURES });

  const addresses = useSyncExternalStore(fromAddressStore.subscribe, fromAddressStore.getState, fromAddressStore.getState);
  const signatures = useSyncExternalStore(mailSignatureStore.subscribe, mailSignatureStore.getState, mailSignatureStore.getState);

  const [activeAddrId, setActiveAddrId] = useState(INITIAL_FROM_ADDRESSES[0].id);
  const [activeSigId, setActiveSigId] = useState(INITIAL_MAIL_SIGNATURES[0].id);

  const activeAddr = useMemo(() => addresses.find((a) => a.id === activeAddrId) || addresses[0], [addresses, activeAddrId]);
  const activeSig = useMemo(() => signatures.find((s) => s.id === activeSigId) || signatures[0], [signatures, activeSigId]);

  const updateAddr = (patch: Partial<FromAddressRecord>) =>
    fromAddressStore.upsert({ ...activeAddr, ...patch });
  const updateSig = (patch: Partial<MailSignatureRecord>) =>
    mailSignatureStore.upsert({ ...activeSig, ...patch });

  const setDefaultAddr = (id: string) => fromAddressStore.setItems(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
  const setDefaultSig = (id: string) => mailSignatureStore.setItems(signatures.map((s) => ({ ...s, isDefault: s.id === id })));

  const [saved, setSaved] = useState(false);

  // 編集は store へ即時反映され usePersistentStore が自動 snapshot するため、
  // このボタンは「確定済み」を明示するための確認操作。
  const handleSave = () => {
    setSaved(true);
    toast.show("メールアドレス・署名を保存しました", "success");
    setTimeout(() => setSaved(false), 3000);
  };

  const deleteSig = (id: string) => {
    const remaining = signatures.filter((s) => s.id !== id);
    mailSignatureStore.remove(id);
    if (activeSigId === id && remaining[0]) setActiveSigId(remaining[0].id);
    toast.show("署名を削除しました", "info");
  };

  const addAddress = () => {
    const id = `addr-${Date.now()}`;
    const next: FromAddressRecord = {
      id,
      label: "新規送信元",
      email: "new@example.com",
      displayName: "OMSショップ",
      replyTo: "new@example.com",
      isDefault: false,
      shop: "本店",
      spf: "warning",
      dkim: "warning",
    };
    fromAddressStore.upsert(next);
    setActiveAddrId(id);
    toast.show("新規送信元アドレスを追加しました。右側で内容を編集してください", "success");
  };

  const addSignature = () => {
    const id = `sig-${Date.now()}`;
    const next: MailSignatureRecord = {
      id,
      name: "新規署名",
      isDefault: false,
      body: `--\n{{shop_name}}\nTEL: \nURL: `,
    };
    mailSignatureStore.upsert(next);
    setActiveSigId(id);
    toast.show("新規署名を追加しました。右側で内容を編集してください", "success");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">メールアドレス・署名設定</h1>
            <HelpHint>送信元アドレスとメール署名を管理。店舗ごと・用途ごとに切替可能で、SPF/DKIMの認証状態も確認できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">店舗別の送信元アドレスと、署名のテンプレートを編集します。</p>
        </div>
        <PrimaryButton onClick={handleSave}>
          <span className="inline-flex items-center gap-1.5">
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "保存済" : "保存"}
          </span>
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/40 bg-white/40 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />送信元アドレス
            </h2>
            <button
              onClick={addAddress}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />追加
            </button>
          </div>
          <div className="divide-y divide-white/40">
            {addresses.map((a) => (
              <button
                key={a.id}
                onClick={() => setActiveAddrId(a.id)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-white/40 transition-colors",
                  activeAddr.id === a.id && "bg-blue-500/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-800 text-sm inline-flex items-center gap-2">
                    {a.label}
                    {a.isDefault && <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-blue-500/15 text-blue-700">既定</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn("px-1.5 py-0.5 rounded-md text-[10px]", sb[a.spf])} title="SPF">SPF</span>
                    <span className={cn("px-1.5 py-0.5 rounded-md text-[10px]", sb[a.dkim])} title="DKIM">DKIM</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">{a.email}</div>
                <div className="text-xs text-gray-400 mt-0.5">{a.displayName} ・ {a.shop}</div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2">
              <User className="h-4 w-4 text-violet-600" />送信元編集
            </h2>
            {!activeAddr.isDefault && (
              <SecondaryButton onClick={() => { setDefaultAddr(activeAddr.id); toast.show(`${activeAddr.label} を既定に設定`, "success"); }}>
                既定に設定
              </SecondaryButton>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs text-gray-500">表示ラベル</span>
              <input
                type="text"
                value={activeAddr.label}
                onChange={(e) => updateAddr({ label: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-gray-500">メールアドレス</span>
              <input
                type="email"
                value={activeAddr.email}
                onChange={(e) => updateAddr({ email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-gray-500">返信先（Reply-To）</span>
              <input
                type="email"
                value={activeAddr.replyTo}
                onChange={(e) => updateAddr({ replyTo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono"
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs text-gray-500">送信元表示名</span>
              <input
                type="text"
                value={activeAddr.displayName}
                onChange={(e) => updateAddr({ displayName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs text-gray-500">紐付け店舗</span>
              <select
                value={activeAddr.shop}
                onChange={(e) => updateAddr({ shop: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              >
                <option>本店</option>
                <option>楽天店</option>
                <option>Yahoo!店</option>
                <option>Amazon店</option>
                <option>au PAY マーケット店</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="p-3 rounded-xl bg-white/50 border border-white/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">SPF</span>
                <span className={cn("px-1.5 py-0.5 rounded-md inline-flex items-center gap-1", sb[activeAddr.spf])}>
                  {activeAddr.spf === "ok" && <CheckCircle2 className="h-3 w-3" />}{activeAddr.spf === "ok" ? "OK" : "要確認"}
                </span>
              </div>
              <div className="font-mono text-gray-700 mt-1">v=spf1 include:sendgrid.net -all</div>
            </div>
            <div className="p-3 rounded-xl bg-white/50 border border-white/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">DKIM</span>
                <span className={cn("px-1.5 py-0.5 rounded-md inline-flex items-center gap-1", sb[activeAddr.dkim])}>
                  {activeAddr.dkim === "ok" && <CheckCircle2 className="h-3 w-3" />}{activeAddr.dkim === "ok" ? "OK" : "要確認"}
                </span>
              </div>
              <div className="font-mono text-gray-700 mt-1">selector1._domainkey.example.com</div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/40 bg-white/40 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">署名一覧</h2>
            <button
              onClick={addSignature}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />追加
            </button>
          </div>
          <div className="divide-y divide-white/40">
            {signatures.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSigId(s.id)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-white/40 transition-colors",
                  activeSig.id === s.id && "bg-blue-500/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 text-sm">{s.name}</span>
                  {s.isDefault && <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-blue-500/15 text-blue-700">既定</span>}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{s.body.split("\n")[1] || s.body.split("\n")[0]}</div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">署名編集</h2>
            <div className="flex gap-2">
              {!activeSig.isDefault && (
                <SecondaryButton onClick={() => { setDefaultSig(activeSig.id); toast.show(`${activeSig.name} を既定に設定`, "success"); }}>
                  既定に設定
                </SecondaryButton>
              )}
              <button
                onClick={() => deleteSig(activeSig.id)}
                disabled={activeSig.isDefault}
                className="p-2 rounded-xl bg-red-500/15 text-red-700 hover:bg-red-500/25 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <label className="space-y-1 block">
              <span className="text-xs text-gray-500">署名名</span>
              <input
                type="text"
                value={activeSig.name}
                onChange={(e) => updateSig({ name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-xs text-gray-500">本文</span>
              <textarea
                value={activeSig.body}
                onChange={(e) => updateSig({ body: e.target.value })}
                rows={9}
                className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono text-xs leading-relaxed"
              />
            </label>
            <div className="text-xs text-gray-500">
              利用可能変数:
              <span className="ml-2 font-mono">{`{{shop_name}} {{operator_name}} {{phone}} {{unsubscribe_url}}`}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
