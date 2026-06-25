"use client";

/**
 * 配送番号サポートページ（出荷 > 配送番号サポート）。
 *
 * 問合せ一覧 (issues) は useState で管理する。
 * - 新規問合せ登録: モーダルで入力 → issues に追加
 * - ステータス更新: ドロップダウン直接変更 → issues をイミュータブル更新
 * - 返信メール送信: mailQueue の代わりに toast + lastUpdate 更新で表現
 * - 調査依頼: toast + lastUpdate 更新
 */

import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton, SecondaryButton, Modal } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  trackingSupportStore,
  INITIAL_TRACKING_SUPPORT_ISSUES,
  type TrackingSupportRecord,
  type TrackingSupportStatus,
  type TrackingSupportIssueType,
} from "@/lib/stores/shipment-tracking-support-store";
import { Search, RefreshCw, Phone, ExternalLink, MessageSquare, Plus } from "lucide-react";

type IssueStatus = TrackingSupportStatus;
type IssueType = TrackingSupportIssueType;
type Issue = TrackingSupportRecord;

const CARRIER_TRACKING_URL: Record<string, string> = {
  "ヤマト運輸": "https://toi.kuronekoyamato.co.jp/cgi-bin/tneko",
  "佐川急便": "https://k2k.sagawa-exp.co.jp/p/web/okurijoinput.do",
  "日本郵便": "https://trackings.post.japanpost.jp/services/srv/search/",
};

const BLANK_FORM = {
  order: "",
  customer: "",
  carrier: "ヤマト運輸",
  trackingNo: "",
  issue: "未到着遅延" as IssueType,
  assignee: "",
};

function nowString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${day} ${h}:${mi}`;
}

export default function ShipmentsTrackingSupportPage() {
  const toast = useToast();

  // 永続化（domain: "shipment-tracking-support-settings"）の正規オーナーページ。
  usePersistentStore({
    store: trackingSupportStore,
    domain: "shipment-tracking-support-settings",
    seed: INITIAL_TRACKING_SUPPORT_ISSUES,
  });
  const issues = useSyncExternalStore(
    trackingSupportStore.subscribe,
    trackingSupportStore.getState,
    trackingSupportStore.getState,
  );

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"すべて" | IssueStatus>("対応中");
  const [issueFilter, setIssueFilter] = useState("すべて");

  // 新規登録モーダル
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return issues.filter((i) => {
      if (k && !i.order.toLowerCase().includes(k) && !i.customer.toLowerCase().includes(k) && !i.trackingNo.toLowerCase().includes(k)) return false;
      if (statusFilter !== "すべて" && i.status !== statusFilter) return false;
      if (issueFilter !== "すべて" && i.issue !== issueFilter) return false;
      return true;
    });
  }, [issues, keyword, statusFilter, issueFilter]);

  const stats = useMemo(() => ({
    open: issues.filter((i) => i.status === "新規" || i.status === "対応中").length,
    overdue: issues.filter((i) => i.daysOpen >= 5 && i.status !== "解決済").length,
    newCount: issues.filter((i) => i.status === "新規").length,
    avgDays: Math.round(issues.filter((i) => i.status !== "解決済").reduce((s, i) => s + i.daysOpen, 0) / Math.max(1, issues.filter((i) => i.status !== "解決済").length)),
  }), [issues]);

  function updateIssueStatus(id: string, status: IssueStatus) {
    const current = issues.find((i) => i.id === id);
    if (!current) return;
    trackingSupportStore.upsert({ ...current, status, lastUpdate: nowString() });
    toast.show(`${id} のステータスを「${status}」に更新しました`, "success");
  }

  function handleReplyMail(issue: Issue) {
    trackingSupportStore.upsert({
      ...issue,
      lastUpdate: nowString(),
      status: issue.status === "新規" ? "対応中" : issue.status,
    });
    toast.show(`${issue.customer} さんへの返信メールを送信しました（${issue.order}）`, "success");
  }

  function handleInvestigationRequest(issue: Issue) {
    trackingSupportStore.upsert({
      ...issue,
      lastUpdate: nowString(),
      status: issue.status === "新規" ? "対応中" : issue.status,
    });
    toast.show(`${issue.carrier} へ ${issue.id} の調査依頼を送信しました`, "success");
  }

  function handleNewSubmit() {
    if (!form.order.trim()) { toast.show("受注番号を入力してください", "error"); return; }
    if (!form.customer.trim()) { toast.show("顧客名を入力してください", "error"); return; }
    if (!form.trackingNo.trim()) { toast.show("追跡番号を入力してください", "error"); return; }
    const id = `TS-${String(issues.length + 1).padStart(3, "0")}`;
    const newIssue: Issue = {
      id,
      order: form.order.trim(),
      customer: form.customer.trim(),
      carrier: form.carrier,
      trackingNo: form.trackingNo.trim(),
      issue: form.issue,
      daysOpen: 0,
      status: "新規",
      assignee: form.assignee.trim() || "—",
      lastUpdate: nowString(),
    };
    trackingSupportStore.upsert(newIssue);
    toast.show(`問合せ ${id} を登録しました`, "success");
    setNewModalOpen(false);
    setForm(BLANK_FORM);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">配送番号サポート</h1>
            <HelpHint>
              配送中の問い合わせ・トラブル（未到着・誤配送・破損・無効番号など）を一元管理します。{"\n"}
              配送業者の追跡サイトへのリンクと、お客様への返信・業者調査依頼をここから実行できます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未解決: <span className="font-semibold text-amber-700">{stats.open}件</span> ／ 5日以上滞留:{" "}
            <span className="font-semibold text-red-700">{stats.overdue}件</span>
          </p>
        </div>
        <PrimaryButton onClick={() => { setForm(BLANK_FORM); setNewModalOpen(true); }}>
          <Plus className="h-4 w-4" />新規問合せ登録
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">未解決</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.open}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">5日以上滞留</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.overdue}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">未着手（新規）</p><p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{stats.newCount}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">平均滞留日数</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.avgDays}<span className="text-sm font-normal ml-1">日</span></p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="受注番号・顧客名・追跡番号で検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">対応状態</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "新規", "対応中", "保留", "解決済"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">問題種別</label>
            <select
              value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "未到着遅延", "誤配送疑い", "破損連絡", "番号無効", "再配達依頼"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">配送業者</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">追跡番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">問題</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">滞留</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">担当</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-3 py-12 text-center text-gray-400">対象なし</td></tr>
            ) : (
              filtered.map((i) => (
                <tr key={i.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{i.id}</td>
                  <td className="px-3 py-2.5 font-medium text-blue-600">{i.order}</td>
                  <td className="px-3 py-2.5 text-gray-800">{i.customer}</td>
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{i.carrier}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{i.trackingNo}</td>
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{i.issue}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium tabular-nums",
                        i.daysOpen >= 5 ? "bg-red-500/15 text-red-700" :
                        i.daysOpen >= 3 ? "bg-amber-500/15 text-amber-700" :
                        "bg-emerald-500/15 text-emerald-700",
                      )}
                    >
                      {i.daysOpen}日
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <select
                      value={i.status}
                      onChange={(e) => updateIssueStatus(i.id, e.target.value as IssueStatus)}
                      className={cn(
                        "h-6 px-1.5 rounded-lg text-xs font-medium border focus:outline-none",
                        i.status === "新規" ? "bg-blue-500/10 border-blue-300/50 text-blue-700" :
                        i.status === "対応中" ? "bg-amber-500/10 border-amber-300/50 text-amber-700" :
                        i.status === "保留" ? "bg-gray-500/10 border-gray-300/50 text-gray-700" :
                        "bg-emerald-500/10 border-emerald-300/50 text-emerald-700",
                      )}
                    >
                      {(["新規", "対応中", "保留", "解決済"] as IssueStatus[]).map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{i.assignee}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex justify-center gap-1">
                      <a
                        href={CARRIER_TRACKING_URL[i.carrier] ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        title="配送業者サイトで追跡"
                        className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-500 hover:text-blue-600"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => handleReplyMail(i)}
                        title="顧客へ返信メール送信"
                        className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-500 hover:text-blue-600"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleInvestigationRequest(i)}
                        title="配送業者へ調査依頼"
                        className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-500 hover:text-amber-600"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => updateIssueStatus(i.id, i.status === "解決済" ? "対応中" : "解決済")}
                        title={i.status === "解決済" ? "解決取消" : "解決済みにする"}
                        className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-500 hover:text-emerald-600"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>

      {/* 新規問合せ登録モーダル */}
      <Modal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="新規問合せ登録"
        footer={
          <>
            <SecondaryButton onClick={() => setNewModalOpen(false)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={handleNewSubmit}>
              <Plus className="h-4 w-4" />登録
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="受注番号" required>
              <input
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                placeholder="ORD-2026-XXXXX"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </Field>
            <Field label="顧客名" required>
              <input
                value={form.customer}
                onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
                placeholder="山田 太郎"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </Field>
            <Field label="配送業者">
              <select
                value={form.carrier}
                onChange={(e) => setForm((f) => ({ ...f, carrier: e.target.value }))}
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {["ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="追跡番号" required>
              <input
                value={form.trackingNo}
                onChange={(e) => setForm((f) => ({ ...f, trackingNo: e.target.value }))}
                placeholder="1234-5678-9012"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </Field>
            <Field label="問題種別">
              <select
                value={form.issue}
                onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value as IssueType }))}
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {(["未到着遅延", "誤配送疑い", "破損連絡", "番号無効", "再配達依頼"] as IssueType[]).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="担当者">
              <input
                value={form.assignee}
                onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                placeholder="佐藤 健（省略可）"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-xs text-red-500 font-semibold">必須</span>}
      </label>
      {children}
    </div>
  );
}
