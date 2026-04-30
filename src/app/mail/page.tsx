"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from "lucide-react";

type TabValue = "pending" | "history" | "templates";

const tabs: { label: string; value: TabValue; count?: number }[] = [
  { label: "送信待ち", value: "pending", count: 8 },
  { label: "送信履歴", value: "history", count: 1245 },
  { label: "テンプレート", value: "templates", count: 12 },
];

const pending = [
  { id: "Q-20260430-0042", to: "yamada@example.com", customer: "山田 太郎", subject: "【ご注文ありがとうございます】ORD-2026-08423", type: "サンクスメール", scheduled: "2026/04/30 10:00", priority: "通常", trigger: "受注確認" },
  { id: "Q-20260430-0041", to: "sato@example.com", customer: "佐藤 花子", subject: "【出荷完了のお知らせ】ORD-2026-08418", type: "出荷通知", scheduled: "2026/04/30 10:00", priority: "通常", trigger: "出荷完了" },
  { id: "Q-20260430-0040", to: "tanaka@example.com", customer: "田中 一郎", subject: "【入金確認のお願い】ORD-2026-08410", type: "入金確認", scheduled: "2026/04/30 11:00", priority: "高", trigger: "入金待ち3日" },
  { id: "Q-20260430-0039", to: "watanabe@example.com", customer: "渡辺 美咲", subject: "【発送のお知らせ】ORD-2026-08405", type: "出荷通知", scheduled: "2026/04/30 11:30", priority: "通常", trigger: "出荷完了" },
  { id: "Q-20260430-0038", to: "kimura@example.com", customer: "木村 健", subject: "【商品到着確認のお願い】ORD-2026-08395", type: "フォロー", scheduled: "2026/04/30 14:00", priority: "低", trigger: "発送後3日" },
  { id: "Q-20260430-0037", to: "ito@example.com", customer: "伊藤 さくら", subject: "【ご注文ありがとうございます】ORD-2026-08394", type: "サンクスメール", scheduled: "2026/04/30 14:00", priority: "通常", trigger: "受注確認" },
  { id: "Q-20260430-0036", to: "kobayashi@example.com", customer: "小林 大輔", subject: "【入金確認のお願い】ORD-2026-08390", type: "入金確認", scheduled: "2026/04/30 15:00", priority: "高", trigger: "入金待ち5日" },
  { id: "Q-20260430-0035", to: "yoshida@example.com", customer: "吉田 あゆみ", subject: "【再発送のお知らせ】ORD-2026-08385", type: "出荷通知", scheduled: "2026/04/30 16:00", priority: "通常", trigger: "再発送" },
];

const history = [
  { id: "M-20260430-0125", to: "takahashi@example.com", customer: "高橋 涼", subject: "【ご注文ありがとうございます】ORD-2026-08380", type: "サンクスメール", sent: "2026/04/30 09:32", status: "送信済", retry: 0 },
  { id: "M-20260430-0124", to: "watanabe2@example.com", customer: "渡部 雄一", subject: "【出荷完了のお知らせ】ORD-2026-08376", type: "出荷通知", sent: "2026/04/30 09:18", status: "送信済", retry: 0 },
  { id: "M-20260430-0123", to: "ito2@example.com", customer: "伊藤 真理子", subject: "【入金確認のお願い】ORD-2026-08370", type: "入金確認", sent: "2026/04/30 09:00", status: "エラー", retry: 2 },
  { id: "M-20260430-0122", to: "suzuki@example.com", customer: "鈴木 翼", subject: "【発送遅延のお詫び】ORD-2026-08365", type: "お詫び", sent: "2026/04/30 08:45", status: "送信済", retry: 0 },
  { id: "M-20260430-0121", to: "matsumoto@example.com", customer: "松本 由香", subject: "【ご注文ありがとうございます】ORD-2026-08360", type: "サンクスメール", sent: "2026/04/30 08:20", status: "送信済", retry: 0 },
  { id: "M-20260429-0418", to: "invalid@example", customer: "—", subject: "【受注確認】ORD-2026-08355", type: "サンクスメール", sent: "2026/04/29 22:30", status: "エラー", retry: 3 },
  { id: "M-20260429-0417", to: "yamamoto@example.com", customer: "山本 健司", subject: "【発送通知】ORD-2026-08348", type: "出荷通知", sent: "2026/04/29 22:00", status: "送信済", retry: 0 },
];

const templates = [
  { name: "サンクスメール（自動）", type: "自動送信", trigger: "受注確認", updated: "2026/04/01", uses: 1245 },
  { name: "出荷通知メール（自動）", type: "自動送信", trigger: "出荷完了", updated: "2026/03/28", uses: 980 },
  { name: "入金確認メール（自動）", type: "自動送信", trigger: "入金待ち3日", updated: "2026/03/25", uses: 312 },
  { name: "発送遅延のお詫び", type: "手動", trigger: "—", updated: "2026/03/20", uses: 45 },
  { name: "再発送のお知らせ", type: "手動", trigger: "—", updated: "2026/03/15", uses: 32 },
  { name: "フォローアップメール", type: "自動送信", trigger: "発送後3日", updated: "2026/03/10", uses: 580 },
  { name: "在庫切れご連絡", type: "手動", trigger: "—", updated: "2026/03/05", uses: 18 },
  { name: "返品受付のお知らせ", type: "手動", trigger: "—", updated: "2026/02/28", uses: 24 },
];

const typeBadge: Record<string, string> = {
  サンクスメール: "bg-blue-500/15 text-blue-700",
  出荷通知: "bg-emerald-500/15 text-emerald-700",
  入金確認: "bg-orange-500/15 text-orange-700",
  フォロー: "bg-violet-500/15 text-violet-700",
  お詫び: "bg-rose-500/15 text-rose-700",
};

const priorityBadge: Record<string, string> = {
  高: "bg-red-500/15 text-red-700",
  通常: "bg-gray-500/15 text-gray-700",
  低: "bg-gray-400/10 text-gray-500",
};

export default function MailPage() {
  const toast = useToast();
  const [tab, setTab] = useState<TabValue>("pending");
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredPending = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return pending.filter((p) => {
      if (k && !`${p.to} ${p.subject} ${p.customer}`.toLowerCase().includes(k)) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (priorityFilter !== "all" && p.priority !== priorityFilter) return false;
      return true;
    });
  }, [keyword, typeFilter, priorityFilter]);

  const filteredHistory = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return history.filter((h) => {
      if (k && !`${h.to} ${h.subject} ${h.customer}`.toLowerCase().includes(k)) return false;
      if (typeFilter !== "all" && h.type !== typeFilter) return false;
      if (statusFilter !== "all" && h.status !== statusFilter) return false;
      return true;
    });
  }, [keyword, typeFilter, statusFilter]);

  const kpis = [
    { label: "本日送信済", value: history.filter((h) => h.sent.startsWith("2026/04/30") && h.status === "送信済").length, hint: "本日中に送信完了したメール件数", color: "text-emerald-600" },
    { label: "送信待ち", value: pending.length, hint: "送信キューに待機中のメール件数", color: "text-blue-600" },
    { label: "本日エラー", value: history.filter((h) => h.status === "エラー").length, hint: "送信失敗（要リトライ・要対応）", color: "text-red-600" },
    { label: "登録テンプレート", value: templates.length, hint: "自動・手動を含む登録済みテンプレート数", color: "text-gray-700" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">メール管理</h1>
            <HelpHint>受注フローと連動して自動送信される顧客メールを一元管理します。送信待ちキュー・送信履歴・テンプレートをタブで切替できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">受注確認・出荷通知・入金催促・フォローを自動配信。テンプレートと SMTP サーバー設定はサイドメニューから。</p>
        </div>
        <div className="flex items-center gap-2">
          <SecondaryButton onClick={() => toast.show("送信キューを再読込しました", "info")}>
            <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-4 w-4" />再読込</span>
          </SecondaryButton>
          <PrimaryButton onClick={() => toast.show("フリーメール送信画面を開きます", "info")}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />フリーメール送信</span>
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

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all",
                tab === t.value
                  ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                  : "text-gray-500 hover:bg-white/40"
              )}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-md text-xs",
                    tab === t.value ? "bg-blue-500/15 text-blue-700" : "bg-gray-500/10 text-gray-500"
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="宛先・件名・顧客名で検索"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">種類: すべて</option>
            <option value="サンクスメール">サンクスメール</option>
            <option value="出荷通知">出荷通知</option>
            <option value="入金確認">入金確認</option>
            <option value="フォロー">フォロー</option>
            <option value="お詫び">お詫び</option>
          </select>
          {tab === "pending" && (
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
          )}
          {tab === "history" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            >
              <option value="all">状態: すべて</option>
              <option value="送信済">送信済</option>
              <option value="エラー">エラー</option>
            </select>
          )}
          <SecondaryButton onClick={() => { setKeyword(""); setTypeFilter("all"); setPriorityFilter("all"); setStatusFilter("all"); }}>
            クリア
          </SecondaryButton>
        </div>
      </GlassCard>

      {tab === "pending" && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/40 bg-white/40">
            <div className="text-xs text-gray-500">{filteredPending.length} 件 / 全 {pending.length} 件</div>
            <div className="flex items-center gap-2">
              <SecondaryButton onClick={() => toast.show("選択したメールを送信キャンセルしました", "info")}>
                <span className="inline-flex items-center gap-1.5"><Trash2 className="h-4 w-4" />キャンセル</span>
              </SecondaryButton>
              <PrimaryButton onClick={() => toast.show("選択したメールを即時送信しました", "success")}>
                <span className="inline-flex items-center gap-1.5"><Send className="h-4 w-4" />即時送信</span>
              </PrimaryButton>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/40 border-b border-white/40">
                <th className="px-3 py-3 w-10"><input type="checkbox" className="accent-blue-500" /></th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">キューID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">宛先</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">件名</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">トリガー</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">種類</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">優先度</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">送信予定</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredPending.map((m) => (
                <tr key={m.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5"><input type="checkbox" className="accent-blue-500" /></td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{m.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-gray-700">{m.to}</div>
                    <div className="text-xs text-gray-400">{m.customer}</div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-800">{m.subject}</td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs">{m.trigger}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", typeBadge[m.type] || "bg-gray-500/15 text-gray-600")}>{m.type}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", priorityBadge[m.priority])}>{m.priority}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs">{m.scheduled}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => toast.show(`${m.id} を編集します`, "info")}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 inline-flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />編集
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPending.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-sm text-gray-400">該当するメールがありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </GlassCard>
      )}

      {tab === "history" && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/40 bg-white/40">
            <div className="text-xs text-gray-500">{filteredHistory.length} 件 / 全 {history.length} 件</div>
            <SecondaryButton onClick={() => toast.show("送信履歴をCSVで書き出しました", "success")}>
              CSVダウンロード
            </SecondaryButton>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/40 border-b border-white/40">
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">送信ID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">宛先</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">件名</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">種類</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">送信日時</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">再送回数</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((m) => (
                <tr key={m.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{m.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-gray-700">{m.to}</div>
                    <div className="text-xs text-gray-400">{m.customer}</div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-800">{m.subject}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", typeBadge[m.type] || "bg-gray-500/15 text-gray-600")}>{m.type}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs">{m.sent}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1",
                        m.status === "送信済" ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"
                      )}
                    >
                      {m.status === "送信済" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {m.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-500 text-xs">{m.retry}</td>
                  <td className="px-3 py-2.5 text-center">
                    {m.status === "エラー" ? (
                      <button
                        onClick={() => toast.show(`${m.id} を再送しました`, "success")}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 inline-flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />再送
                      </button>
                    ) : (
                      <button
                        onClick={() => toast.show(`${m.id} の本文を表示します`, "info")}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                      >
                        本文
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-400">該当する送信履歴がありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </GlassCard>
      )}

      {tab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <GlassCard key={t.name} className="hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{t.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">トリガー: {t.trigger}</p>
                  </div>
                </div>
                <button className="p-1 rounded-lg hover:bg-white/60 text-gray-400">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-md font-medium",
                    t.type === "自動送信" ? "bg-emerald-500/15 text-emerald-700" : "bg-gray-500/15 text-gray-600"
                  )}
                >
                  {t.type}
                </span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />更新: {t.updated}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">送信実績: <span className="text-gray-800 font-medium">{t.uses.toLocaleString()} 件</span></span>
                <button
                  onClick={() => toast.show(`${t.name} を編集します`, "info")}
                  className="px-3 py-1 rounded-lg font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                >
                  編集
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
