"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Edit, Pause, Search, Send, Trash2 } from "lucide-react";

const data = [
  { id: "Q-20260430-0042", to: "tanaka@example.com", customer: "田中 太郎", subject: "【発送完了】ORD-2026-08423", template: "発送通知", scheduled: "2026/04/30 15:00", priority: "通常", trigger: "出荷完了", retryAt: "—" },
  { id: "Q-20260430-0041", to: "yamada@example.com", customer: "山田 花子", subject: "【フォロー】ORD-2026-08418", template: "フォロー", scheduled: "2026/04/30 18:00", priority: "通常", trigger: "発送後3日", retryAt: "—" },
  { id: "Q-20260430-0040", to: "sato@example.com", customer: "佐藤 一郎", subject: "【受注確認】ORD-2026-08410", template: "受注確認", scheduled: "2026/04/30 10:45", priority: "高", trigger: "受注確認", retryAt: "—" },
  { id: "Q-20260430-0039", to: "kimura@example.com", customer: "木村 美咲", subject: "【入金確認】ORD-2026-08405", template: "入金確認", scheduled: "2026/04/30 11:00", priority: "通常", trigger: "入金待ち3日", retryAt: "—" },
  { id: "Q-20260430-0038", to: "watanabe@example.com", customer: "渡辺 健", subject: "【発送完了】ORD-2026-08400", template: "発送通知", scheduled: "2026/04/30 13:00", priority: "通常", trigger: "出荷完了", retryAt: "—" },
  { id: "Q-20260430-0037", to: "ito@example.com", customer: "伊藤 さくら", subject: "【再発送のお知らせ】ORD-2026-08395", template: "再発送", scheduled: "2026/04/30 14:30", priority: "高", trigger: "再発送", retryAt: "—" },
  { id: "Q-20260430-0036", to: "kobayashi@example.com", customer: "小林 大輔", subject: "【入金催促】ORD-2026-08390", template: "入金催促", scheduled: "2026/04/30 16:00", priority: "高", trigger: "入金待ち5日", retryAt: "—" },
  { id: "Q-20260430-0035", to: "yoshida@example.com", customer: "吉田 あゆみ", subject: "【フォローアップ】ORD-2026-08385", template: "フォロー", scheduled: "2026/04/30 17:00", priority: "低", trigger: "発送後3日", retryAt: "—" },
  { id: "Q-20260430-0034", to: "nakamura@example.com", customer: "中村 太陽", subject: "【在庫確認のお願い】ORD-2026-08380", template: "在庫確認", scheduled: "2026/04/30 19:00", priority: "通常", trigger: "在庫不足", retryAt: "—" },
  { id: "Q-20260430-0033", to: "abe@example.com", customer: "阿部 香織", subject: "【ご注文ありがとうございます】ORD-2026-08378", template: "サンクスメール", scheduled: "2026/04/30 20:00", priority: "通常", trigger: "受注確認", retryAt: "2026/04/30 22:00" },
];

const pb: Record<string, string> = {
  高: "bg-red-500/15 text-red-700",
  通常: "bg-gray-500/15 text-gray-700",
  低: "bg-gray-400/10 text-gray-500",
};

export default function MailPendingPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return data.filter((d) => {
      if (k && !`${d.to} ${d.subject} ${d.customer}`.toLowerCase().includes(k)) return false;
      if (templateFilter !== "all" && d.template !== templateFilter) return false;
      if (priorityFilter !== "all" && d.priority !== priorityFilter) return false;
      return true;
    });
  }, [keyword, templateFilter, priorityFilter]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected((prev) => (prev.length === filtered.length ? [] : filtered.map((f) => f.id)));

  const templates = Array.from(new Set(data.map((d) => d.template)));

  const kpis = [
    { label: "送信待ち件数", value: data.length, hint: "送信予定キューの全件数", color: "text-blue-600" },
    { label: "本日送信予定", value: data.filter((d) => d.scheduled.startsWith("2026/04/30")).length, hint: "本日中に送信予定のメール件数", color: "text-emerald-600" },
    { label: "高優先度", value: data.filter((d) => d.priority === "高").length, hint: "高優先度（入金催促・受注確認等）", color: "text-red-600" },
    { label: "再送待ち", value: data.filter((d) => d.retryAt !== "—").length, hint: "失敗から自動リトライ予定のキュー", color: "text-amber-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">送信待ちキュー</h1>
            <HelpHint>送信予定のメールキュー一覧。即時送信・キャンセル・編集が可能で、失敗時の自動リトライ予定もここから確認できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">受注ステータス変化で自動キューイングされたメールを確認・編集します。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => toast.show(`${selected.length} 件をキャンセルしました`, "info")}>
            <span className="inline-flex items-center gap-1.5"><Trash2 className="h-4 w-4" />選択をキャンセル</span>
          </SecondaryButton>
          <PrimaryButton onClick={() => toast.show(`${selected.length} 件を即時送信しました`, "success")}>
            <span className="inline-flex items-center gap-1.5"><Send className="h-4 w-4" />選択を即時送信</span>
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <GlassCard key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">{k.label}</div>
              <HelpHint side="left">{k.hint}</HelpHint>
            </div>
            <div className={cn("text-2xl font-bold mt-1", k.color)}>{k.value}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="宛先・件名・顧客名"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">テンプレート: すべて</option>
            {templates.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">優先度: すべて</option>
            <option value="高">高</option>
            <option value="通常">通常</option>
            <option value="低">低</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setTemplateFilter("all"); setPriorityFilter("all"); }}>
            クリア
          </SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {filtered.length} 件 / 全 {data.length} 件
            {selected.length > 0 && <span className="ml-3 text-blue-600 font-medium">{selected.length} 件選択中</span>}
          </div>
          <div className="text-xs text-gray-500">右クリックで一括操作</div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  className="accent-blue-500"
                  checked={selected.length > 0 && selected.length === filtered.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">キューID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">宛先</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">件名</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">テンプレート</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">トリガー</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">送信予定</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">優先度</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">再送予定</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className={cn("border-t border-white/30 hover:bg-white/40", selected.includes(d.id) && "bg-blue-500/5")}>
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    checked={selected.includes(d.id)}
                    onChange={() => toggle(d.id)}
                  />
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{d.id}</td>
                <td className="px-3 py-2.5">
                  <div className="text-gray-700">{d.to}</div>
                  <div className="text-xs text-gray-400">{d.customer}</div>
                </td>
                <td className="px-3 py-2.5 text-gray-800">{d.subject}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{d.template}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{d.trigger}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{d.scheduled}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", pb[d.priority])}>{d.priority}</span>
                </td>
                <td className="px-3 py-2.5 text-amber-600 text-xs">{d.retryAt}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => toast.show(`${d.id} を即時送信しました`, "success")}
                      className="p-1.5 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                      title="即時送信"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toast.show(`${d.id} を編集します`, "info")}
                      className="p-1.5 rounded-lg bg-gray-500/10 text-gray-700 hover:bg-gray-500/20"
                      title="編集"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toast.show(`${d.id} を一時保留しました`, "info")}
                      className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                      title="保留"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toast.show(`${d.id} をキャンセルしました`, "info")}
                      className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25"
                      title="キャンセル"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-sm text-gray-400">該当する送信待ちキューがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2">
            自動リトライ設定 <HelpHint>送信失敗時の自動リトライ間隔・最大回数を設定。SMTP の一時障害や宛先不明時の再送制御に利用します。</HelpHint>
          </h2>
          <SecondaryButton onClick={() => toast.show("自動リトライ設定を更新しました", "success")}>保存</SecondaryButton>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs text-gray-500">リトライ間隔（分）</span>
            <input type="number" defaultValue={30} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">最大リトライ回数</span>
            <input type="number" defaultValue={3} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">最大失敗時の通知先</span>
            <input type="email" defaultValue="ops@example.com" className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
        </div>
      </GlassCard>
    </div>
  );
}
