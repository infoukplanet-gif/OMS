"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Mail, Send, History, CheckCircle2, AlertCircle } from "lucide-react";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import { paymentConfirmMailHistoryStore } from "@/lib/stores/payment-confirm-mail-history";
import { INITIAL_PAYMENT_CONFIRM_MAIL_HISTORY } from "@/lib/seeds/payment-confirm-mail-history";
import { mailQueue, type MailJob } from "@/lib/mail/queue";

type Pending = {
  id: string;
  order: string;
  customer: string;
  email: string;
  amount: number;
  paidAt: string;
  selected: boolean;
};

const INITIAL: Pending[] = [
  { id: "1", order: "ORD-2026-00851", customer: "山田太郎", email: "yamada@example.com", amount: 32400, paidAt: "2026-04-25", selected: true },
  { id: "2", order: "ORD-2026-00830", customer: "山田太郎", email: "yamada@example.com", amount: 18200, paidAt: "2026-04-25", selected: true },
  { id: "3", order: "ORD-2026-00824", customer: "佐藤花子", email: "sato@example.com", amount: 38400, paidAt: "2026-04-25", selected: true },
  { id: "4", order: "ORD-2026-00820", customer: "中村あかり", email: "nakamura@example.com", amount: 12800, paidAt: "2026-04-24", selected: false },
];

const fmt = (n: number) => `¥${n.toLocaleString()}`;
const pad = (n: number) => String(n).padStart(2, "0");

export default function PaymentEmailConfirmPage() {
  const toast = useToast();

  // 永続化（domain: "payment-confirm-mail-history"）の正規オーナーページ。
  usePersistentStore({
    store: paymentConfirmMailHistoryStore,
    domain: "payment-confirm-mail-history",
    seed: INITIAL_PAYMENT_CONFIRM_MAIL_HISTORY,
  });

  const history = useSyncExternalStore(
    (cb) => paymentConfirmMailHistoryStore.subscribe(cb),
    () => paymentConfirmMailHistoryStore.getState(),
    () => INITIAL_PAYMENT_CONFIRM_MAIL_HISTORY,
  );
  // 新しいバッチを上に表示（at は文字列比較で降順ソート可能）。
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)),
    [history],
  );

  const [rows, setRows] = useState<Pending[]>(INITIAL);
  const [template, setTemplate] = useState("入金確認メール（標準）");
  const [sender, setSender] = useState("OMSサポート <support@example.com>");

  const toggle = (id: string) => setRows(rows.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  const toggleAll = (v: boolean) => setRows(rows.map((r) => ({ ...r, selected: v })));

  const selected = rows.filter((r) => r.selected);

  const send = () => {
    if (selected.length === 0) {
      toast.show("送信対象が選択されていません");
      return;
    }
    if (!sender.includes("@")) {
      toast.show("差出人のメールアドレス形式が不正です", "error");
      return;
    }

    // 実 enqueue: 選択受注を入金確認メール（payment-confirmed）として共有 mailQueue へ投入。
    // 手動一括送信なので自動トリガー設定では抑止せず、(orderId, triggerType) で二重送信のみ防ぐ。
    const jobs: MailJob[] = selected.map((r) => ({
      orderId: r.order,
      triggerType: "payment-confirmed",
      dedupeKey: `${r.order}:payment-confirmed`,
    }));
    const result = mailQueue.enqueueAll(jobs);

    // 送信バッチを共有ストアへ永続化（送信履歴に実レコードとして残す）。
    const now = new Date();
    const at = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const id = `MAILB-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    paymentConfirmMailHistoryStore.upsert({
      id,
      at,
      target: `${result.enqueued}件`,
      count: result.enqueued,
      template,
      status: result.duplicateSkipped > 0 ? "partial" : "success",
      duplicateSkipped: result.duplicateSkipped,
    });

    // 送信済み行は選択解除（再送の二重チェックを避ける）。
    setRows(rows.map((r) => (r.selected ? { ...r, selected: false } : r)));

    if (result.enqueued === 0) {
      toast.show("選択した受注はすべて送信済みのためスキップしました", "info");
    } else if (result.duplicateSkipped > 0) {
      toast.show(`${result.enqueued}件を送信キューへ投入（${result.duplicateSkipped}件は送信済みでスキップ）`, "info");
    } else {
      toast.show(`${result.enqueued}件を送信キューへ投入しました（${template}）`, "success");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">入金確認メール送信</h1>
            <HelpHint>
              入金が確認できた受注について、お客様に「入金確認メール」を一括送信します。{"\n"}
              テンプレート選択・宛先確認・送信履歴管理に対応しています。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            選択中: <span className="font-semibold text-blue-700">{selected.length}件</span> / 全{rows.length}件
          </p>
        </div>
        <PrimaryButton onClick={send}>
          <Send className="h-4 w-4" />選択した{selected.length}件に送信
        </PrimaryButton>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">送信設定</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">使用するテンプレート</label>
            <select value={template} onChange={(e) => setTemplate(e.target.value)} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["入金確認メール（標準）", "入金確認メール（VIP用）", "入金確認メール（卸先）", "入金確認メール（英語）"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">差出人</label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/40 bg-white/30">
          <h2 className="text-sm font-semibold text-gray-800">送信対象</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={rows.every((r) => r.selected)}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="accent-blue-500 w-4 h-4"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">メール</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">入金額</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">入金日</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={cn("border-t border-white/30 hover:bg-white/40", r.selected && "bg-blue-500/8")}>
                <td className="px-3 py-2.5 text-center">
                  <input type="checkbox" checked={r.selected} onChange={() => toggle(r.id)} className="accent-blue-500 w-4 h-4" />
                </td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{r.order}</td>
                <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{r.email}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 font-medium">{fmt(r.amount)}</td>
                <td className="px-3 py-2.5 text-xs text-gray-500">{r.paidAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">送信履歴</h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">日時</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">対象</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">テンプレート</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">結果</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.map((h) => (
                <tr key={h.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2 text-xs text-gray-700 tabular-nums">{h.at}</td>
                  <td className="px-3 py-2 text-gray-700 text-xs">{h.target}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{h.template}</td>
                  <td className="px-3 py-2 text-center">
                    {h.status === "partial" ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700">
                        <AlertCircle className="h-3 w-3" />
                        一部スキップ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        正常
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
