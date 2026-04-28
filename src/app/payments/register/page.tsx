"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Plus, Search, Banknote, History } from "lucide-react";

type Reg = {
  id: string;
  order: string;
  customer: string;
  amount: number;
  paidAt: string;
  method: string;
  bank: string;
  by: string;
  status: "確定" | "保留" | "差戻し";
};

const REGS: Reg[] = [
  { id: "PR-2026-0184", order: "ORD-2026-00830", customer: "山田太郎", amount: 18200, paidAt: "2026-04-25 11:24", method: "銀行振込", bank: "三井住友銀行 / 普通 / 1234567", by: "佐藤 健", status: "確定" },
  { id: "PR-2026-0183", order: "ORD-2026-00824", customer: "佐藤花子", amount: 38400, paidAt: "2026-04-25 10:42", method: "銀行振込", bank: "三井住友銀行 / 普通 / 1234567", by: "佐藤 健", status: "確定" },
  { id: "PR-2026-0182", order: "ORD-2026-00820", customer: "中村あかり", amount: 12800, paidAt: "2026-04-24 16:18", method: "クレカ", bank: "Stripe", by: "システム", status: "確定" },
  { id: "PR-2026-0181", order: "ORD-2026-00811", customer: "井上智", amount: 25000, paidAt: "2026-04-24 14:08", method: "銀行振込", bank: "みずほ銀行 / 当座 / 0987654", by: "鈴木 美咲", status: "保留" },
  { id: "PR-2026-0180", order: "ORD-2026-00800", customer: "高橋健", amount: 8400, paidAt: "2026-04-23 09:00", method: "代引", bank: "ヤマト集金", by: "システム", status: "確定" },
  { id: "PR-2026-0179", order: "ORD-2026-00795", customer: "田中花子", amount: 4800, paidAt: "2026-04-22 15:32", method: "銀行振込", bank: "三井住友銀行 / 普通 / 1234567", by: "佐藤 健", status: "差戻し" },
];

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function PaymentRegisterPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [methodFilter, setMethodFilter] = useState("すべて");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return REGS.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k) && !r.id.toLowerCase().includes(k)) return false;
      if (methodFilter !== "すべて" && r.method !== methodFilter) return false;
      return true;
    });
  }, [keyword, methodFilter]);

  const stats = {
    today: REGS.filter((r) => r.paidAt.startsWith("2026-04-25")).length,
    total: REGS.reduce((s, r) => s + r.amount, 0),
    pending: REGS.filter((r) => r.status === "保留").length,
    bounced: REGS.filter((r) => r.status === "差戻し").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">入金登録</h1>
            <HelpHint>
              個別の入金記録を登録・編集します。{"\n"}
              CSV取込で一括登録したい場合は「一括入金処理」を使用してください。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            登録済み: <span className="font-semibold">{REGS.length}件</span> ／ 本日:{" "}
            <span className="font-semibold text-emerald-700">{stats.today}件</span>
          </p>
        </div>
        <Link
          href="/payments/register/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
        >
          <Plus className="h-4 w-4" />新規登録
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">本日の登録</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.today}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">登録合計額</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{fmt(stats.total)}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">保留中</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.pending}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">差戻し</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.bounced}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="登録ID・受注番号・顧客名"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">支払方法</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "銀行振込", "クレカ", "代引", "コンビニ", "ペイディ"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/40 bg-white/30">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">入金登録ログ</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">登録ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">入金額</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">入金日時</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">方法</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">入金元</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">登録者</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{r.id}</td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{r.order}</td>
                <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 font-medium">{fmt(r.amount)}</td>
                <td className="px-3 py-2.5 text-xs text-gray-700 tabular-nums">{r.paidAt}</td>
                <td className="px-3 py-2.5 text-center text-xs">{r.method}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{r.bank}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{r.by}</td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      r.status === "確定" && "bg-emerald-500/15 text-emerald-700",
                      r.status === "保留" && "bg-amber-500/15 text-amber-700",
                      r.status === "差戻し" && "bg-red-500/15 text-red-700"
                    )}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Link
                    href={`/payments/register/${r.id}/edit`}
                    onClick={(e) => { e.preventDefault(); toast.show(`${r.id} の編集画面を開きます`); }}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                  >
                    編集
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Banknote className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">登録時の自動処理</h2>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          {[
            "受注ステータスを「入金済」へ自動更新",
            "売掛金台帳から該当行を消込",
            "顧客への入金完了メールを送信（メールONの場合）",
            "差額発生時は「金額不整合」へ自動移動",
            "監査ログに登録",
          ].map((s) => (
            <li key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50">
              <Banknote className="h-3.5 w-3.5 text-emerald-600 shrink-0" />{s}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
