"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { CreditCard } from "lucide-react";

type Message = {
  id: string;
  method: string;
  thanksMessage: string;
  shipMessage: string;
  invoicePrint: string;
  showInOrderForm: boolean;
  showInThanksMail: boolean;
  showInShipMail: boolean;
  enabled: boolean;
};

const initial: Message[] = [
  {
    id: "pm-credit",
    method: "クレジットカード",
    thanksMessage: "ご利用のクレジットカードへ請求いたします。引落日はカード会社の締日に応じます。",
    shipMessage: "クレジットカードでの決済が完了しました。",
    invoicePrint: "クレジット決済済",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: false,
    enabled: true,
  },
  {
    id: "pm-cod",
    method: "代金引換",
    thanksMessage: "商品お受取り時に配達員へお支払いください。代引手数料 {{cod_fee}} 円が加算されます。",
    shipMessage: "代金引換でお届けします。お支払金額：{{total_with_cod}} 円",
    invoicePrint: "代金引換にて配達員にお支払いください",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: true,
    enabled: true,
  },
  {
    id: "pm-bank",
    method: "銀行振込（前払い）",
    thanksMessage: "下記口座へ {{payment_deadline}} までにお振込みください。\n\n■ 振込先\n{{bank_account}}",
    shipMessage: "ご入金確認後、商品を発送いたしました。",
    invoicePrint: "銀行振込にてご入金済",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: false,
    enabled: true,
  },
  {
    id: "pm-conveni",
    method: "コンビニ決済（後払い）",
    thanksMessage: "請求書は商品到着後に別送いたします。お近くのコンビニでお支払いください。",
    shipMessage: "請求書は本商品とは別便でお送りします（最長14日以内）。",
    invoicePrint: "コンビニ後払い（請求書は別送）",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: true,
    enabled: true,
  },
  {
    id: "pm-amazonpay",
    method: "Amazon Pay",
    thanksMessage: "Amazonアカウントに紐付くお支払い方法で決済いたしました。",
    shipMessage: "Amazon Pay の決済が完了しました。",
    invoicePrint: "Amazon Pay 決済済",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: false,
    enabled: true,
  },
  {
    id: "pm-paypay",
    method: "PayPay",
    thanksMessage: "PayPay 残高またはあと払いから決済いたしました。",
    shipMessage: "PayPay の決済が完了しました。",
    invoicePrint: "PayPay 決済済",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: false,
    enabled: true,
  },
  {
    id: "pm-np",
    method: "NP後払い",
    thanksMessage: "請求書は商品到着後に別送（NP後払い）。コンビニ・銀行・LINE Pay でお支払いいただけます。",
    shipMessage: "NP後払いの請求書は別便でお送りします。",
    invoicePrint: "NP後払い（請求書は別送）",
    showInOrderForm: true,
    showInThanksMail: true,
    showInShipMail: true,
    enabled: false,
  },
];

export default function PaymentMessagePage() {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const update = (id: string, patch: Partial<Message>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">支払方法別メッセージ設定</h1>
            <HelpHint>支払方法ごとに、注文確認メール・出荷通知・請求書印字に表示する文面を設定します。差込変数も利用可能です。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">受注確認メール・発送通知・伝票印字での表示文面を支払方法別にカスタマイズします。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => setItems(initial)}>初期値に戻す</SecondaryButton>
          <PrimaryButton onClick={() => toast.show("支払方法別メッセージを保存しました", "success")}>保存</PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録支払方法</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">有効</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.filter((i) => i.enabled).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">サンクスメール表示</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{items.filter((i) => i.showInThanksMail).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">伝票印字対応</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">{items.filter((i) => i.invoicePrint).length}</div>
        </GlassCard>
      </div>

      <div className="space-y-4">
        {items.map((m) => (
          <GlassCard key={m.id} className={cn(!m.enabled && "opacity-60")}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-800">{m.method}</h2>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", m.enabled ? "bg-emerald-500/15 text-emerald-700" : "bg-gray-500/15 text-gray-500")}>
                  {m.enabled ? "有効" : "無効"}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={m.enabled} onChange={(e) => update(m.id, { enabled: e.target.checked })} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <label className="space-y-1 md:col-span-3">
                <span className="text-xs text-gray-500">サンクスメール本文</span>
                <textarea value={m.thanksMessage} onChange={(e) => update(m.id, { thanksMessage: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 text-xs font-mono" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs text-gray-500">出荷通知メール本文</span>
                <textarea value={m.shipMessage} onChange={(e) => update(m.id, { shipMessage: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 text-xs font-mono" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-500">伝票印字</span>
                <input type="text" value={m.invoicePrint} onChange={(e) => update(m.id, { invoicePrint: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 text-xs" />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={m.showInOrderForm} onChange={(e) => update(m.id, { showInOrderForm: e.target.checked })} className="accent-blue-500" />
                受注画面で表示
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={m.showInThanksMail} onChange={(e) => update(m.id, { showInThanksMail: e.target.checked })} className="accent-blue-500" />
                サンクスメールで表示
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={m.showInShipMail} onChange={(e) => update(m.id, { showInShipMail: e.target.checked })} className="accent-blue-500" />
                出荷メールで表示
              </label>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
