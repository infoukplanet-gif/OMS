"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, AlertCircle, RefreshCw, Phone, ExternalLink, MessageSquare } from "lucide-react";

type Issue = {
  id: string;
  order: string;
  customer: string;
  carrier: string;
  trackingNo: string;
  issue: "未到着遅延" | "誤配送疑い" | "破損連絡" | "番号無効" | "再配達依頼";
  daysOpen: number;
  status: "新規" | "対応中" | "解決済" | "保留";
  assignee: string;
  lastUpdate: string;
};

const ISSUES: Issue[] = [
  { id: "TS-001", order: "ORD-2026-00824", customer: "山田太郎", carrier: "ヤマト運輸", trackingNo: "1234-5678-9012", issue: "未到着遅延", daysOpen: 5, status: "対応中", assignee: "佐藤 健", lastUpdate: "2026-04-25 09:24" },
  { id: "TS-002", order: "ORD-2026-00811", customer: "佐藤花子", carrier: "佐川急便", trackingNo: "9876-5432-1098", issue: "誤配送疑い", daysOpen: 3, status: "対応中", assignee: "鈴木 美咲", lastUpdate: "2026-04-25 11:42" },
  { id: "TS-003", order: "ORD-2026-00798", customer: "田中一郎", carrier: "日本郵便", trackingNo: "5555-4444-3333", issue: "破損連絡", daysOpen: 1, status: "新規", assignee: "—", lastUpdate: "2026-04-24 17:18" },
  { id: "TS-004", order: "ORD-2026-00775", customer: "鈴木美咲", carrier: "ヤマト運輸", trackingNo: "INVALID-NUMBER", issue: "番号無効", daysOpen: 7, status: "保留", assignee: "田中 花子", lastUpdate: "2026-04-22 14:08" },
  { id: "TS-005", order: "ORD-2026-00762", customer: "高橋健", carrier: "佐川急便", trackingNo: "1111-2222-3333", issue: "再配達依頼", daysOpen: 0, status: "解決済", assignee: "佐藤 健", lastUpdate: "2026-04-25 10:00" },
  { id: "TS-006", order: "ORD-2026-00754", customer: "渡辺京子", carrier: "ヤマト運輸", trackingNo: "8888-9999-0000", issue: "未到着遅延", daysOpen: 4, status: "対応中", assignee: "高橋 翔", lastUpdate: "2026-04-25 08:42" },
];

const CARRIER_TRACKING_URL: Record<string, string> = {
  "ヤマト運輸": "https://toi.kuronekoyamato.co.jp/cgi-bin/tneko",
  "佐川急便": "https://k2k.sagawa-exp.co.jp/p/web/okurijoinput.do",
  "日本郵便": "https://trackings.post.japanpost.jp/services/srv/search/",
};

export default function ShipmentsTrackingSupportPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"すべて" | "新規" | "対応中" | "保留" | "解決済">("対応中");
  const [issueFilter, setIssueFilter] = useState("すべて");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return ISSUES.filter((i) => {
      if (k && !i.order.toLowerCase().includes(k) && !i.customer.toLowerCase().includes(k) && !i.trackingNo.toLowerCase().includes(k)) return false;
      if (statusFilter !== "すべて" && i.status !== statusFilter) return false;
      if (issueFilter !== "すべて" && i.issue !== issueFilter) return false;
      return true;
    });
  }, [keyword, statusFilter, issueFilter]);

  const stats = {
    open: ISSUES.filter((i) => i.status === "新規" || i.status === "対応中").length,
    overdue: ISSUES.filter((i) => i.daysOpen >= 5 && i.status !== "解決済").length,
    new: ISSUES.filter((i) => i.status === "新規").length,
    avgDays: Math.round(ISSUES.filter((i) => i.status !== "解決済").reduce((s, i) => s + i.daysOpen, 0) / Math.max(1, ISSUES.filter((i) => i.status !== "解決済").length)),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">配送番号サポート</h1>
            <HelpHint>
              配送中の問い合わせ・トラブル（未到着・誤配送・破損・無効番号など）を一元管理します。{"\n"}
              配送業者の追跡サイトへのリンクと、お客様への返信テンプレートも用意。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未解決: <span className="font-semibold text-amber-700">{stats.open}件</span> ／ 5日以上滞留:{" "}
            <span className="font-semibold text-red-700">{stats.overdue}件</span>
          </p>
        </div>
        <PrimaryButton onClick={() => toast.show("新規問合せ登録モーダルを開きました")}>
          <AlertCircle className="h-4 w-4" />新規問合せ登録
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">未解決</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.open}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">5日以上滞留</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.overdue}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">未着手（新規）</p><p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{stats.new}</p></GlassCard>
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
                        i.daysOpen >= 5 && "bg-red-500/15 text-red-700",
                        i.daysOpen >= 3 && i.daysOpen < 5 && "bg-amber-500/15 text-amber-700",
                        i.daysOpen < 3 && "bg-emerald-500/15 text-emerald-700"
                      )}
                    >
                      {i.daysOpen}日
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        i.status === "新規" && "bg-blue-500/15 text-blue-700",
                        i.status === "対応中" && "bg-amber-500/15 text-amber-700",
                        i.status === "保留" && "bg-gray-500/15 text-gray-700",
                        i.status === "解決済" && "bg-emerald-500/15 text-emerald-700"
                      )}
                    >
                      {i.status}
                    </span>
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
                        onClick={() => toast.show(`${i.customer} さんへの返信メールを準備中`)}
                        title="顧客へ連絡"
                        className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-500 hover:text-blue-600"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toast.show("配送業者へ調査依頼を送信しました")}
                        title="業者へ調査依頼"
                        className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-500 hover:text-blue-600"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toast.show("ステータスを更新しました")}
                        title="ステータス更新"
                        className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-500 hover:text-blue-600"
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
    </div>
  );
}
