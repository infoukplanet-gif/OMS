"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import type { MailRecord } from "@/lib/state-machines/mail";
import { mailStore } from "@/lib/stores/mail";
import { MAIL_SEEDS } from "@/lib/seeds/mail";
import { syncMailQueueIntoStore } from "@/lib/mail/log-bridge";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Mail,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from "lucide-react";

// ---------- 型定義 ----------

type TabValue = "pending" | "history" | "templates";

type TemplateItem = {
  name: string;
  type: string;
  trigger: string;
  updated: string;
  uses: number;
  subject: string;
  body: string;
};

// ---------- 初期データ（テンプレートのみページローカル） ----------

const INITIAL_TEMPLATES: TemplateItem[] = [
  { name: "サンクスメール（自動）", type: "自動送信", trigger: "受注確認", updated: "2026/04/01", uses: 1245, subject: "【ご注文ありがとうございます】ORD-XXXX", body: "{{customer_name}} 様\n\nご注文いただきありがとうございます。\nご注文番号：{{order_id}}\n\n発送準備が整い次第ご連絡いたします。" },
  { name: "出荷通知メール（自動）", type: "自動送信", trigger: "出荷完了", updated: "2026/03/28", uses: 980, subject: "【出荷のお知らせ】{{order_id}}", body: "{{customer_name}} 様\n\nご注文の商品を発送いたしました。\n配送業者：{{shipping_carrier}}\nお問い合わせ番号：{{tracking_number}}\n到着予定：{{delivery_date}}" },
  { name: "入金確認メール（自動）", type: "自動送信", trigger: "入金待ち3日", updated: "2026/03/25", uses: 312, subject: "【お支払いのお願い】{{order_id}}", body: "{{customer_name}} 様\n\n{{order_id}} のご入金がまだ確認できておりません。\nお支払期限：{{payment_deadline}}\n\nご対応をお願いいたします。" },
  { name: "発送遅延のお詫び", type: "手動", trigger: "—", updated: "2026/03/20", uses: 45, subject: "【お詫び】発送遅延のご連絡（{{order_id}}）", body: "{{customer_name}} 様\n\nご注文 {{order_id}} につきまして発送が遅延しております。\n大変申し訳ございません。\n発送見込み日：{{ship_eta}}" },
  { name: "再発送のお知らせ", type: "手動", trigger: "—", updated: "2026/03/15", uses: 32, subject: "【再発送】商品再発送のお知らせ（{{order_id}}）", body: "{{customer_name}} 様\n\n{{order_id}} の商品を再発送いたしました。\n配送業者：{{shipping_carrier}}\n到着予定：{{delivery_date}}" },
  { name: "フォローアップメール", type: "自動送信", trigger: "発送後3日", updated: "2026/03/10", uses: 580, subject: "商品はお手元に届きましたか？（{{order_id}}）", body: "{{customer_name}} 様\n\n商品はお手元に届きましたでしょうか。\n万が一、未着・破損などございましたらご連絡ください。" },
  { name: "在庫切れご連絡", type: "手動", trigger: "—", updated: "2026/03/05", uses: 18, subject: "【ご連絡】在庫切れのお知らせ（{{order_id}}）", body: "{{customer_name}} 様\n\nご注文いただきました商品が在庫切れとなりました。\nご対応の選択肢をご案内いたします。" },
  { name: "返品受付のお知らせ", type: "手動", trigger: "—", updated: "2026/02/28", uses: 24, subject: "【受付】返品受付完了のお知らせ（{{order_id}}）", body: "{{customer_name}} 様\n\n返品の受付を承りました。\n返送先：{{return_address}}\n\nご対応よろしくお願いいたします。" },
];

// ---------- 定数 ----------

const tabs: { label: string; value: TabValue }[] = [
  { label: "送信待ち", value: "pending" },
  { label: "送信履歴", value: "history" },
  { label: "テンプレート", value: "templates" },
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

const statusBadge: Record<string, string> = {
  送信待ち: "bg-blue-500/15 text-blue-700",
  保留: "bg-amber-500/15 text-amber-700",
  送信済: "bg-emerald-500/15 text-emerald-700",
  エラー: "bg-red-500/15 text-red-700",
  キャンセル済: "bg-gray-400/10 text-gray-500",
};

/** 表示・状態遷移に使う現在時刻（YYYY/MM/DD HH:mm） */
function formatNow(): string {
  const now = new Date();
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// ---------- テンプレート編集モーダル ----------

type EditTemplateModalProps = {
  template: TemplateItem;
  onClose: () => void;
  onSave: (updated: TemplateItem) => void;
};

function EditTemplateModal({ template, onClose, onSave }: EditTemplateModalProps) {
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [trigger, setTrigger] = useState(template.trigger);

  return (
    <Modal
      open
      onClose={onClose}
      title="テンプレート編集"
      size="lg"
      footer={
        <>
          <SecondaryButton onClick={onClose}>キャンセル</SecondaryButton>
          <PrimaryButton
            onClick={() => onSave({ ...template, name, subject, body, trigger, updated: new Date().toLocaleDateString("ja-JP").replace(/\//g, "/") })}
          >
            保存
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <label className="block space-y-1">
          <span className="text-xs text-gray-500">テンプレート名</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-9 px-3 rounded-xl bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-gray-500">トリガー</span>
          <input
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            className="w-full h-9 px-3 rounded-xl bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-gray-500">件名</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full h-9 px-3 rounded-xl bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-xs"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-gray-500">本文</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 rounded-xl bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-xs leading-relaxed resize-none"
          />
        </label>
      </div>
    </Modal>
  );
}

// ---------- 本文プレビューモーダル ----------

type BodyPreviewModalProps = {
  mailId: string;
  subject: string;
  to: string;
  body: string;
  sentAt?: string;
  onClose: () => void;
};

function BodyPreviewModal({ mailId, subject, to, body, sentAt, onClose }: BodyPreviewModalProps) {
  return (
    <Modal open onClose={onClose} title="メール本文プレビュー" size="lg">
      <div className="space-y-3 text-sm">
        <div className="rounded-xl bg-white/50 border border-white/50 p-3 space-y-1.5">
          <div className="flex gap-2 text-xs">
            <span className="text-gray-400 w-16 shrink-0">送信ID</span>
            <span className="text-gray-600 font-mono">{mailId}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-gray-400 w-16 shrink-0">宛先</span>
            <span className="text-gray-700">{to}</span>
          </div>
          {sentAt && (
            <div className="flex gap-2 text-xs">
              <span className="text-gray-400 w-16 shrink-0">送信日時</span>
              <span className="text-gray-500">{sentAt}</span>
            </div>
          )}
          <div className="flex gap-2 text-xs">
            <span className="text-gray-400 w-16 shrink-0">件名</span>
            <span className="text-gray-800 font-medium">{subject}</span>
          </div>
        </div>
        <div className="rounded-xl bg-white/50 border border-white/50 p-4">
          <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{body}</pre>
        </div>
      </div>
    </Modal>
  );
}

// ---------- 送信待ちメール編集モーダル ----------

type EditPendingModalProps = {
  mail: MailRecord;
  onClose: () => void;
  onSave: (id: string, patch: { subject: string; body: string; scheduled: string }) => void;
};

function EditPendingModal({ mail, onClose, onSave }: EditPendingModalProps) {
  const [subject, setSubject] = useState(mail.subject);
  const [body, setBody] = useState(mail.body);
  const [scheduled, setScheduled] = useState(mail.scheduled);

  return (
    <Modal
      open
      onClose={onClose}
      title="送信待ちメール編集"
      size="lg"
      footer={
        <>
          <SecondaryButton onClick={onClose}>キャンセル</SecondaryButton>
          <PrimaryButton onClick={() => onSave(mail.id, { subject, body, scheduled })}>
            保存
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="rounded-xl bg-white/40 border border-white/40 p-3 text-xs text-gray-500 space-y-1">
          <div><span className="text-gray-400">キューID: </span><span className="font-mono">{mail.id}</span></div>
          <div><span className="text-gray-400">宛先: </span>{mail.to}（{mail.customer}）</div>
          <div><span className="text-gray-400">トリガー: </span>{mail.trigger}</div>
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-gray-500">件名</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full h-9 px-3 rounded-xl bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-xs"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-gray-500">送信予定日時</span>
          <input
            value={scheduled}
            onChange={(e) => setScheduled(e.target.value)}
            placeholder="2026/04/30 10:00"
            className="w-full h-9 px-3 rounded-xl bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-gray-500">本文</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 rounded-xl bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-xs leading-relaxed resize-none"
          />
        </label>
      </div>
    </Modal>
  );
}

// ---------- メインコンポーネント ----------

export default function MailPage() {
  const toast = useToast();
  const router = useRouter();

  // 永続化（domain "mails" の正規オーナーページはここのみ）
  usePersistentStore({ store: mailStore, domain: "mails", seed: MAIL_SEEDS });

  // 共有ストア購読（mail/pending・mail/history と同一データ）
  const mails = useSyncExternalStore(mailStore.subscribe, mailStore.getState, mailStore.getState);

  // セッション内の自動キュー（cascade enqueue 分）を冪等同期。
  // restore/seed の setItems 後にも再実行されるよう mails を依存に持つ（register が id 重複を弾くので収束する）。
  useEffect(() => {
    syncMailQueueIntoStore();
  }, [mails]);

  const [tab, setTab] = useState<TabValue>("pending");
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // テンプレートデータ（ページ内可変・ストア対象外）
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>(INITIAL_TEMPLATES);

  // チェックボックス選択
  const [selectedPending, setSelectedPending] = useState<Set<string>>(new Set());

  // モーダル状態
  const [bodyPreview, setBodyPreview] = useState<{ mailId: string; subject: string; to: string; body: string; sentAt?: string } | null>(null);
  const [editPending, setEditPending] = useState<MailRecord | null>(null);
  const [editTemplate, setEditTemplate] = useState<TemplateItem | null>(null);

  // ---------- ステータス別ビュー ----------

  const pendingMails = useMemo(
    () => mails.filter((m) => m.status === "送信待ち" || m.status === "保留"),
    [mails],
  );

  const historyMails = useMemo(
    () => mails.filter((m) => m.status === "送信済" || m.status === "エラー" || m.status === "キャンセル済"),
    [mails],
  );

  // ---------- フィルタリング ----------

  const filteredPending = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return pendingMails.filter((p) => {
      if (k && !`${p.to} ${p.subject} ${p.customer}`.toLowerCase().includes(k)) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (priorityFilter !== "all" && p.priority !== priorityFilter) return false;
      return true;
    });
  }, [pendingMails, keyword, typeFilter, priorityFilter]);

  const filteredHistory = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return historyMails.filter((h) => {
      if (k && !`${h.to} ${h.subject} ${h.customer}`.toLowerCase().includes(k)) return false;
      if (typeFilter !== "all" && h.type !== typeFilter) return false;
      if (statusFilter !== "all" && h.status !== statusFilter) return false;
      return true;
    });
  }, [historyMails, keyword, typeFilter, statusFilter]);

  // ---------- KPIs ----------

  const today = formatNow().slice(0, 10);
  const kpis = [
    { label: "本日送信済", value: mails.filter((m) => m.status === "送信済" && (m.sentAt?.startsWith(today) || m.sentAt?.startsWith("2026/04/30"))).length, hint: "本日中に送信完了したメール件数", color: "text-emerald-600" },
    { label: "送信待ち", value: mails.filter((m) => m.status === "送信待ち").length, hint: "送信キューに待機中のメール件数", color: "text-blue-600" },
    { label: "エラー", value: mails.filter((m) => m.status === "エラー").length, hint: "送信失敗（要リトライ・要対応）", color: "text-red-600" },
    { label: "登録テンプレート", value: templateItems.length, hint: "自動・手動を含む登録済みテンプレート数", color: "text-gray-700" },
  ];

  // ---------- ハンドラ ----------

  // 自動キュー再同期
  const handleReload = useCallback(() => {
    const added = syncMailQueueIntoStore();
    setSelectedPending(new Set());
    toast.show(added > 0 ? `自動キューを同期しました（${added} 件追加）` : "送信キューは最新です", "info");
  }, [toast]);

  // 選択チェックボックス
  const toggleSelect = useCallback((id: string) => {
    setSelectedPending((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedPending.size === filteredPending.length) {
      setSelectedPending(new Set());
    } else {
      setSelectedPending(new Set(filteredPending.map((p) => p.id)));
    }
  }, [selectedPending.size, filteredPending]);

  // 選択メールへ一括遷移を適用する共通処理
  const applyBulk = useCallback(
    (action: "send" | "hold" | "cancel", successMessage: (n: number) => string) => {
      if (selectedPending.size === 0) {
        toast.show("対象のメールを選択してください", "error");
        return;
      }
      const now = formatNow();
      let applied = 0;
      for (const id of selectedPending) {
        if (mailStore.applyTransition(id, action, now).applied) applied++;
      }
      if (applied > 0) {
        toast.show(successMessage(applied), action === "send" ? "success" : "info");
      } else {
        toast.show("選択したメールには適用できませんでした", "error");
      }
      setSelectedPending(new Set());
    },
    [selectedPending, toast],
  );

  const handleBulkSend = useCallback(() => applyBulk("send", (n) => `${n} 件を即時送信しました`), [applyBulk]);
  const handleBulkHold = useCallback(() => applyBulk("hold", (n) => `${n} 件を保留にしました`), [applyBulk]);
  const handleBulkCancel = useCallback(() => applyBulk("cancel", (n) => `${n} 件の送信をキャンセルしました`), [applyBulk]);

  // 保留 → 送信待ちへ再開
  const handleResume = useCallback((id: string) => {
    if (mailStore.applyTransition(id, "resume").applied) {
      toast.show(`${id} を送信待ちに戻しました`, "info");
    }
  }, [toast]);

  // 履歴 再送（エラーのみ）
  const handleRetry = useCallback((id: string) => {
    if (mailStore.applyTransition(id, "resend", formatNow()).applied) {
      toast.show(`${id} を再送しました`, "success");
    } else {
      toast.show("このメールは再送できません", "error");
    }
  }, [toast]);

  // 送信待ちメール編集の保存
  const handlePendingSave = useCallback((id: string, patch: { subject: string; body: string; scheduled: string }) => {
    if (mailStore.patch(id, patch)) {
      toast.show(`${id} を更新しました`, "success");
    }
    setEditPending(null);
  }, [toast]);

  // CSV書き出し
  const handleCsvDownload = useCallback(() => {
    const headers = ["送信ID", "宛先", "顧客名", "件名", "種類", "送信日時", "状態", "再送回数"];
    const rows = filteredHistory.map((m) => [m.id, m.to, m.customer, m.subject, m.type, m.sentAt ?? "—", m.status, String(m.retry)]);
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const bom = "﻿";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `送信履歴_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.show("送信履歴をCSVで書き出しました", "success");
  }, [filteredHistory, toast]);

  // テンプレート保存
  const handleTemplateSave = useCallback((updated: TemplateItem) => {
    setTemplateItems((prev) => prev.map((t) => t.name === editTemplate?.name ? updated : t));
    setEditTemplate(null);
    toast.show(`${updated.name} を保存しました`, "success");
  }, [editTemplate, toast]);

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">メール管理</h1>
            <HelpHint>受注フローと連動して自動送信される顧客メールを一元管理します。送信待ちキュー・送信履歴・テンプレートをタブで切替できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">受注確認・出荷通知・入金催促・フォローを自動配信。テンプレートと SMTP サーバー設定はサイドメニューから。</p>
        </div>
        <div className="flex items-center gap-2">
          <SecondaryButton onClick={handleReload}>
            <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-4 w-4" />再読込</span>
          </SecondaryButton>
          <PrimaryButton onClick={() => router.push("/mail/compose")}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />フリーメール送信</span>
          </PrimaryButton>
        </div>
      </div>

      {/* KPIカード */}
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

      {/* タブ */}
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
            </button>
          ))}
        </div>
      </div>

      {/* フィルタ行 */}
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
              <option value="キャンセル済">キャンセル済</option>
            </select>
          )}
          <SecondaryButton onClick={() => { setKeyword(""); setTypeFilter("all"); setPriorityFilter("all"); setStatusFilter("all"); }}>
            クリア
          </SecondaryButton>
        </div>
      </GlassCard>

      {/* ---------- 送信待ちタブ ---------- */}
      {tab === "pending" && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/40 bg-white/40">
            <div className="text-xs text-gray-500">
              {filteredPending.length} 件 / 全 {pendingMails.length} 件
              {selectedPending.size > 0 && <span className="ml-2 text-blue-600 font-medium">{selectedPending.size} 件選択中</span>}
            </div>
            <div className="flex items-center gap-2">
              <SecondaryButton onClick={handleBulkCancel}>
                <span className="inline-flex items-center gap-1.5"><Trash2 className="h-4 w-4" />キャンセル</span>
              </SecondaryButton>
              <SecondaryButton onClick={handleBulkHold}>
                <span className="inline-flex items-center gap-1.5"><Pause className="h-4 w-4" />保留</span>
              </SecondaryButton>
              <PrimaryButton onClick={handleBulkSend}>
                <span className="inline-flex items-center gap-1.5"><Send className="h-4 w-4" />即時送信</span>
              </PrimaryButton>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/40 border-b border-white/40">
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    checked={filteredPending.length > 0 && selectedPending.size === filteredPending.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">キューID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">宛先</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">件名</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">トリガー</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">種類</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">優先度</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">送信予定</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredPending.map((m) => (
                <tr key={m.id} className={cn("border-t border-white/30 hover:bg-white/40", selectedPending.has(m.id) && "bg-blue-500/5")}>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="accent-blue-500"
                      checked={selectedPending.has(m.id)}
                      onChange={() => toggleSelect(m.id)}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{m.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-gray-700">{m.to}</div>
                    <div className="text-xs text-gray-400">{m.customer}</div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-800">{m.subject}</td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs">{m.trigger}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", typeBadge[m.type] ?? "bg-gray-500/15 text-gray-600")}>{m.type}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", priorityBadge[m.priority])}>{m.priority}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusBadge[m.status])}>{m.status}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs">{m.scheduled}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="inline-flex items-center gap-1">
                      {m.status === "保留" && (
                        <button
                          onClick={() => handleResume(m.id)}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 inline-flex items-center gap-1"
                        >
                          <Play className="h-3 w-3" />再開
                        </button>
                      )}
                      <button
                        onClick={() => setEditPending(m)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 inline-flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />編集
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPending.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-sm text-gray-400">該当するメールがありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* ---------- 送信履歴タブ ---------- */}
      {tab === "history" && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/40 bg-white/40">
            <div className="text-xs text-gray-500">{filteredHistory.length} 件 / 全 {historyMails.length} 件</div>
            <SecondaryButton onClick={handleCsvDownload}>
              <span className="inline-flex items-center gap-1.5"><Download className="h-4 w-4" />CSVダウンロード</span>
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
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", typeBadge[m.type] ?? "bg-gray-500/15 text-gray-600")}>{m.type}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs">{m.sentAt ?? "—"}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1",
                        statusBadge[m.status]
                      )}
                    >
                      {m.status === "送信済" ? <CheckCircle2 className="h-3 w-3" /> : m.status === "エラー" ? <AlertCircle className="h-3 w-3" /> : null}
                      {m.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-500 text-xs">{m.retry}</td>
                  <td className="px-3 py-2.5 text-center">
                    {m.status === "エラー" ? (
                      <button
                        onClick={() => handleRetry(m.id)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 inline-flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />再送
                      </button>
                    ) : (
                      <button
                        onClick={() => setBodyPreview({ mailId: m.id, subject: m.subject, to: m.to, body: m.body, sentAt: m.sentAt ?? undefined })}
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

      {/* ---------- テンプレートタブ ---------- */}
      {tab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templateItems.map((t) => (
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
                <button
                  onClick={() => setBodyPreview({ mailId: "—", subject: t.subject, to: "（プレビュー）", body: t.body })}
                  className="p-1 rounded-lg hover:bg-white/60 text-gray-400"
                  title="本文プレビュー"
                >
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
                  onClick={() => setEditTemplate(t)}
                  className="px-3 py-1 rounded-lg font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 inline-flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />編集
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* ---------- モーダル ---------- */}

      {bodyPreview && (
        <BodyPreviewModal
          mailId={bodyPreview.mailId}
          subject={bodyPreview.subject}
          to={bodyPreview.to}
          body={bodyPreview.body}
          sentAt={bodyPreview.sentAt}
          onClose={() => setBodyPreview(null)}
        />
      )}

      {editPending && (
        <EditPendingModal
          mail={editPending}
          onClose={() => setEditPending(null)}
          onSave={handlePendingSave}
        />
      )}

      {editTemplate && (
        <EditTemplateModal
          template={editTemplate}
          onClose={() => setEditTemplate(null)}
          onSave={handleTemplateSave}
        />
      )}

    </div>
  );
}
