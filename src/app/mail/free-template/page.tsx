"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Copy, Edit, Eye, Plus, Search, Trash2 } from "lucide-react";

type FreeTemplate = {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  signature: string;
  shared: boolean;
  updated: string;
  createdBy: string;
  uses: number;
};

const initial: FreeTemplate[] = [
  {
    id: "free-apology",
    name: "お詫び（発送遅延）",
    category: "お詫び",
    subject: "【お詫び】商品発送遅延について（{{order_id}}）",
    body: "{{customer_name}} 様\n\nこの度はご注文の商品発送が遅延しておりますこと、深くお詫び申し上げます。\n発送見込み日：{{ship_eta}}",
    signature: "default",
    shared: true,
    updated: "2026/04/20",
    createdBy: "山田",
    uses: 45,
  },
  {
    id: "free-stockout",
    name: "在庫切れご連絡",
    category: "問い合わせ",
    subject: "【ご連絡】在庫切れのお知らせ（{{order_id}}）",
    body: "{{customer_name}} 様\n\nご注文いただきました商品が在庫切れとなりました。\n以下より対応をお選びください。",
    signature: "default",
    shared: true,
    updated: "2026/04/15",
    createdBy: "佐藤",
    uses: 18,
  },
  {
    id: "free-cancel",
    name: "キャンセル受付",
    category: "事務連絡",
    subject: "【受付】キャンセル受付完了のお知らせ（{{order_id}}）",
    body: "{{customer_name}} 様\n\nご注文のキャンセルを承りました。",
    signature: "default",
    shared: true,
    updated: "2026/04/10",
    createdBy: "田中",
    uses: 24,
  },
  {
    id: "free-return",
    name: "返品受付",
    category: "事務連絡",
    subject: "【受付】返品受付のお知らせ（{{order_id}}）",
    body: "{{customer_name}} 様\n\n返品の受付を承りました。\n返送先：{{return_address}}",
    signature: "default",
    shared: true,
    updated: "2026/04/05",
    createdBy: "鈴木",
    uses: 32,
  },
  {
    id: "free-vip",
    name: "VIP顧客挨拶",
    category: "営業",
    subject: "{{customer_name}} 様、いつもありがとうございます",
    body: "いつも {{shop_name}} をご利用いただきありがとうございます。",
    signature: "vip",
    shared: false,
    updated: "2026/03/28",
    createdBy: "山田",
    uses: 12,
  },
  {
    id: "free-survey",
    name: "アンケート依頼",
    category: "営業",
    subject: "アンケートご協力のお願い（{{shop_name}}）",
    body: "{{customer_name}} 様\n\n商品改善のためアンケートにご協力ください。",
    signature: "default",
    shared: true,
    updated: "2026/03/20",
    createdBy: "佐藤",
    uses: 88,
  },
];

const categories = ["お詫び", "問い合わせ", "事務連絡", "営業"];

export default function MailFreeTemplatePage() {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const [shared, setShared] = useState<"all" | "shared" | "personal">("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((i) => {
      if (k && !`${i.name} ${i.subject} ${i.createdBy}`.toLowerCase().includes(k)) return false;
      if (category !== "all" && i.category !== category) return false;
      if (shared === "shared" && !i.shared) return false;
      if (shared === "personal" && i.shared) return false;
      return true;
    });
  }, [items, keyword, category, shared]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">フリーメールテンプレート</h1>
            <HelpHint>オペレーターが手動送信するメールのテンプレート集。お詫び・キャンセル受付・問い合わせ返信などをカテゴリ別に管理します。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">用途別に分類されたテンプレートからフリーメール送信画面で呼び出して利用します。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => toast.show("テンプレートをエクスポートしました", "success")}>エクスポート</SecondaryButton>
          <PrimaryButton onClick={() => toast.show("新規テンプレートを追加します", "info")}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />新規追加</span>
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録テンプレート</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">共有</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{items.filter((i) => i.shared).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">個人</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">{items.filter((i) => !i.shared).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">送信実績合計</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.reduce((s, i) => s + i.uses, 0)}</div>
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
              placeholder="テンプレート名・件名・作成者"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">カテゴリ: すべて</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={shared}
            onChange={(e) => setShared(e.target.value as typeof shared)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">共有/個人: すべて</option>
            <option value="shared">共有のみ</option>
            <option value="personal">個人のみ</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setCategory("all"); setShared("all"); }}>
            クリア
          </SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {items.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">テンプレート名</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">カテゴリ</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">件名</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">共有</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">作成者</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">更新</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">利用回数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-gray-800">{t.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{t.body.split("\n")[0]}</div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700">{t.category}</span>
                </td>
                <td className="px-3 py-2.5 text-gray-700 text-xs font-mono truncate max-w-[280px]">{t.subject}</td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      t.shared ? "bg-emerald-500/15 text-emerald-700" : "bg-violet-500/15 text-violet-700"
                    )}
                  >
                    {t.shared ? "共有" : "個人"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{t.createdBy}</td>
                <td className="px-3 py-2.5 text-center text-gray-500 text-xs">{t.updated}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{t.uses}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => toast.show(`${t.name} をプレビューします`, "info")}
                      className="p-1.5 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                      title="プレビュー"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toast.show(`${t.name} を複製しました`, "success")}
                      className="p-1.5 rounded-lg bg-gray-500/10 text-gray-700 hover:bg-gray-500/20"
                      title="複製"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toast.show(`${t.name} を編集します`, "info")}
                      className="p-1.5 rounded-lg bg-gray-500/10 text-gray-700 hover:bg-gray-500/20"
                      title="編集"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setItems((prev) => prev.filter((p) => p.id !== t.id));
                        toast.show(`${t.name} を削除しました`, "info");
                      }}
                      className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25"
                      title="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-400">該当するテンプレートがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
