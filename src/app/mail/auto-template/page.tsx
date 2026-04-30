"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Copy, Eye, Plus, Search } from "lucide-react";

type Template = {
  id: string;
  name: string;
  trigger: string;
  subject: string;
  body: string;
  updated: string;
  uses: number;
  enabled: boolean;
};

const initial: Template[] = [
  {
    id: "tpl-thanks",
    name: "サンクスメール（受注確認）",
    trigger: "受注確認後 即時",
    subject: "{{shop_name}}：ご注文ありがとうございます（{{order_id}}）",
    body: `{{customer_name}} 様

この度は {{shop_name}} をご利用いただき、誠にありがとうございます。
ご注文を承りましたので、以下の通りご確認ください。

■ 注文番号：{{order_id}}
■ ご注文日：{{order_date}}
■ お支払方法：{{payment_method}}
■ 合計金額：{{total_amount}} 円

商品の発送が完了次第、改めてお知らせいたします。`,
    updated: "2026/04/15",
    uses: 1245,
    enabled: true,
  },
  {
    id: "tpl-ship",
    name: "出荷通知メール",
    trigger: "出荷登録後 即時",
    subject: "{{shop_name}}：商品を発送いたしました（{{order_id}}）",
    body: `{{customer_name}} 様

ご注文いただきました商品を発送いたしました。

■ 注文番号：{{order_id}}
■ 配送業者：{{shipping_carrier}}
■ お問い合わせ番号：{{tracking_number}}
■ お届け予定日：{{delivery_date}}`,
    updated: "2026/04/12",
    uses: 980,
    enabled: true,
  },
  {
    id: "tpl-payment3",
    name: "入金催促（3日経過）",
    trigger: "入金待ち3日後 09:00",
    subject: "【お支払いのお願い】{{shop_name}} ご注文 {{order_id}}",
    body: `{{customer_name}} 様

ご注文の {{order_id}} につきまして、ご入金がまだ確認できておりません。
お支払期限：{{payment_deadline}}`,
    updated: "2026/04/10",
    uses: 312,
    enabled: true,
  },
  {
    id: "tpl-follow",
    name: "フォローアップ（発送後3日）",
    trigger: "発送後3日後 10:00",
    subject: "{{shop_name}}：商品はお手元に届きましたか？",
    body: `{{customer_name}} 様

先日ご注文いただいた商品はお手元に届きましたでしょうか。
万が一、未着・破損などございましたらお知らせください。`,
    updated: "2026/04/08",
    uses: 580,
    enabled: true,
  },
  {
    id: "tpl-reship",
    name: "再発送のお知らせ",
    trigger: "再発送登録後 即時",
    subject: "{{shop_name}}：再発送のお知らせ（{{order_id}}）",
    body: `{{customer_name}} 様

ご迷惑をおかけしております。
{{order_id}} の商品を再発送いたしました。

■ 配送業者：{{shipping_carrier}}
■ お問い合わせ番号：{{tracking_number}}`,
    updated: "2026/04/05",
    uses: 32,
    enabled: true,
  },
  {
    id: "tpl-stock",
    name: "在庫切れ連絡",
    trigger: "在庫不足検知後 即時",
    subject: "{{shop_name}}：商品在庫に関するお知らせ",
    body: `{{customer_name}} 様

ご注文 {{order_id}} につきまして、現在在庫切れが発生しております。
ご希望の対応をお選びください。`,
    updated: "2026/03/30",
    uses: 18,
    enabled: false,
  },
  {
    id: "tpl-review",
    name: "レビュー依頼",
    trigger: "発送後7日後 19:00",
    subject: "{{shop_name}}：レビューのお願い",
    body: `{{customer_name}} 様

商品の使い心地はいかがでしょうか。
ぜひレビューをお寄せください。`,
    updated: "2026/03/28",
    uses: 220,
    enabled: false,
  },
];

const variables = [
  "{{shop_name}}", "{{customer_name}}", "{{order_id}}", "{{order_date}}",
  "{{total_amount}}", "{{payment_method}}", "{{payment_deadline}}",
  "{{shipping_carrier}}", "{{tracking_number}}", "{{delivery_date}}",
  "{{product_list}}", "{{shipping_address}}",
];

export default function MailAutoTemplatePage() {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [activeId, setActiveId] = useState(initial[0].id);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((i) => {
      if (k && !`${i.name} ${i.trigger} ${i.subject}`.toLowerCase().includes(k)) return false;
      if (filter === "enabled" && !i.enabled) return false;
      if (filter === "disabled" && i.enabled) return false;
      return true;
    });
  }, [items, keyword, filter]);

  const active = items.find((i) => i.id === activeId) || items[0];

  const update = (patch: Partial<Template>) =>
    setItems((prev) => prev.map((i) => (i.id === active.id ? { ...i, ...patch } : i)));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">自動送信メールテンプレート</h1>
            <HelpHint>受注フローに自動送信されるメールの本文・件名テンプレートを編集します。差込変数はリストから選んで挿入できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">サンクスメール・出荷通知・入金催促・フォロー等のテンプレートを統合管理。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => toast.show("プレビューを開きます", "info")}>
            <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" />プレビュー</span>
          </SecondaryButton>
          <PrimaryButton onClick={() => toast.show("テンプレートを保存しました", "success")}>保存</PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-3 border-b border-white/40 bg-white/40 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                type="text"
                placeholder="テンプレート検索"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            >
              <option value="all">すべて</option>
              <option value="enabled">有効のみ</option>
              <option value="disabled">無効のみ</option>
            </select>
            <button
              onClick={() => toast.show("新規テンプレートを追加します", "info")}
              className="w-full px-3 py-2 rounded-xl text-sm font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />新規テンプレート
            </button>
          </div>
          <div className="max-h-[480px] overflow-y-auto divide-y divide-white/40">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "w-full text-left px-3 py-3 hover:bg-white/40 transition-colors",
                  active.id === t.id && "bg-blue-500/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 text-sm">{t.name}</span>
                  <span className={cn("px-1.5 py-0.5 rounded-md text-[10px]", t.enabled ? "bg-emerald-500/15 text-emerald-700" : "bg-gray-500/10 text-gray-500")}>
                    {t.enabled ? "有効" : "無効"}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{t.trigger}</div>
                <div className="text-xs text-gray-400 mt-0.5">送信実績: {t.uses.toLocaleString()} 件 / 更新 {t.updated}</div>
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs text-gray-500">テンプレート名</span>
                <input
                  type="text"
                  value={active.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-500">トリガー</span>
                <input
                  type="text"
                  value={active.trigger}
                  onChange={(e) => update({ trigger: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-gray-500">状態</span>
                <select
                  value={active.enabled ? "enabled" : "disabled"}
                  onChange={(e) => update({ enabled: e.target.value === "enabled" })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                >
                  <option value="enabled">有効</option>
                  <option value="disabled">無効</option>
                </select>
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs text-gray-500">件名</span>
                <input
                  type="text"
                  value={active.subject}
                  onChange={(e) => update({ subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono text-xs"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs text-gray-500">本文</span>
                <textarea
                  value={active.body}
                  onChange={(e) => update({ body: e.target.value })}
                  rows={14}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono text-xs leading-relaxed"
                />
              </label>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-gray-800">差込変数</h2>
              <HelpHint>クリックでクリップボードにコピーできます。本文・件名にペーストして利用してください。</HelpHint>
            </div>
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <button
                  key={v}
                  onClick={() => toast.show(`${v} をコピーしました`, "info")}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/60 border border-white/60 hover:bg-blue-500/10 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />{v}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
