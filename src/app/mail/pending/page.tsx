"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Pause, Play, Search, Send, Trash2 } from "lucide-react";
import type { MailTriggerType } from "@/lib/mail/queue";
import { mailStore } from "@/lib/stores/mail";
import { syncMailQueueIntoStore } from "@/lib/mail/log-bridge";

const pb: Record<string, string> = {
  高: "bg-red-500/15 text-red-700",
  通常: "bg-gray-500/15 text-gray-700",
  低: "bg-gray-400/10 text-gray-500",
};

const statusBadge: Record<string, string> = {
  送信待ち: "bg-blue-500/15 text-blue-700",
  保留: "bg-amber-500/15 text-amber-700",
};

const triggerLabel: Record<MailTriggerType, string> = {
  thanks: "受注確認（サンクス）",
  "ship-notify": "出荷完了通知",
  "delivery-notify": "配送通知（追跡番号）",
  "payment-confirmed": "入金確認",
  "payment-reminder-3d": "入金催促（3日超過）",
  "payment-final-call-7d": "最終催告（7日超過）",
  "follow-up": "フォローアップ（配達完了）",
  "rebill-mismatch": "再請求（差額不足）",
};

const triggerBadge: Record<MailTriggerType, string> = {
  thanks: "bg-blue-500/15 text-blue-700",
  "ship-notify": "bg-emerald-500/15 text-emerald-700",
  "delivery-notify": "bg-purple-500/15 text-purple-700",
  "payment-confirmed": "bg-violet-500/15 text-violet-700",
  "payment-reminder-3d": "bg-amber-500/15 text-amber-700",
  "payment-final-call-7d": "bg-red-500/15 text-red-700",
  "follow-up": "bg-teal-500/15 text-teal-700",
  "rebill-mismatch": "bg-rose-500/15 text-rose-700",
};

/** 状態遷移に使う現在時刻（YYYY/MM/DD HH:mm） */
function formatNow(): string {
  const now = new Date();
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export default function MailPendingPage() {
  const toast = useToast();

  // 共有ストア購読（mail/page.tsx が永続化オーナー。ここは購読＋遷移のみ）
  const mails = useSyncExternalStore(mailStore.subscribe, mailStore.getState, mailStore.getState);

  // セッション内 cascade enqueue 分を冪等同期（register が id 重複を弾く）
  useEffect(() => {
    syncMailQueueIntoStore();
  }, [mails]);

  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [retryInterval, setRetryInterval] = useState(30);
  const [retryMaxCount, setRetryMaxCount] = useState(3);
  const [notifyEmail, setNotifyEmail] = useState("ops@example.com");

  const pending = useMemo(
    () => mails.filter((m) => m.status === "送信待ち" || m.status === "保留"),
    [mails],
  );

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return pending.filter((m) => {
      if (k && !`${m.to} ${m.subject} ${m.customer}`.toLowerCase().includes(k)) return false;
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (priorityFilter !== "all" && m.priority !== priorityFilter) return false;
      return true;
    });
  }, [pending, keyword, typeFilter, priorityFilter]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected((prev) => (prev.length === filtered.length ? [] : filtered.map((f) => f.id)));

  const types = Array.from(new Set(pending.map((m) => m.type)));

  // 単一メールへ遷移を適用
  const applyOne = useCallback(
    (id: string, action: "send" | "hold" | "resume" | "cancel", message: string) => {
      if (mailStore.applyTransition(id, action, formatNow()).applied) {
        toast.show(message, action === "send" ? "success" : "info");
      } else {
        toast.show(`${id} には適用できませんでした`, "error");
      }
    },
    [toast],
  );

  // 選択メールへ一括遷移を適用
  const applyBulk = useCallback(
    (action: "send" | "cancel", successMessage: (n: number) => string) => {
      if (selected.length === 0) {
        toast.show("対象のメールを選択してください", "error");
        return;
      }
      const now = formatNow();
      let applied = 0;
      for (const id of selected) {
        if (mailStore.applyTransition(id, action, now).applied) applied++;
      }
      if (applied > 0) {
        toast.show(successMessage(applied), action === "send" ? "success" : "info");
      } else {
        toast.show("選択したメールには適用できませんでした", "error");
      }
      setSelected([]);
    },
    [selected, toast],
  );

  const kpis = [
    { label: "送信待ち件数", value: pending.filter((m) => m.status === "送信待ち").length, hint: "送信予定キューの件数（保留を除く）", color: "text-blue-600" },
    { label: "保留中", value: pending.filter((m) => m.status === "保留").length, hint: "手動で保留にしたキュー。再開で送信待ちに戻ります", color: "text-amber-600" },
    { label: "高優先度", value: pending.filter((m) => m.priority === "高").length, hint: "高優先度（入金催促・受注確認等）", color: "text-red-600" },
    { label: "再送キュー", value: pending.filter((m) => m.retry > 0).length, hint: "過去に送信失敗し再送登録されたキュー", color: "text-orange-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">送信待ちキュー</h1>
            <HelpHint>送信予定のメールキュー一覧。即時送信・保留・キャンセルが可能です。受注/出荷/入金の自動連鎖で enqueue されたメールもここに合流します。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">受注ステータス変化で自動キューイングされたメールを確認・操作します。メール管理ページと同じ共有データを表示しています。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => applyBulk("cancel", (n) => `${n} 件をキャンセルしました`)}>
            <span className="inline-flex items-center gap-1.5"><Trash2 className="h-4 w-4" />選択をキャンセル</span>
          </SecondaryButton>
          <PrimaryButton onClick={() => applyBulk("send", (n) => `${n} 件を即時送信しました`)}>
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">種類: すべて</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
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
          <SecondaryButton onClick={() => { setKeyword(""); setTypeFilter("all"); setPriorityFilter("all"); }}>
            クリア
          </SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {filtered.length} 件 / 全 {pending.length} 件
            {selected.length > 0 && <span className="ml-3 text-blue-600 font-medium">{selected.length} 件選択中</span>}
          </div>
          <div className="text-xs text-gray-500">編集はメール管理ページから</div>
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
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">トリガー</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">送信予定</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">優先度</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className={cn("border-t border-white/30 hover:bg-white/40", selected.includes(m.id) && "bg-blue-500/5")}>
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    checked={selected.includes(m.id)}
                    onChange={() => toggle(m.id)}
                  />
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{m.id}</td>
                <td className="px-3 py-2.5">
                  <div className="text-gray-700">{m.to}</div>
                  <div className="text-xs text-gray-400">{m.customer}</div>
                </td>
                <td className="px-3 py-2.5 text-gray-800">{m.subject}</td>
                <td className="px-3 py-2.5">
                  {m.triggerType ? (
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", triggerBadge[m.triggerType])}>
                      {triggerLabel[m.triggerType]}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-xs">{m.trigger}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{m.scheduled}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", pb[m.priority])}>{m.priority}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusBadge[m.status])}>{m.status}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => applyOne(m.id, "send", `${m.id} を即時送信しました`)}
                      className="p-1.5 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                      title="即時送信"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                    {m.status === "保留" ? (
                      <button
                        onClick={() => applyOne(m.id, "resume", `${m.id} を送信待ちに戻しました`)}
                        className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                        title="再開"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => applyOne(m.id, "hold", `${m.id} を一時保留しました`)}
                        className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                        title="保留"
                      >
                        <Pause className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => applyOne(m.id, "cancel", `${m.id} をキャンセルしました`)}
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
                <td colSpan={9} className="px-3 py-8 text-center text-sm text-gray-400">該当する送信待ちキューがありません</td>
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
          <SecondaryButton
            onClick={() => {
              if (retryInterval < 1) {
                toast.show("リトライ間隔は1分以上で設定してください", "error");
                return;
              }
              if (retryMaxCount < 0) {
                toast.show("最大リトライ回数は0以上で設定してください", "error");
                return;
              }
              if (!notifyEmail.includes("@")) {
                toast.show("通知先メールアドレスの形式が不正です", "error");
                return;
              }
              toast.show(
                `自動リトライ設定を更新しました（間隔${retryInterval}分・最大${retryMaxCount}回）`,
                "success",
              );
            }}
          >
            保存
          </SecondaryButton>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs text-gray-500">リトライ間隔（分）</span>
            <input type="number" value={retryInterval} onChange={(e) => setRetryInterval(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">最大リトライ回数</span>
            <input type="number" value={retryMaxCount} onChange={(e) => setRetryMaxCount(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">最大失敗時の通知先</span>
            <input type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
        </div>
      </GlassCard>
    </div>
  );
}
